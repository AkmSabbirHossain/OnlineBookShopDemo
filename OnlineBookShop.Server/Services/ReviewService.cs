using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReviewService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ReviewResponseDto> AddReviewAsync(ReviewCreateDto dto, int userId)
        {
            // Check book available
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(dto.BookId)
                ?? throw new KeyNotFoundException("Book not found");

            // DTO → Entity mapping
            var review = _mapper.Map<Review>(dto);
            review.UserId = userId;
            review.CreatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Review>().Add(review);
            await _unitOfWork.SaveChangesAsync();

            // User info with review load
            var savedReview = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .Include(r => r.AppUser)
                .FirstOrDefaultAsync(r => r.ReviewId == review.ReviewId);

            return _mapper.Map<ReviewResponseDto>(savedReview);
        }

        public async Task<List<ReviewResponseDto>> GetBookReviewsAsync(int bookId)
        {
            var reviews = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .Include(r => r.AppUser)
                .Where(r => r.BookId == bookId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<ReviewResponseDto>>(reviews);
        }

        public async Task DeleteReviewAsync(int reviewId, int userId)
        {
            var review = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId);

            if (review == null)
                throw new KeyNotFoundException("Review not found or not owned by user");

            _unitOfWork.Repository<Review>().Remove(review);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
