using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
using OnlineBookShop.Server.Services;

namespace OnlineBookShop.Server.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStockHistoryService _stockHistoryService;
        private readonly INotificationService _notificationService;
        private readonly ICouponService _couponService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;

        public OrderService(
            IUnitOfWork unitOfWork,
            IStockHistoryService stockHistoryService,
            INotificationService notificationService,
            ICouponService couponService,
            IEmailService emailService,
            IMapper mapper,
            IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _stockHistoryService = stockHistoryService;
            _notificationService = notificationService;
            _couponService = couponService;
            _emailService = emailService;
            _mapper = mapper;
            _cache = cache;
        }

        // Customer: Create new order
        public async Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto dto, int userId)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                throw new InvalidOperationException("Order must contain at least one item.");

            // Address must belong to the caller — otherwise an ID lets a customer ship to / read someone else's address.
            var addressExists = await _unitOfWork.Repository<Address>()
                .GetQueryable()
                .AnyAsync(a => a.AddressId == dto.AddressId && a.UserId == userId);

            if (!addressExists)
                throw new InvalidOperationException("Selected address is not valid for this account.");

            Order order;
            var lowStockAlerts = new List<(int BookId, int NewStock, string Title, int VendorUserId)>();

            await using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    order = new Order
                    {
                        UserId = userId,
                        AddressId = dto.AddressId,
                        OrderDate = DateTime.UtcNow,
                        Status = OrderStatus.Pending,
                        TotalAmount = 0m
                    };

                    order.StatusHistories.Add(new OrderStatusHistory
                    {
                        Status = OrderStatus.Pending,
                        ChangedAt = order.OrderDate
                    });

                    var orderItems = new List<OrderItem>();
                    var stockChanges = new List<(int BookId, int OldStock, int NewStock, int Quantity, int LowStockThreshold, string Title, int VendorUserId)>();
                    var subtotal = 0m;

                    foreach (var itemDto in dto.Items)
                    {
                        if (itemDto.Quantity <= 0)
                            throw new InvalidOperationException("Quantity must be greater than zero.");

                        var book = await _unitOfWork.Repository<Book>()
                            .GetQueryable()
                            .Include(b => b.Vendor)
                            .AsNoTracking()
                            .FirstOrDefaultAsync(b => b.BookId == itemDto.BookId)
                            ?? throw new KeyNotFoundException($"Book ID {itemDto.BookId} not found");

                        if (book.IsDeleted || !book.IsActive)
                            throw new InvalidOperationException($"'{book.Title}' is no longer available.");

                        // Conditional update guarantees one writer wins and stock never goes negative.
                        var affected = await _unitOfWork.ExecuteSqlInterpolatedAsync($@"
                            UPDATE Books
                            SET Stock = Stock - {itemDto.Quantity}
                            WHERE BookId = {book.BookId}
                              AND IsDeleted = 0
                              AND IsActive = 1
                              AND Stock >= {itemDto.Quantity}");

                        if (affected == 0)
                            throw new InvalidOperationException(
                                $"Insufficient stock for '{book.Title}' (Available: {book.Stock}, Requested: {itemDto.Quantity})");

                        var unitPrice = book.DiscountPrice.HasValue && book.DiscountPrice.Value < book.Price
                            ? book.DiscountPrice.Value
                            : book.Price;

                        var orderItem = new OrderItem
                        {
                            BookId = book.BookId,
                            Quantity = itemDto.Quantity,
                            Price = unitPrice
                        };

                        orderItems.Add(orderItem);
                        subtotal += orderItem.Quantity * orderItem.Price;
                        stockChanges.Add((
                            book.BookId,
                            book.Stock,
                            book.Stock - itemDto.Quantity,
                            itemDto.Quantity,
                            book.LowStockThreshold,
                            book.Title,
                            book.Vendor.UserId));
                    }

                    order.SubtotalAmount = subtotal;
                    order.TotalAmount = subtotal;

                    CouponValidationDto? appliedCoupon = null;
                    if (!string.IsNullOrWhiteSpace(dto.CouponCode))
                    {
                        appliedCoupon = await _couponService.ValidateForOrderAsync(
                            dto.CouponCode, userId, subtotal);

                        order.CouponId = appliedCoupon.CouponId;
                        order.CouponCode = appliedCoupon.Code;
                        order.DiscountAmount = appliedCoupon.DiscountAmount;
                        order.TotalAmount = appliedCoupon.TotalAmount;
                    }

                    order.OrderItems = orderItems;
                    _unitOfWork.Repository<Order>().Add(order);
                    await _unitOfWork.SaveChangesAsync();

                    if (appliedCoupon != null)
                        await _couponService.RedeemAsync(appliedCoupon, userId, order.OrderId);

                    foreach (var change in stockChanges)
                    {
                        await _stockHistoryService.AddStockHistoryAsync(
                            bookId: change.BookId,
                            oldStock: change.OldStock,
                            newStock: change.NewStock,
                            reason: "Sale",
                            changedBy: $"Customer ID: {userId}",
                            notes: $"Deducted via Checkout. Ordered Qty: {change.Quantity}",
                            referenceId: order.OrderId,
                            referenceType: "Order");
                    }

                    lowStockAlerts = stockChanges
                        .Where(c => c.OldStock > c.LowStockThreshold && c.NewStock <= c.LowStockThreshold)
                        .Select(c => (c.BookId, c.NewStock, c.Title, c.VendorUserId))
                        .ToList();

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }

            InvalidateBookCaches(order.OrderItems.Select(oi => oi.BookId));

            try
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = userId,
                    Title = "অর্ডার নিশ্চিত হয়েছে ✅",
                    Message = order.DiscountAmount > 0
                        ? $"আপনার অর্ডার #{order.OrderId} সফলভাবে placed হয়েছে। Coupon {order.CouponCode}: ৳{order.DiscountAmount:F0} ছাড়। মোট: ৳{order.TotalAmount:F0}"
                        : $"আপনার অর্ডার #{order.OrderId} সফলভাবে placed হয়েছে। মোট: ৳{order.TotalAmount:F0}"
                });
            }
            catch
            {
                // Order already committed; a failed notification must not fail the checkout.
            }

            foreach (var alert in lowStockAlerts)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        UserId = alert.VendorUserId,
                        Title = alert.NewStock == 0 ? "Book out of stock" : "Low stock warning",
                        Message = alert.NewStock == 0
                            ? $"'{alert.Title}' is now out of stock. Restock it to keep selling."
                            : $"Only {alert.NewStock} copies of '{alert.Title}' left. Time to restock."
                    });
                }
                catch
                {
                    // Stock is already committed; alert delivery is best-effort.
                }
            }

            var orderDto = await GetOrderByIdAsync(order.OrderId, userId)
                ?? _mapper.Map<OrderResponseDto>(order);

            try
            {
                await SendOrderEmailAsync(orderDto, "confirmation");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Order confirmation email failed for order #{order.OrderId}: {ex.Message}");
            }

            return orderDto;
        }

        // Customer: Get specific order
        public async Task<OrderResponseDto?> GetOrderByIdAsync(int orderId, int userId)
        {
            var order = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Include(o => o.Address)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

            return order == null ? null : _mapper.Map<OrderResponseDto>(order);
        }

        // Customer: Get my orders
        public async Task<List<OrderResponseDto>> GetUserOrdersAsync(int userId)
        {
            var orders = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Include(o => o.Address)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return _mapper.Map<List<OrderResponseDto>>(orders);
        }

        // Vendor: Get vendor orders (only the requester's own items and totals)
        public async Task<List<OrderResponseDto>> GetVendorOrdersAsync(int vendorId)
        {
            var vendorBookIds = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .AsNoTracking()
                .Where(b => b.VendorId == vendorId)
                .Select(b => b.BookId)
                .ToListAsync();

            var orders = await _unitOfWork.Repository<OrderItem>()
                .GetQueryable()
                .Include(oi => oi.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.Book)
                .Include(oi => oi.Order)
                    .ThenInclude(o => o.Address)
                .Where(oi => oi.Book.VendorId == vendorId)
                .Select(oi => oi.Order)
                .Distinct()
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            var dtos = _mapper.Map<List<OrderResponseDto>>(orders);

            // A vendor must never see another vendor's line items or totals.
            foreach (var dto in dtos)
            {
                dto.Items = dto.Items
                    .Where(i => vendorBookIds.Contains(i.BookId))
                    .ToList();

                var ownTotal = dto.Items.Sum(i => i.Price * i.Quantity);
                dto.SubtotalAmount = ownTotal;
                dto.DiscountAmount = 0m;
                dto.TotalAmount = ownTotal;
                dto.CouponCode = null;
            }

            return dtos;
        }

        // Customer: Cancel order
        public async Task CancelOrderAsync(int orderId, int userId)
        {
            List<int> bookIds = new();

            await using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    var order = await _unitOfWork.Repository<Order>()
                        .GetQueryable()
                        .Include(o => o.OrderItems)
                            .ThenInclude(oi => oi.Book)
                        .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId)
                        ?? throw new KeyNotFoundException("Order not found or does not belong to this user");

                    if (order.Status != OrderStatus.Pending)
                        throw new InvalidOperationException(
                            $"Order cannot be cancelled in {order.Status} status");

                    // Entity is tracked; mutating Status is persisted. Calling Update(order)
                    // here would mark the included Books as Modified and overwrite the
                    // raw stock increments below with stale values.
                    order.Status = OrderStatus.Cancelled;

                    _unitOfWork.Repository<OrderStatusHistory>().Add(new OrderStatusHistory
                    {
                        OrderId = orderId,
                        Status = OrderStatus.Cancelled,
                        ChangedAt = DateTime.UtcNow
                    });

                    foreach (var item in order.OrderItems)
                    {
                        await _unitOfWork.ExecuteSqlInterpolatedAsync(
                            $"UPDATE Books SET Stock = Stock + {item.Quantity} WHERE BookId = {item.BookId}");

                        if (item.Book != null)
                        {
                            int oldStock = item.Book.Stock;

                            await _stockHistoryService.AddStockHistoryAsync(
                                bookId: item.Book.BookId,
                                oldStock: oldStock,
                                newStock: oldStock + item.Quantity,
                                reason: "Return",
                                changedBy: $"Customer ID: {userId}",
                                notes: $"Restored stock due to Order Cancellation. Order ID: {orderId}",
                                referenceId: orderId,
                                referenceType: "OrderCancellation"
                            );

                            bookIds.Add(item.Book.BookId);
                        }
                    }

                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }

            InvalidateBookCaches(bookIds);

            try
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = userId,
                    Title = "অর্ডার বাতিল হয়েছে ❌",
                    Message = $"আপনার অর্ডার #{orderId} বাতিল করা হয়েছে। Stock ফেরত দেওয়া হয়েছে।"
                });
            }
            catch
            {
                // Cancellation already committed; ignore notification failures.
            }
        }

        private async Task SendOrderEmailAsync(OrderResponseDto orderDto, string kind)
        {
            var user = await _unitOfWork.Repository<AppUser>().GetByIdAsync(orderDto.UserId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
            {
                Console.WriteLine($"[Email] User {orderDto.UserId} has no email — skipping {kind} email for order #{orderDto.OrderId}.");
                return;
            }

            var info = new OrderEmailInfoDto
            {
                ToEmail = user.Email,
                UserName = user.UserName ?? "Customer",
                OrderId = orderDto.OrderId,
                OrderDate = orderDto.OrderDate,
                Items = orderDto.Items.Select(i => new OrderEmailItemDto
                {
                    Title = i.Title,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList(),
                SubtotalAmount = orderDto.SubtotalAmount,
                DiscountAmount = orderDto.DiscountAmount,
                TotalAmount = orderDto.TotalAmount,
                CouponCode = orderDto.CouponCode,
                ShippingAddress = orderDto.Address == null
                    ? null
                    : string.Join(", ", new[]
                    {
                        orderDto.Address.Street,
                        orderDto.Address.City,
                        orderDto.Address.StateOrDivision,
                        orderDto.Address.PostalCode,
                        orderDto.Address.Country
                    }.Where(s => !string.IsNullOrWhiteSpace(s))),
                Status = orderDto.Status.ToString()
            };

            if (kind == "confirmation")
                await _emailService.SendOrderConfirmationEmailAsync(info);
            else
                await _emailService.SendOrderStatusEmailAsync(info);
        }

        private void InvalidateBookCaches(IEnumerable<int> bookIds)
        {
            _cache.Remove(CacheKeys.AllBooks);
            foreach (var bookId in bookIds.Distinct())
                _cache.Remove(CacheKeys.BookById(bookId));
        }

        // Vendor/Admin: Update order status
        //public async Task UpdateOrderStatusAsync(int orderId, OrderStatus newStatus)
        //{
        //    var order = await _unitOfWork.Repository<Order>()
        //        .GetByIdAsync(orderId)
        //        ?? throw new KeyNotFoundException("Order not found");

        //    if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Pending)
        //        throw new InvalidOperationException("Only pending orders can be cancelled");

        //    order.Status = newStatus;
        //    _unitOfWork.Repository<Order>().Update(order);
        //    await _unitOfWork.SaveChangesAsync();

        //    // ✅ Status অনুযায়ী Customer কে notification
        //    var (title, message) = newStatus switch
        //    {
        //        OrderStatus.Paid => ("পেমেন্ট সফল 💳",
        //                                  $"অর্ডার #{orderId} এর পেমেন্ট নিশ্চিত হয়েছে।"),
        //        OrderStatus.Shipped => ("অর্ডার পাঠানো হয়েছে 🚚",
        //                                  $"অর্ডার #{orderId} shipped হয়েছে। শীঘ্রই পৌঁছাবে।"),
        //        OrderStatus.Delivered => ("অর্ডার পৌঁছে গেছে 📦",
        //                                  $"অর্ডার #{orderId} সফলভাবে delivered হয়েছে। ধন্যবাদ!"),
        //        OrderStatus.Cancelled => ("অর্ডার বাতিল ❌",
        //                                  $"অর্ডার #{orderId} বাতিল করা হয়েছে।"),
        //        _ => ("অর্ডার আপডেট 🔔",
        //                                  $"অর্ডার #{orderId} এর status: {newStatus}")
        //    };

        //    await _notificationService.CreateNotificationAsync(new CreateNotificationDto
        //    {
        //        UserId = order.UserId,
        //        Title = title,
        //        Message = message
        //    });
        //}
        // Vendor/Admin: Update order status
        public async Task UpdateOrderStatusAsync(int orderId, OrderStatus newStatus)
        {
            var order = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Include(o => o.AppUser)
                .Include(o => o.Address)
                .FirstOrDefaultAsync(o => o.OrderId == orderId)
                ?? throw new KeyNotFoundException("Order not found");

            if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Only pending orders can be cancelled");

            // Tracked entity: do not call Update(order), it would mark the included
            // Books as Modified and can overwrite concurrent stock changes.
            var statusChanged = order.Status != newStatus;
            order.Status = newStatus;

            if (statusChanged)
            {
                _unitOfWork.Repository<OrderStatusHistory>().Add(new OrderStatusHistory
                {
                    OrderId = orderId,
                    Status = newStatus,
                    ChangedAt = DateTime.UtcNow
                });
            }

            var bookIds = new List<int>();

            // Cancelling restores the stock that checkout reserved.
            if (statusChanged && newStatus == OrderStatus.Cancelled)
            {
                foreach (var item in order.OrderItems)
                {
                    await _unitOfWork.ExecuteSqlInterpolatedAsync(
                        $"UPDATE Books SET Stock = Stock + {item.Quantity} WHERE BookId = {item.BookId}");

                    if (item.Book != null)
                    {
                        int oldStock = item.Book.Stock;

                        await _stockHistoryService.AddStockHistoryAsync(
                            bookId: item.Book.BookId,
                            oldStock: oldStock,
                            newStock: oldStock + item.Quantity,
                            reason: "Return",
                            changedBy: "Admin",
                            notes: $"Restored stock due to Order Cancellation. Order ID: {orderId}",
                            referenceId: orderId,
                            referenceType: "OrderCancellation"
                        );

                        bookIds.Add(item.Book.BookId);
                    }
                }
            }

            //  Delivered hole VendorEarning create koro
            if (newStatus == OrderStatus.Delivered)
            {
                var orderItemIds = order.OrderItems.Select(i => i.OrderItemId).ToList();
                var alreadyCredited = await _unitOfWork.Repository<VendorEarning>()
                    .GetQueryable()
                    .Where(e => orderItemIds.Contains(e.OrderItemId))
                    .Select(e => e.OrderItemId)
                    .ToListAsync();

                foreach (var item in order.OrderItems)
                {
                    if (item.Book == null || alreadyCredited.Contains(item.OrderItemId)) continue;

                    var gross = item.Price * item.Quantity;
                    var commission = gross * 0.10m; // CommissionRate — pore Category theke dynamic korte parbe
                    var net = gross - commission;

                    var earning = new VendorEarning
                    {
                        VendorId = item.Book.VendorId,
                        OrderItemId = item.OrderItemId,
                        GrossAmount = gross,
                        CommissionAmount = commission,
                        NetAmount = net,
                        EarnedAt = DateTime.UtcNow
                    };

                    _unitOfWork.Repository<VendorEarning>().Add(earning);
                }
            }

            await _unitOfWork.SaveChangesAsync();

            if (bookIds.Count > 0)
                InvalidateBookCaches(bookIds);

            await NotifyStatusChangedAsync(order, newStatus);
        }

        // Vendor: update status only for orders containing their own products.
        // Earnings are generated only for the vendor's own line items.
        public async Task UpdateOrderStatusForVendorAsync(int orderId, int vendorUserId, OrderStatus newStatus)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetFirstOrDefaultAsync(v => v.UserId == vendorUserId)
                ?? throw new UnauthorizedAccessException("Vendor profile not found");

            if (!vendor.IsApproved || !vendor.IsActive)
                throw new UnauthorizedAccessException("Vendor account is not active");

            var order = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Include(o => o.AppUser)
                .Include(o => o.Address)
                .FirstOrDefaultAsync(o => o.OrderId == orderId)
                ?? throw new KeyNotFoundException("Order not found");

            var ownItems = order.OrderItems
                .Where(oi => oi.Book != null && oi.Book.VendorId == vendor.VendorId)
                .ToList();

            if (ownItems.Count == 0)
                throw new UnauthorizedAccessException("This order does not contain any of your products");

            // Vendors may never mark an order Paid or Delivered themselves:
            // Paid is payment confirmation and Delivered credits vendor earnings — both are Admin-side.
            var allowed = newStatus switch
            {
                OrderStatus.Shipped => order.Status == OrderStatus.Paid,
                OrderStatus.Cancelled => order.Status == OrderStatus.Pending,
                _ => false
            };

            if (!allowed)
                throw new InvalidOperationException($"Cannot change order from {order.Status} to {newStatus}");

            var statusChanged = order.Status != newStatus;
            order.Status = newStatus;

            if (statusChanged)
            {
                _unitOfWork.Repository<OrderStatusHistory>().Add(new OrderStatusHistory
                {
                    OrderId = orderId,
                    Status = newStatus,
                    ChangedAt = DateTime.UtcNow
                });
            }

            var restoredBookIds = new List<int>();

            // Cancelling the order restores stock for every line item,
            // not just this vendor's products.
            if (statusChanged && newStatus == OrderStatus.Cancelled)
            {
                foreach (var item in order.OrderItems)
                {
                    await _unitOfWork.ExecuteSqlInterpolatedAsync(
                        $"UPDATE Books SET Stock = Stock + {item.Quantity} WHERE BookId = {item.BookId}");

                    if (item.Book != null)
                    {
                        int oldStock = item.Book.Stock;

                        await _stockHistoryService.AddStockHistoryAsync(
                            bookId: item.Book.BookId,
                            oldStock: oldStock,
                            newStock: oldStock + item.Quantity,
                            reason: "Return",
                            changedBy: $"Vendor ID: {vendor.VendorId}",
                            notes: $"Restored stock due to Order Cancellation. Order ID: {orderId}",
                            referenceId: orderId,
                            referenceType: "OrderCancellation"
                        );

                        restoredBookIds.Add(item.Book.BookId);
                    }
                }
            }

            if (newStatus == OrderStatus.Delivered)
            {
                // Idempotent per order item: another vendor may have already
                // marked the shared order delivered.
                var ownItemIds = ownItems.Select(i => i.OrderItemId).ToList();
                var alreadyCredited = await _unitOfWork.Repository<VendorEarning>()
                    .GetQueryable()
                    .Where(e => e.VendorId == vendor.VendorId && ownItemIds.Contains(e.OrderItemId))
                    .Select(e => e.OrderItemId)
                    .ToListAsync();

                foreach (var item in ownItems.Where(i => !alreadyCredited.Contains(i.OrderItemId)))
                {
                    var gross = item.Price * item.Quantity;
                    var commission = gross * 0.10m;
                    _unitOfWork.Repository<VendorEarning>().Add(new VendorEarning
                    {
                        VendorId = vendor.VendorId,
                        OrderItemId = item.OrderItemId,
                        GrossAmount = gross,
                        CommissionAmount = commission,
                        NetAmount = gross - commission,
                        EarnedAt = DateTime.UtcNow
                    });
                }
            }

            await _unitOfWork.SaveChangesAsync();

            if (restoredBookIds.Count > 0)
                InvalidateBookCaches(restoredBookIds);

            if (statusChanged)
                await NotifyStatusChangedAsync(order, newStatus);
        }

        private async Task NotifyStatusChangedAsync(Order order, OrderStatus newStatus)
        {
            var orderId = order.OrderId;

            //  Status wise Customer  notification
            var (title, message) = newStatus switch
            {
                OrderStatus.Paid => ("পেমেন্ট সফল 💳",
                                          $"অর্ডার #{orderId} এর পেমেন্ট নিশ্চিত হয়েছে।"),
                OrderStatus.Shipped => ("অর্ডার পাঠানো হয়েছে 🚚",
                                          $"অর্ডার #{orderId} shipped হয়েছে। শীঘ্রই পৌঁছাবে।"),
                OrderStatus.Delivered => ("অর্ডার পৌঁছে গেছে 📦",
                                          $"অর্ডার #{orderId} সফলভাবে delivered হয়েছে। ধন্যবাদ!"),
                OrderStatus.Cancelled => ("অর্ডার বাতিল ❌",
                                          $"অর্ডার #{orderId} বাতিল করা হয়েছে।"),
                _ => ("অর্ডার আপডেট 🔔",
                                          $"অর্ডার #{orderId} এর status: {newStatus}")
            };

            try
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = order.UserId,
                    Title = title,
                    Message = message
                });
            }
            catch
            {
                // Order is already persisted; alert delivery is best-effort.
            }

            if (order.AppUser != null && !string.IsNullOrWhiteSpace(order.AppUser.Email))
            {
                try
                {
                    var orderDto = _mapper.Map<OrderResponseDto>(order);
                    await SendOrderEmailAsync(orderDto, "status");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Order status email failed for order #{orderId}: {ex.Message}");
                }
            }
        }

        // Vendor: Ship order
        public async Task ShipOrderAsync(int orderId, int vendorId)
        {
            var orderItem = await _unitOfWork.Repository<OrderItem>()
                .GetFirstOrDefaultAsync(oi => oi.OrderId == orderId && oi.Book.VendorId == vendorId)
                ?? throw new InvalidOperationException("No items from this vendor in the order");

            var order = await _unitOfWork.Repository<Order>()
                .GetByIdAsync(orderId)
                ?? throw new KeyNotFoundException("Order not found");

            if (order.Status != OrderStatus.Paid)
                throw new InvalidOperationException("Order must be paid before shipping");

            order.Status = OrderStatus.Shipped;
            _unitOfWork.Repository<Order>().Update(order);
            _unitOfWork.Repository<OrderStatusHistory>().Add(new OrderStatusHistory
            {
                OrderId = orderId,
                Status = OrderStatus.Shipped,
                ChangedAt = DateTime.UtcNow
            });
            await _unitOfWork.SaveChangesAsync();

   
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = order.UserId,
                Title = "অর্ডার পাঠানো হয়েছে 🚚",
                Message = $"অর্ডার #{orderId} shipped হয়েছে। শীঘ্রই আপনার কাছে পৌঁছাবে।"
            });




        }
    }
}




