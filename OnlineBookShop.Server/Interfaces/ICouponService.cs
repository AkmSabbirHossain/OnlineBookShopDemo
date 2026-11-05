using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface ICouponService
    {
        Task<CouponValidationDto> ValidateForCartAsync(int userId, string code);
        Task<CouponValidationDto> ValidateForOrderAsync(string code, int userId, decimal subtotal);
        Task RedeemAsync(CouponValidationDto coupon, int userId, int orderId);

        Task<List<CouponResponseDto>> GetAllForAdminAsync();
        Task<CouponResponseDto> CreateAsync(CouponUpsertDto dto);
        Task<CouponResponseDto> UpdateAsync(int couponId, CouponUpsertDto dto);
        Task<CouponResponseDto> SetStatusAsync(int couponId, bool isActive);
    }
}
