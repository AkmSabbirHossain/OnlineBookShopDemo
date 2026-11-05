using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class SalesReportService : ISalesReportService
    {
        private const int MaxRangeDays = 366;
        private readonly IUnitOfWork _unitOfWork;

        public SalesReportService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SalesReportDto> GetReportAsync(DateTime? from, DateTime? to)
        {
            var (start, endExclusive, endDate) = ResolveRange(from, to);

            var orders = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .AsNoTracking()
                .Where(o => o.OrderDate >= start
                            && o.OrderDate < endExclusive
                            && o.Status != OrderStatus.Cancelled)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.Status,
                    o.SubtotalAmount,
                    o.DiscountAmount,
                    o.TotalAmount,
                    Items = o.OrderItems.Select(oi => new
                    {
                        oi.BookId,
                        oi.Quantity,
                        oi.Price,
                        Title = oi.Book.Title,
                        Author = oi.Book.Author,
                        oi.Book.VendorId,
                        Vendor = oi.Book.Vendor.ShopName
                    }).ToList()
                })
                .ToListAsync();

            var cancelledCount = await _unitOfWork.Repository<Order>()
                .GetQueryable()
                .AsNoTracking()
                .CountAsync(o => o.OrderDate >= start
                                 && o.OrderDate < endExclusive
                                 && o.Status == OrderStatus.Cancelled);

            var itemsSold = orders.Sum(o => o.Items.Sum(i => i.Quantity));
            var subtotalSales = Round(orders.Sum(o => o.SubtotalAmount));
            var totalDiscount = Round(orders.Sum(o => o.DiscountAmount));
            var grossSales = Round(orders.Sum(o => o.TotalAmount));

            var report = new SalesReportDto
            {
                From = start,
                To = endDate,
                OrdersCount = orders.Count,
                CancelledOrdersCount = cancelledCount,
                ItemsSold = itemsSold,
                SubtotalSales = subtotalSales,
                TotalDiscount = totalDiscount,
                GrossSales = grossSales,
                AverageOrderValue = orders.Count == 0
                    ? 0m
                    : Round(grossSales / orders.Count)
            };

            var daily = orders
                .GroupBy(o => o.OrderDate.Date)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        Orders = g.Count(),
                        Items = g.Sum(o => o.Items.Sum(i => i.Quantity)),
                        Revenue = g.Sum(o => o.TotalAmount),
                        Discount = g.Sum(o => o.DiscountAmount)
                    });

            for (var day = start; day < endExclusive; day = day.AddDays(1))
            {
                daily.TryGetValue(day, out var stats);
                report.Daily.Add(new DailySalesDto
                {
                    Date = day,
                    Orders = stats?.Orders ?? 0,
                    Items = stats?.Items ?? 0,
                    Revenue = Round(stats?.Revenue ?? 0m),
                    Discount = Round(stats?.Discount ?? 0m)
                });
            }

            var lines = orders
                .SelectMany(o => o.Items.Select(i => new
                {
                    o.OrderId,
                    i.BookId,
                    i.Title,
                    i.Author,
                    i.VendorId,
                    i.Vendor,
                    i.Quantity,
                    Revenue = i.Price * i.Quantity
                }))
                .ToList();

            report.TopBooks = lines
                .GroupBy(l => l.BookId)
                .Select(g => new TopBookSalesDto
                {
                    BookId = g.Key,
                    Title = g.First().Title,
                    Author = g.First().Author,
                    Vendor = g.First().Vendor,
                    QuantitySold = g.Sum(l => l.Quantity),
                    OrdersCount = g.Select(l => l.OrderId).Distinct().Count(),
                    Revenue = Round(g.Sum(l => l.Revenue))
                })
                .OrderByDescending(b => b.Revenue)
                .ThenByDescending(b => b.QuantitySold)
                .Take(10)
                .ToList();

            report.TopVendors = lines
                .GroupBy(l => l.VendorId)
                .Select(g => new TopVendorSalesDto
                {
                    VendorId = g.Key,
                    ShopName = g.First().Vendor,
                    QuantitySold = g.Sum(l => l.Quantity),
                    Revenue = Round(g.Sum(l => l.Revenue))
                })
                .OrderByDescending(v => v.Revenue)
                .ThenByDescending(v => v.QuantitySold)
                .Take(10)
                .ToList();

            report.StatusBreakdown = orders
                .GroupBy(o => o.Status)
                .Select(g => new OrderStatusBreakdownDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count(),
                    Revenue = Round(g.Sum(o => o.TotalAmount))
                })
                .OrderByDescending(s => s.Count)
                .ToList();

            return report;
        }

        public async Task<byte[]> ExportCsvAsync(DateTime? from, DateTime? to)
        {
            var (start, endExclusive, _) = ResolveRange(from, to);

            var rows = await _unitOfWork.Repository<OrderItem>()
                .GetQueryable()
                .AsNoTracking()
                .Where(oi => oi.Order.OrderDate >= start
                             && oi.Order.OrderDate < endExclusive
                             && oi.Order.Status != OrderStatus.Cancelled)
                .Select(oi => new
                {
                    oi.OrderId,
                    oi.Order.OrderDate,
                    oi.Order.Status,
                    Title = oi.Book.Title,
                    Author = oi.Book.Author,
                    Vendor = oi.Book.Vendor.ShopName,
                    oi.Quantity,
                    oi.Price,
                    oi.Order.SubtotalAmount,
                    oi.Order.DiscountAmount,
                    oi.Order.TotalAmount
                })
                .OrderBy(r => r.OrderDate)
                .ThenBy(r => r.OrderId)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Order ID,Order Date,Status,Book,Author,Vendor,Quantity,Unit Price,Line Total,Order Subtotal,Order Discount,Order Total");

            foreach (var row in rows)
            {
                csv.AppendLine(string.Join(",", new[]
                {
                    Safe(row.OrderId.ToString(CultureInfo.InvariantCulture)),
                    Safe(row.OrderDate.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)),
                    Safe(row.Status.ToString()),
                    Safe(row.Title),
                    Safe(row.Author),
                    Safe(row.Vendor),
                    Safe(row.Quantity.ToString(CultureInfo.InvariantCulture)),
                    Safe(row.Price.ToString("0.00", CultureInfo.InvariantCulture)),
                    Safe((row.Price * row.Quantity).ToString("0.00", CultureInfo.InvariantCulture)),
                    Safe(row.SubtotalAmount.ToString("0.00", CultureInfo.InvariantCulture)),
                    Safe(row.DiscountAmount.ToString("0.00", CultureInfo.InvariantCulture)),
                    Safe(row.TotalAmount.ToString("0.00", CultureInfo.InvariantCulture))
                }));
            }

            var body = Encoding.UTF8.GetBytes(csv.ToString());
            var preamble = Encoding.UTF8.GetPreamble();
            var result = new byte[preamble.Length + body.Length];
            Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
            Buffer.BlockCopy(body, 0, result, preamble.Length, body.Length);

            return result;
        }

        private static (DateTime Start, DateTime EndExclusive, DateTime EndDate) ResolveRange(
            DateTime? from, DateTime? to)
        {
            var today = DateTime.UtcNow.Date;
            var start = (from ?? today.AddDays(-29)).Date;
            var endDate = (to ?? today).Date;

            if (endDate < start)
                throw new InvalidOperationException("The end date cannot be before the start date.");

            if ((endDate - start).TotalDays > MaxRangeDays - 1)
                throw new InvalidOperationException($"Select a date range of up to {MaxRangeDays} days.");

            return (start, endDate.AddDays(1), endDate);
        }

        private static string Safe(string? value)
        {
            var text = value ?? string.Empty;

            // Prevent spreadsheet formula injection from user-controlled fields.
            if (text.Length > 0 && "=+-@\t\r".IndexOf(text[0]) >= 0)
                text = "'" + text;

            if (text.Contains('"') || text.Contains(',') || text.Contains('\n') || text.Contains('\r'))
                text = "\"" + text.Replace("\"", "\"\"") + "\"";

            return text;
        }

        private static decimal Round(decimal value) =>
            Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }
}