//using AutoMapper;
//using Microsoft.EntityFrameworkCore;
//using OnlineBookShop.Server.DTOs;
//using OnlineBookShop.Server.Interfaces;
//using OnlineBookShop.Server.Models;

//namespace OnlineBookShop.Server.Application.Services
//{
//    public class OrderService : IOrderService
//    {
//        private readonly IUnitOfWork _unitOfWork;
//        private readonly IStockHistoryService _stockHistoryService; 
//        private readonly IMapper _mapper;

//        public OrderService(IUnitOfWork unitOfWork, IStockHistoryService stockHistoryService, IMapper mapper)
//        {
//            _unitOfWork = unitOfWork;
//            _stockHistoryService = stockHistoryService; 
//            _mapper = mapper;
//        }

//        // Customer: Create new order
//        public async Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto dto, int userId)
//        {
//            var order = new Order
//            {
//                UserId = userId,
//                AddressId = dto.AddressId,
//                OrderDate = DateTime.UtcNow,
//                Status = OrderStatus.Pending,
//                TotalAmount = 0m
//            };

//            var orderItems = new List<OrderItem>();

//            foreach (var itemDto in dto.Items)
//            {
//                var book = await _unitOfWork.Repository<Book>()
//                    .GetByIdAsync(itemDto.BookId)
//                    ?? throw new KeyNotFoundException($"Book ID {itemDto.BookId} not found");

