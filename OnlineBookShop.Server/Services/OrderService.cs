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
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;

        public OrderService(
            IUnitOfWork unitOfWork,
            IStockHistoryService stockHistoryService,
            INotificationService notificationService,
            IMapper mapper,
            IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _stockHistoryService = stockHistoryService;
            _notificationService = notificationService;
            _mapper = mapper;
            _cache = cache;
        }

        // Customer: Create new order
        public async Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto dto, int userId)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                throw new InvalidOperationException("Order must contain at least one item.");

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

                    var orderItems = new List<OrderItem>();
                    var stockChanges = new List<(int BookId, int OldStock, int NewStock, int Quantity, int LowStockThreshold, string Title, int VendorUserId)>();

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
                        order.TotalAmount += orderItem.Quantity * orderItem.Price;
                        stockChanges.Add((
                            book.BookId,
                            book.Stock,
                            book.Stock - itemDto.Quantity,
                            itemDto.Quantity,
                            book.LowStockThreshold,
                            book.Title,
                            book.Vendor.UserId));
                    }

                    order.OrderItems = orderItems;
                    _unitOfWork.Repository<Order>().Add(order);
                    await _unitOfWork.SaveChangesAsync();

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
                    Message = $"আপনার অর্ডার #{order.OrderId} সফলভাবে placed হয়েছে। মোট: ৳{order.TotalAmount:F0}"
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

            return await GetOrderByIdAsync(order.OrderId, userId)
                ?? _mapper.Map<OrderResponseDto>(order);
        }

        // Customer: Get specific order
        public async Task<OrderResponseDto?> GetOrderByIdAsync(int orderId, int userId)
        {
            var order = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Book)
                .Include(o => o.Address)
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

        // Vendor: Get vendor orders
        public async Task<List<OrderResponseDto>> GetVendorOrdersAsync(int vendorId)
        {
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

            return _mapper.Map<List<OrderResponseDto>>(orders);
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
                .FirstOrDefaultAsync(o => o.OrderId == orderId)
                ?? throw new KeyNotFoundException("Order not found");

            if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Only pending orders can be cancelled");

            // Tracked entity: do not call Update(order), it would mark the included
            // Books as Modified and can overwrite concurrent stock changes.
            order.Status = newStatus;

            //  Delivered hole VendorEarning create koro
            if (newStatus == OrderStatus.Delivered)
            {
                foreach (var item in order.OrderItems)
                {
                    if (item.Book == null) continue;

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

            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = order.UserId,
                Title = title,
                Message = message
            });
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