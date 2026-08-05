using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewResponseDto> AddReviewAsync(ReviewCreateDto dto, int userId);
        Task<List<ReviewResponseDto>> GetBookReviewsAsync(int bookId);
        Task DeleteReviewAsync(int reviewId, int userId);
    }
}