//                if (book.Stock < itemDto.Quantity)
//                    throw new InvalidOperationException(
//                        $"Insufficient stock for '{book.Title}' (Available: {book.Stock}, Requested: {itemDto.Quantity})");

//                var orderItem = new OrderItem
//                {
//                    BookId = itemDto.BookId,
//                    Quantity = itemDto.Quantity,
//                    Price = book.Price
//                };

//                orderItems.Add(orderItem);
//                order.TotalAmount += orderItem.Quantity * orderItem.Price;


//                int oldStock = book.Stock;

//                book.Stock -= itemDto.Quantity;
//                _unitOfWork.Repository<Book>().Update(book);


//                await _stockHistoryService.AddStockHistoryAsync(
//                    bookId: book.BookId,
//                    oldStock: oldStock,
//                    newStock: book.Stock,
//                    reason: "Sale",
//                    changedBy: $"Customer ID: {userId}",
//                    notes: $"Deducted via Checkout. Ordered Qty: {itemDto.Quantity}",
//                    referenceId: null, 
//                    referenceType: "Order"
//                );
//            }

//            order.OrderItems = orderItems;
//            _unitOfWork.Repository<Order>().Add(order);
//            await _unitOfWork.SaveChangesAsync();


//            foreach (var item in order.OrderItems)
//            {
//                var historyRecord = await _unitOfWork.Repository<StockHistory>()
//                    .GetQueryable()
//                    .FirstOrDefaultAsync(h => h.BookId == item.BookId && h.ReferenceId == null && h.Reason == "Sale");

