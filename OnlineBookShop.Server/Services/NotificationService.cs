using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
using Notification = OnlineBookShop.Server.Models.Notification;
public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public NotificationService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<NotificationDto>> GetMyNotificationsAsync(int userId)
    {
        var notifications = await _unitOfWork.Repository<Notification>()
            .GetQueryable()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<NotificationDto>>(notifications);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _unitOfWork.Repository<Notification>()
            .GetQueryable()
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
    {
        var notification = _mapper.Map<Notification>(dto);
        notification.CreatedAt = DateTime.UtcNow;
        notification.IsRead = false;

        _unitOfWork.Repository<Notification>().Add(notification);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<NotificationDto>(notification);
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _unitOfWork.Repository<Notification>()
            .GetFirstOrDefaultAsync(n => n.NotificationId == notificationId);

        if (notification == null || notification.UserId != userId)
            throw new KeyNotFoundException("Notification not found");

        notification.IsRead = true;
        _unitOfWork.Repository<Notification>().Update(notification);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _unitOfWork.Repository<Notification>()
            .FindAsync(n => n.UserId == userId && !n.IsRead);

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            _unitOfWork.Repository<Notification>().Update(notification);
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteNotificationAsync(int notificationId, int userId)
    {
        var notification = await _unitOfWork.Repository<Notification>()
            .GetFirstOrDefaultAsync(n => n.NotificationId == notificationId);

        if (notification == null || notification.UserId != userId)
            throw new KeyNotFoundException("Notification not found");

        _unitOfWork.Repository<Notification>().Remove(notification);
        await _unitOfWork.SaveChangesAsync();
    }
    public async Task BroadcastNotificationAsync(BroadcastNotificationDto dto)
    {
        IEnumerable<AppUser> users;

        if (dto.Target == "All")
        {
            users = await _unitOfWork.Repository<AppUser>()
                .GetQueryable()
                .ToListAsync();
        }
        else
        {
            var targetRole = dto.Target == "Vendor"
                ? AppUserRole.Vendor
                : AppUserRole.Customer;

            users = await _unitOfWork.Repository<AppUser>()
                .GetQueryable()
                .Where(u => u.Role == targetRole)
                .ToListAsync();
        }

        foreach (var user in users)
        {
            var notification = new Notification
            {
                UserId = user.Id,
                Title = dto.Title,
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            _unitOfWork.Repository<Notification>().Add(notification);
        }

        await _unitOfWork.SaveChangesAsync();
    }
}