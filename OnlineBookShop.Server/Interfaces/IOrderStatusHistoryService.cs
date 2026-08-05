using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IOrderStatusHistoryService
    {
        Task AddOrderStatusHistoryAsync(int orderId, OrderStatus status);
        Task<List<OrderStatusHistoryResponseDto>> GetOrderHistoryAsync(int orderId);
    }

}