//                if (historyRecord != null)
//                {
//                    historyRecord.ReferenceId = order.OrderId;
//                    _unitOfWork.Repository<StockHistory>().Update(historyRecord);
//                }
//            }
//            await _unitOfWork.SaveChangesAsync();

//            return _mapper.Map<OrderResponseDto>(order);
//        }

//        // Specific order
//        public async Task<OrderResponseDto?> GetOrderByIdAsync(int orderId, int userId)
//        {
//            var order = await _unitOfWork.Repository<Order>()
//                .GetQueryable()
//                .Include(o => o.OrderItems)
//                    .ThenInclude(oi => oi.Book)
//                .Include(o => o.Address)
//                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);

//            return order == null ? null : _mapper.Map<OrderResponseDto>(order);
//        }

//        // Customer: Get my orders
//        public async Task<List<OrderResponseDto>> GetUserOrdersAsync(int userId)
//        {
//            var orders = await _unitOfWork.Repository<Order>()
//                .GetQueryable()
//                .Include(o => o.OrderItems)
//                    .ThenInclude(oi => oi.Book)
//                .Include(o => o.Address)
//                .Where(o => o.UserId == userId)
//                .OrderByDescending(o => o.OrderDate)
//                .ToListAsync();

//            return _mapper.Map<List<OrderResponseDto>>(orders);
//        }

