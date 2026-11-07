using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink);
        Task SendOrderConfirmationEmailAsync(OrderEmailInfoDto info);
        Task SendOrderStatusEmailAsync(OrderEmailInfoDto info);
    }
}
