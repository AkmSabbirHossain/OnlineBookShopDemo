using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class OrderStatusHistoryService : IOrderStatusHistoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public OrderStatusHistoryService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task AddOrderStatusHistoryAsync(int orderId, OrderStatus status)
        {
            var history = new OrderStatusHistory
            {
                OrderId = orderId,
                Status = status,
                ChangedAt = DateTime.UtcNow
            };

            _unitOfWork.Repository<OrderStatusHistory>().Add(history);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<List<OrderStatusHistoryResponseDto>> GetOrderHistoryAsync(int orderId)
        {
            var histories = await _unitOfWork.Repository<OrderStatusHistory>()
                .GetQueryable()
                .Include(h => h.Order)
                .Where(h => h.OrderId == orderId)
                .OrderByDescending(h => h.ChangedAt)
                .ToListAsync();

            return _mapper.Map<List<OrderStatusHistoryResponseDto>>(histories);
        }
    }

}