//        // Vendor: Get vendor orders
//        public async Task<List<OrderResponseDto>> GetVendorOrdersAsync(int vendorId)
//        {
//            var orders = await _unitOfWork.Repository<OrderItem>()
//                .GetQueryable()
//                .Include(oi => oi.Order)
//                    .ThenInclude(o => o.OrderItems)
//                        .ThenInclude(oi => oi.Book)
//                .Include(oi => oi.Order)
//                    .ThenInclude(o => o.Address)
//                .Where(oi => oi.Book.VendorId == vendorId)
//                .Select(oi => oi.Order)
//                .Distinct()
//                .OrderByDescending(o => o.OrderDate)
//                .ToListAsync();

//            return _mapper.Map<List<OrderResponseDto>>(orders);
//        }

//        // Customer: Cancel order
//        public async Task CancelOrderAsync(int orderId, int userId)
//        {
//            var order = await _unitOfWork.Repository<Order>()
//                .GetQueryable()
//                .Include(o => o.OrderItems)
//                    .ThenInclude(oi => oi.Book)
//                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId)
//                ?? throw new KeyNotFoundException("Order not found or does not belong to this user");

//            if (order.Status != OrderStatus.Pending)
//                throw new InvalidOperationException(
//                    $"Order cannot be cancelled in {order.Status} status");

