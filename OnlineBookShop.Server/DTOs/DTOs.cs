using System.ComponentModel.DataAnnotations;
using Microsoft.VisualStudio.Services.UserAccountMapping;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.DTOs
{
    // =====================================
    // AUTH & USER
    // =====================================
    public class UserRegisterDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [Required, EmailAddress, MaxLength(150)]
        public string Email { get; set; } = null!;

        [Required, MinLength(8, ErrorMessage = "Password must be at least 8 characters long")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$",
            ErrorMessage = "Password must contain uppercase, lowercase, number and special character")]
        public string Password { get; set; } = null!;
    }

    public class UserLoginDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }

    public class UserResponseDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

    }

    // =====================================
    // VENDOR
    // =====================================
    public class VendorRegisterDto
    {
        [Required, MaxLength(150)]
        public string ShopName { get; set; } = null!;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Url, MaxLength(500)]
        public string? LogoUrl { get; set; }

        [Url, MaxLength(500)]
        public string? BannerUrl { get; set; }             

        [Phone, MaxLength(20)]
        public string? PhoneNumber { get; set; }            

        [MaxLength(250)]
        public string? Address { get; set; }               

        [MaxLength(100)]
        public string? City { get; set; }                   

        [MaxLength(50)]
        public string? BusinessRegistrationNumber { get; set; }  
    }
    public class VendorResponseDto
    {
        public int VendorId { get; set; }
        public int UserId { get; set; }                 

        public string ShopName { get; set; } = null!;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }

        public bool IsApproved { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }

        public string? BusinessRegistrationNumber { get; set; }

   
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public decimal TotalSales { get; set; }

 
        public string? AdminNote { get; set; }
    }
    public class VendorUpdateDto
    {
        public string? ShopName { get; set; }
        public string? Description { get; set; }
        public string? ShopAddress { get; set; }
        public string? PhoneNumber { get; set; }
        public string? City { get; set; }

        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string? BusinessRegistrationNumber { get; set; }
    }


    // =====================================
    // CATEGORY
    // =====================================
    public class CategoryCreateDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [MaxLength(300)]
        public string? Description { get; set; }

        [Url, MaxLength(500)]
        public string? ImageUrl { get; set; }

        public int DisplayOrder { get; set; } = 0;
    }

    public class CategoryResponseDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    // =====================================
    // BOOK
    // =====================================
    public class BookCreateDto
    {
        [Required, MaxLength(300)]
        public string Title { get; set; } = null!;

        [MaxLength(200)]
        public string? Subtitle { get; set; }

        [Required, MaxLength(150)]
        public string Author { get; set; } = null!;

        [Required, Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? DiscountPrice { get; set; }

        [Required, Range(0, int.MaxValue)]
        public int Stock { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Url, MaxLength(500)]
        public string? ImageUrl { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [MaxLength(100)]
        public string? Publisher { get; set; }

        [MaxLength(50)]
        public string? Edition { get; set; }

        public int? PublishedYear { get; set; }

        public int? PageCount { get; set; }

        [MaxLength(50)]
        public string? Language { get; set; } = "Bangla";

        [MaxLength(20)]
        public string? ISBN { get; set; }
    }

    public class BookUpdateDto
    {
        [MaxLength(300)]
        public string? Title { get; set; }

        [MaxLength(200)]
        public string? Subtitle { get; set; }

        [MaxLength(150)]
        public string? Author { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Price { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? DiscountPrice { get; set; }

        [Range(0, int.MaxValue)]
        public int? Stock { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Url, MaxLength(500)]
        public string? ImageUrl { get; set; }

        public int? CategoryId { get; set; }

        [MaxLength(100)]
        public string? Publisher { get; set; }

        [MaxLength(50)]
        public string? Edition { get; set; }

        public int? PublishedYear { get; set; }

        public int? PageCount { get; set; }

        [MaxLength(50)]
        public string? Language { get; set; }

        [MaxLength(20)]
        public string? ISBN { get; set; }

        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
    }

    public class BookResponseDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = null!;
        public string? Subtitle { get; set; }
        public string Author { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int Stock { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public string? Publisher { get; set; }
        public string? Edition { get; set; }
        public int? PublishedYear { get; set; }
        public int? PageCount { get; set; }
        public string? Language { get; set; }
        public string? ISBN { get; set; }
        public int CategoryId { get; set; }
        public int VendorId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
    // =====================================
    // ORDER
    // =====================================
    public class OrderCreateDto
    {
        [Required]
        public int AddressId { get; set; }

        [Required, MinLength(1)]
        public List<OrderItemCreateDto> Items { get; set; } = new();
    }

    public class OrderItemCreateDto
    {
        [Required]
        public int BookId { get; set; }

        [Required, Range(1, 100)]
        public int Quantity { get; set; }

       
    }

    public class OrderResponseDto
    {
        public int OrderId { get; set; }
        public int UserId { get; set; }
        public int AddressId { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime OrderDate { get; set; }
        public List<OrderItemResponseDto> Items { get; set; } = new();
        public AddressResponseDto? Address { get; set; }
    }

    public class OrderItemResponseDto
    {
        public int OrderItemId { get; set; }
        public int BookId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public string Title { get; set; } = string.Empty;
    }
    public class OrderStatusUpdateDto
    {
        public OrderStatus NewStatus { get; set; }
    }

    // =====================================
    // REVIEW
    // =====================================
    public class ReviewCreateDto
    {
        [Required]
        public int BookId { get; set; }

        [Required, Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    public class ReviewResponseDto
    {
        public int ReviewId { get; set; }
        public int BookId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = null!; 
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // =====================================
    // CART
    // =====================================
    public class CartItemCreateDto
    {
        [Required]
        public int BookId { get; set; }

        [Required, Range(1, 100)]
        public int Quantity { get; set; }
    }

    public class CartItemUpdateDto
    {
        [Required]
        public int BookId { get; set; }

        [Required, Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }

    public class CartResponseDto
    {
        public int CartId { get; set; }
        public int UserId { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal TotalAmount { get; set; } 
    }

    public class CartItemResponseDto
    {
        public int CartItemId { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public decimal BookPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Subtotal { get; set; }
        public string? ImageUrl { get; set; }
    }

    // =====================================
    // ADDRESS
    // =====================================
    public class AddressCreateDto
    {
        [Required, MaxLength(300)]
        public string Street { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        [MaxLength(100)]
        public string? StateOrDivision { get; set; }

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [MaxLength(100)]
        public string Country { get; set; } = "Bangladesh";

        public bool IsDefault { get; set; } = false;
    }

    public class AddressResponseDto
    {
        public int AddressId { get; set; }
        public string Street { get; set; } = null!;
        public string City { get; set; } = null!;
        public string? StateOrDivision { get; set; }
        public string? PostalCode { get; set; }
        public string Country { get; set; } = null!;
        public bool IsDefault { get; set; }
    }
    public class AddressUpdateDto
    {
        [Required, MaxLength(300)]
        public string Street { get; set; } = null!;

        [Required, MaxLength(100)]
        public string City { get; set; } = null!;

        [MaxLength(100)]
        public string? StateOrDivision { get; set; }

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [MaxLength(100)]
        public string Country { get; set; } = "Bangladesh";

        public bool IsDefault { get; set; } = false;
    }


    // =====================================
    //Others Dto
    // =====================================
    //public class PayoutRequestDto
    //{
    //    [Required, Range(100, double.MaxValue)]
    //    public decimal Amount { get; set; }
    //}

    //public class PayoutResponseDto
    //{
    //    public int VendorPayoutId { get; set; }
    //    public int VendorId { get; set; }
    //    public decimal Amount { get; set; }
    //    public DateTime RequestedAt { get; set; }
    //    public string Status { get; set; } = "Pending";
    //}

    public class VendorEarningDto
    {
        public int VendorEarningId { get; set; }
        public int OrderItemId { get; set; }
        public decimal GrossAmount { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal NetAmount { get; set; }
        public bool IsPaidOut { get; set; }
        public DateTime EarnedAt { get; set; }
    }

    public class VendorPayoutSummaryDto
    {
        public int VendorId { get; set; }
        public string VendorName { get; set; } = null!;
        public decimal PendingAmount { get; set; }
        public int PendingEarningsCount { get; set; }
    }

    public class VendorPayoutDto
    {
        public int VendorPayoutId { get; set; }
        public int VendorId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaidAt { get; set; }
        public string Status { get; set; } = null!;
        public string? TransactionReference { get; set; }
    }

    public class CreatePayoutDto
    {
        public int VendorId { get; set; }
        public string? TransactionReference { get; set; }
        public string? Notes { get; set; }
    }


    // StockHistory DTOs
    public class StockHistoryResponseDto
    {
        public int StockHistoryId { get; set; }

        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;

        public int OldStock { get; set; }
        public int NewStock { get; set; }

        public int ChangeQuantity => NewStock - OldStock;

        public string Reason { get; set; } = string.Empty;

        public DateTime ChangedAt { get; set; }

        // Extra helpful fields for frontend
        public string ChangedBy { get; set; } = string.Empty;
        public string? ChangedByName { get; set; }
        public string? ReferenceType { get; set; }
    }

    // OrderStatusHistory DTOs
    public class OrderStatusHistoryResponseDto
    {
        public int OrderStatusHistoryId { get; set; }
        public int OrderId { get; set; }
        public string Status { get; set; } = string.Empty; 
        public DateTime ChangedAt { get; set; }
    }
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
    public class WishlistResponseDto
    {
        public int WishlistId { get; set; }
        public int UserId { get; set; }
        public List<WishlistItemResponseDto> Items { get; set; } = new();
    }

    //public class WishlistItemResponseDto
    //{
    //    public int BookId { get; set; }
    //    public string Title { get; set; }
    //    public string? CoverImageUrl { get; set; }
    //}
    public class WishlistItemResponseDto
    {
        public int WishlistItemId { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string? Author { get; set; }
        public decimal BookPrice { get; set; }
        public decimal? DiscountPrice { get; set; }
        public string? ImageUrl { get; set; }
        public int Stock { get; set; }
    }

    // ── UpdateProfileDto ──
    public class UpdateProfileDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;
    }

    // ── ChangePasswordDto ──
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = null!;

        [Required, MinLength(8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$",
            ErrorMessage = "Password must contain uppercase, lowercase, number and special character")]
        public string NewPassword { get; set; } = null!;
    }
    // =============================================
   
    // =============================================

    // Forgot Password
    public class ForgotPasswordDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;
    }

    // Reset Password
    public class ResetPasswordDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        public string Token { get; set; } = null!;

        [Required, MinLength(8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$",
            ErrorMessage = "Password must contain uppercase, lowercase, number and special character")]
        public string NewPassword { get; set; } = null!;
    }
    // NotificationDto.cs
    public class NotificationDto
    {
        public int NotificationId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
    }
    public class BroadcastNotificationDto
    {
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Target { get; set; } = "All"; 
    }
}