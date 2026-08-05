using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IOrderService
    {
        Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto dto, int userId);
        Task<OrderResponseDto?> GetOrderByIdAsync(int orderId, int userId);
        Task<List<OrderResponseDto>> GetUserOrdersAsync(int userId);
        Task CancelOrderAsync(int orderId, int userId);
        Task UpdateOrderStatusAsync(int orderId, OrderStatus newStatus);
        Task<List<OrderResponseDto>> GetVendorOrdersAsync(int vendorId);
        Task ShipOrderAsync(int orderId, int vendorId);
    }
}
