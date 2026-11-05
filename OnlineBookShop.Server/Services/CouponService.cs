using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class CouponService : ICouponService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CouponService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CouponValidationDto> ValidateForCartAsync(int userId, string code)
        {
            var cart = await _unitOfWork.Repository<Cart>()
                .GetQueryable()
                .AsNoTracking()
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Book)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || cart.CartItems.Count == 0)
                throw new InvalidOperationException("Your cart is empty.");

            var subtotal = cart.CartItems.Sum(ci => ci.Quantity * GetUnitPrice(ci.Book));
            return await ValidateForOrderAsync(code, userId, subtotal);
        }

        public async Task<CouponValidationDto> ValidateForOrderAsync(string code, int userId, decimal subtotal)
        {
            if (subtotal <= 0)
                throw new InvalidOperationException("Your order has no payable amount.");

            var coupon = await FindValidCouponAsync(code, userId, subtotal);
            var discount = CalculateDiscount(coupon, subtotal);

            return new CouponValidationDto
            {
                CouponId = coupon.CouponId,
                Code = coupon.Code,
                Description = coupon.Description,
                Subtotal = subtotal,
                DiscountAmount = discount,
                TotalAmount = subtotal - discount,
                PerUserLimit = coupon.PerUserLimit
            };
        }

        public async Task RedeemAsync(CouponValidationDto coupon, int userId, int orderId)
        {
            var userUses = await _unitOfWork.Repository<CouponRedemption>()
                .GetQueryable()
                .CountAsync(r => r.CouponId == coupon.CouponId && r.UserId == userId);

            if (userUses >= coupon.PerUserLimit)
                throw new InvalidOperationException("You have already used this coupon.");

            // Atomic guard so concurrent checkouts cannot exceed the global usage limit.
            var affected = await _unitOfWork.ExecuteSqlInterpolatedAsync($@"
                UPDATE Coupons
                SET RedeemedCount = RedeemedCount + 1,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE CouponId = {coupon.CouponId}
                  AND IsActive = 1
                  AND (UsageLimit IS NULL OR RedeemedCount < UsageLimit)");

            if (affected == 0)
                throw new InvalidOperationException("This coupon is no longer available.");

            _unitOfWork.Repository<CouponRedemption>().Add(new CouponRedemption
            {
                CouponId = coupon.CouponId,
                UserId = userId,
                OrderId = orderId,
                DiscountAmount = coupon.DiscountAmount,
                RedeemedAt = DateTime.UtcNow
            });

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<List<CouponResponseDto>> GetAllForAdminAsync()
        {
            var coupons = await _unitOfWork.Repository<Coupon>()
                .GetQueryable()
                .AsNoTracking()
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return coupons.Select(ToDto).ToList();
        }

        public async Task<CouponResponseDto> CreateAsync(CouponUpsertDto dto)
        {
            var code = NormalizeCode(dto.Code);

            var duplicate = await _unitOfWork.Repository<Coupon>()
                .GetQueryable()
                .AnyAsync(c => c.Code == code);

            if (duplicate)
                throw new InvalidOperationException("A coupon with this code already exists.");

            var coupon = new Coupon
            {
                Code = code,
                CreatedAt = DateTime.UtcNow
            };

            Apply(coupon, dto);
            _unitOfWork.Repository<Coupon>().Add(coupon);
            await _unitOfWork.SaveChangesAsync();

            return ToDto(coupon);
        }

        public async Task<CouponResponseDto> UpdateAsync(int couponId, CouponUpsertDto dto)
        {
            var coupon = await _unitOfWork.Repository<Coupon>().GetByIdAsync(couponId)
                ?? throw new KeyNotFoundException("Coupon not found.");

            var code = NormalizeCode(dto.Code);

            var duplicate = await _unitOfWork.Repository<Coupon>()
                .GetQueryable()
                .AnyAsync(c => c.CouponId != couponId && c.Code == code);

            if (duplicate)
                throw new InvalidOperationException("A coupon with this code already exists.");

            coupon.Code = code;
            Apply(coupon, dto);
            coupon.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Coupon>().Update(coupon);
            await _unitOfWork.SaveChangesAsync();

            return ToDto(coupon);
        }

        public async Task<CouponResponseDto> SetStatusAsync(int couponId, bool isActive)
        {
            var coupon = await _unitOfWork.Repository<Coupon>().GetByIdAsync(couponId)
                ?? throw new KeyNotFoundException("Coupon not found.");

            coupon.IsActive = isActive;
            coupon.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Coupon>().Update(coupon);
            await _unitOfWork.SaveChangesAsync();

            return ToDto(coupon);
        }

        private async Task<Coupon> FindValidCouponAsync(string code, int userId, decimal subtotal)
        {
            var normalized = NormalizeCode(code);

            var coupon = await _unitOfWork.Repository<Coupon>()
                .GetQueryable()
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Code == normalized)
                ?? throw new InvalidOperationException("Coupon code not found.");

            var now = DateTime.UtcNow;

            if (!coupon.IsActive)
                throw new InvalidOperationException("This coupon is no longer active.");

            if (coupon.StartsAt.HasValue && coupon.StartsAt.Value > now)
                throw new InvalidOperationException("This coupon is not active yet.");

            if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < now)
                throw new InvalidOperationException("This coupon has expired.");

            if (coupon.UsageLimit.HasValue && coupon.RedeemedCount >= coupon.UsageLimit.Value)
                throw new InvalidOperationException("This coupon has reached its usage limit.");

            if (subtotal < coupon.MinimumOrderAmount)
                throw new InvalidOperationException(
                    $"This coupon requires a minimum order of ৳{coupon.MinimumOrderAmount:0.##}.");

            var userUses = await _unitOfWork.Repository<CouponRedemption>()
                .GetQueryable()
                .CountAsync(r => r.CouponId == coupon.CouponId && r.UserId == userId);

            if (userUses >= coupon.PerUserLimit)
                throw new InvalidOperationException("You have already used this coupon.");

            return coupon;
        }

        private static decimal CalculateDiscount(Coupon coupon, decimal subtotal)
        {
            var discount = coupon.DiscountType == CouponDiscountType.Percentage
                ? subtotal * coupon.DiscountValue / 100m
                : coupon.DiscountValue;

            if (coupon.MaximumDiscountAmount.HasValue && coupon.MaximumDiscountAmount.Value > 0)
                discount = Math.Min(discount, coupon.MaximumDiscountAmount.Value);

            discount = Math.Min(discount, subtotal);

            return Math.Round(Math.Max(0m, discount), 2, MidpointRounding.AwayFromZero);
        }

        private static void Apply(Coupon coupon, CouponUpsertDto dto)
        {
            if (!Enum.TryParse<CouponDiscountType>(dto.DiscountType, true, out var discountType))
                throw new InvalidOperationException("Invalid discount type.");

            if (discountType == CouponDiscountType.Percentage && dto.DiscountValue > 100m)
                throw new InvalidOperationException("Percentage discount cannot be more than 100.");

            var startsAt = ToUtc(dto.StartsAt);
            var expiresAt = ToUtc(dto.ExpiresAt);

            if (startsAt.HasValue && expiresAt.HasValue && expiresAt.Value <= startsAt.Value)
                throw new InvalidOperationException("Expiry date must be after the start date.");

            coupon.Description = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim();
            coupon.DiscountType = discountType;
            coupon.DiscountValue = decimal.Round(dto.DiscountValue, 2);
            coupon.MinimumOrderAmount = decimal.Round(dto.MinimumOrderAmount, 2);
            coupon.MaximumDiscountAmount = discountType == CouponDiscountType.Percentage
                ? dto.MaximumDiscountAmount
                : null;
            coupon.UsageLimit = dto.UsageLimit;
            coupon.PerUserLimit = Math.Max(1, dto.PerUserLimit);
            coupon.StartsAt = startsAt;
            coupon.ExpiresAt = expiresAt;
            coupon.IsActive = dto.IsActive;
        }

        private static CouponResponseDto ToDto(Coupon coupon) => new()
        {
            CouponId = coupon.CouponId,
            Code = coupon.Code,
            Description = coupon.Description,
            DiscountType = coupon.DiscountType.ToString(),
            DiscountValue = coupon.DiscountValue,
            MinimumOrderAmount = coupon.MinimumOrderAmount,
            MaximumDiscountAmount = coupon.MaximumDiscountAmount,
            UsageLimit = coupon.UsageLimit,
            PerUserLimit = coupon.PerUserLimit,
            RedeemedCount = coupon.RedeemedCount,
            StartsAt = coupon.StartsAt,
            ExpiresAt = coupon.ExpiresAt,
            IsActive = coupon.IsActive,
            Status = GetStatus(coupon),
            CreatedAt = coupon.CreatedAt,
            UpdatedAt = coupon.UpdatedAt
        };

        private static string GetStatus(Coupon coupon)
        {
            var now = DateTime.UtcNow;

            if (!coupon.IsActive)
                return "Inactive";

            if (coupon.StartsAt.HasValue && coupon.StartsAt.Value > now)
                return "Scheduled";

            if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < now)
                return "Expired";

            if (coupon.UsageLimit.HasValue && coupon.RedeemedCount >= coupon.UsageLimit.Value)
                return "Exhausted";

            return "Active";
        }

        private static string NormalizeCode(string? code)
        {
            var normalized = code?.Trim().ToUpperInvariant();

            if (string.IsNullOrEmpty(normalized))
                throw new InvalidOperationException("Coupon code is required.");

            return normalized;
        }

        private static DateTime? ToUtc(DateTime? value) =>
            value.HasValue ? value.Value.ToUniversalTime() : null;

        private static decimal GetUnitPrice(Book book) =>
            book.DiscountPrice.HasValue && book.DiscountPrice.Value < book.Price
                ? book.DiscountPrice.Value
                : book.Price;
    }
}
