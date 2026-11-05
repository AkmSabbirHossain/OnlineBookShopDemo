using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;

        public ReviewService(IUnitOfWork unitOfWork, IMapper mapper, IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cache = cache;
        }

        public async Task<ReviewResponseDto> AddReviewAsync(ReviewCreateDto dto, int userId)
        {
            var book = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .FirstOrDefaultAsync(b => b.BookId == dto.BookId)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.IsDeleted || !book.IsActive)
                throw new InvalidOperationException("This book is not available for review.");

            var alreadyReviewed = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .AnyAsync(r => r.BookId == dto.BookId && r.UserId == userId);

            if (alreadyReviewed)
                throw new InvalidOperationException("You have already reviewed this book.");

            var isVerifiedPurchase = await _unitOfWork.Repository<OrderItem>()
                .GetQueryable()
                .AnyAsync(oi =>
                    oi.BookId == dto.BookId &&
                    oi.Order.UserId == userId &&
                    oi.Order.Status == OrderStatus.Delivered);

            Review savedReview;

            await using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    var review = _mapper.Map<Review>(dto);
                    review.UserId = userId;
                    review.IsVerifiedPurchase = isVerifiedPurchase;
                    review.Status = ReviewStatus.Pending;
                    review.CreatedAt = DateTime.UtcNow;

                    _unitOfWork.Repository<Review>().Add(review);
                    await _unitOfWork.SaveChangesAsync();

                    await RefreshBookRatingAsync(dto.BookId);

                    savedReview = await _unitOfWork.Repository<Review>()
                        .GetQueryable()
                        .Include(r => r.AppUser)
                        .FirstAsync(r => r.ReviewId == review.ReviewId);

                    await transaction.CommitAsync();
                }
                catch (DbUpdateException)
                {
                    // The unique (BookId, UserId) index is the final guard against double submits.
                    await transaction.RollbackAsync();
                    throw new InvalidOperationException("You have already reviewed this book.");
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }

            InvalidateBookCaches(dto.BookId);
            return _mapper.Map<ReviewResponseDto>(savedReview);
        }

        public async Task<List<ReviewResponseDto>> GetBookReviewsAsync(int bookId, int? currentUserId)
        {
            var reviews = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .AsNoTracking()
                .Include(r => r.AppUser)
                .Where(r => r.BookId == bookId &&
                            (r.Status == ReviewStatus.Approved ||
                             (currentUserId.HasValue && r.UserId == currentUserId.Value)))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<ReviewResponseDto>>(reviews);
        }

        public async Task DeleteReviewAsync(int reviewId, int userId)
        {
            var review = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId)
                ?? throw new KeyNotFoundException("Review not found or not owned by user");

            var bookId = review.BookId;

            await using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    _unitOfWork.Repository<Review>().Remove(review);
                    await _unitOfWork.SaveChangesAsync();

                    await RefreshBookRatingAsync(bookId);

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }

            InvalidateBookCaches(bookId);
        }

        public async Task<List<ReviewModerationDto>> GetForAdminAsync(string? status)
        {
            var query = _unitOfWork.Repository<Review>()
                .GetQueryable()
                .AsNoTracking()
                .Include(r => r.AppUser)
                .Include(r => r.Book)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<ReviewStatus>(status, true, out var statusFilter))
                    throw new InvalidOperationException("Invalid review status filter.");

                query = query.Where(r => r.Status == statusFilter);
            }

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Take(500)
                .ToListAsync();

            return reviews.Select(ToModerationDto).ToList();
        }

        public async Task<ReviewModerationDto> SetStatusAsync(int reviewId, string status)
        {
            if (!Enum.TryParse<ReviewStatus>(status, true, out var newStatus))
                throw new InvalidOperationException("Invalid review status.");

            var review = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .Include(r => r.AppUser)
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId)
                ?? throw new KeyNotFoundException("Review not found.");

            if (review.Status != newStatus)
            {
                await using var transaction = await _unitOfWork.BeginTransactionAsync();
                try
                {
                    review.Status = newStatus;
                    await _unitOfWork.SaveChangesAsync();

                    await RefreshBookRatingAsync(review.BookId);

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }

                InvalidateBookCaches(review.BookId);
            }

            return ToModerationDto(review);
        }

        private async Task RefreshBookRatingAsync(int bookId)
        {
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(bookId);
            if (book == null)
                return;

            var stats = await _unitOfWork.Repository<Review>()
                .GetQueryable()
                .Where(r => r.BookId == bookId && r.Status == ReviewStatus.Approved)
                .GroupBy(r => 1)
                .Select(g => new { Count = g.Count(), Sum = g.Sum(r => r.Rating) })
                .FirstOrDefaultAsync();

            book.ReviewCount = stats?.Count ?? 0;
            book.AverageRating = stats == null || stats.Count == 0
                ? 0m
                : Math.Round((decimal)stats.Sum / stats.Count, 2);

            await _unitOfWork.SaveChangesAsync();
        }

        private static ReviewModerationDto ToModerationDto(Review review) => new()
        {
            ReviewId = review.ReviewId,
            BookId = review.BookId,
            BookTitle = review.Book?.Title ?? string.Empty,
            UserId = review.UserId,
            UserName = review.AppUser?.UserName ?? string.Empty,
            Rating = review.Rating,
            Comment = review.Comment,
            IsVerifiedPurchase = review.IsVerifiedPurchase,
            Status = review.Status.ToString(),
            CreatedAt = review.CreatedAt
        };

        private void InvalidateBookCaches(int bookId)
        {
            _cache.Remove(CacheKeys.AllBooks);
            _cache.Remove(CacheKeys.BookById(bookId));
        }
    }
}
