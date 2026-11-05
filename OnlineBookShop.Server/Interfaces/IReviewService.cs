using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewResponseDto> AddReviewAsync(ReviewCreateDto dto, int userId);
        Task<List<ReviewResponseDto>> GetBookReviewsAsync(int bookId, int? currentUserId);
        Task DeleteReviewAsync(int reviewId, int userId);
        Task<List<ReviewModerationDto>> GetForAdminAsync(string? status);
        Task<ReviewModerationDto> SetStatusAsync(int reviewId, string status);
    }
}