//            order.Status = OrderStatus.Cancelled;

//            foreach (var item in order.OrderItems)
//            {
//                if (item.Book != null)
//                {
//                    int oldStock = item.Book.Stock;

//                    item.Book.Stock += item.Quantity; // ক্যানসেল হওয়ায় স্টক ব্যাক করা হলো
//                    _unitOfWork.Repository<Book>().Update(item.Book);


//                    await _stockHistoryService.AddStockHistoryAsync(
//                        bookId: item.Book.BookId,
//                        oldStock: oldStock,
//                        newStock: item.Book.Stock,
//                        reason: "Return", 
//                        changedBy: $"Customer ID: {userId}",
//                        notes: $"Restored stock due to Order Cancellation. Order ID: {orderId}",
//                        referenceId: orderId,
//                        referenceType: "OrderCancellation"
//                    );
//                }
//            }

//            _unitOfWork.Repository<Order>().Update(order);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        // Vendor/Admin: Update order status
//        public async Task UpdateOrderStatusAsync(int orderId, OrderStatus newStatus)
//        {
//            var order = await _unitOfWork.Repository<Order>()
//                .GetByIdAsync(orderId)
//                ?? throw new KeyNotFoundException("Order not found");

//            if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Pending)
//                throw new InvalidOperationException("Only pending orders can be cancelled");

//            order.Status = newStatus;
//            _unitOfWork.Repository<Order>().Update(order);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        // Vendor: Ship order
//        public async Task ShipOrderAsync(int orderId, int vendorId)
//        {
//            var orderItem = await _unitOfWork.Repository<OrderItem>()
//                .GetFirstOrDefaultAsync(oi => oi.OrderId == orderId && oi.Book.VendorId == vendorId)
//                ?? throw new InvalidOperationException("No items from this vendor in the order");

//            var order = await _unitOfWork.Repository<Order>()
//                .GetByIdAsync(orderId)
//                ?? throw new KeyNotFoundException("Order not found");

//            if (order.Status != OrderStatus.Paid)
//                throw new InvalidOperationException("Order must be paid before shipping");

//            order.Status = OrderStatus.Shipped;
//            _unitOfWork.Repository<Order>().Update(order);
//            await _unitOfWork.SaveChangesAsync();
//        }
//    }
//}