using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class PublisherService : IPublisherService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMemoryCache _cache;

        public PublisherService(IUnitOfWork unitOfWork, IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _cache = cache;
        }

        public async Task<PagedResult<PublisherResponseDto>> GetActiveAsync(string? search, int page, int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 60);

            var publishers = await GetActiveListAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                publishers = publishers
                    .Where(p => p.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var totalCount = publishers.Count;
            return new PagedResult<PublisherResponseDto>
            {
                Items = publishers.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public async Task<List<PublisherResponseDto>> GetAllForAdminAsync()
        {
            return await SelectDto(VisibleQuery())
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<PublisherResponseDto?> GetByIdAsync(int id)
        {
            return await SelectDto(VisibleQuery())
                .FirstOrDefaultAsync(p => p.PublisherId == id && p.IsActive);
        }

        public async Task<PublisherResponseDto> CreateAsync(PublisherUpsertDto dto)
        {
            var name = NormalizeName(dto.Name);

            var duplicate = await _unitOfWork.Repository<Publisher>().GetQueryable()
                .AnyAsync(p => p.Name == name);
            if (duplicate)
                throw new InvalidOperationException("A publisher with this name already exists.");

            var publisher = new Publisher
            {
                Name = name,
                Bio = TrimToNull(dto.Bio),
                ImageUrl = TrimToNull(dto.ImageUrl),
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _unitOfWork.Repository<Publisher>().Add(publisher);
            await _unitOfWork.SaveChangesAsync();

            InvalidatePublisherCaches();

            return new PublisherResponseDto
            {
                PublisherId = publisher.PublisherId,
                Name = publisher.Name,
                Bio = publisher.Bio,
                ImageUrl = publisher.ImageUrl,
                IsActive = publisher.IsActive,
                BookCount = 0
            };
        }

        public async Task<PublisherResponseDto> UpdateAsync(int id, PublisherUpsertDto dto)
        {
            var publisher = await _unitOfWork.Repository<Publisher>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Publisher not found");

            var name = NormalizeName(dto.Name);

            var duplicate = await _unitOfWork.Repository<Publisher>().GetQueryable()
                .AnyAsync(p => p.PublisherId != id && p.Name == name);
            if (duplicate)
                throw new InvalidOperationException("A publisher with this name already exists.");

            var renamed = !string.Equals(publisher.Name, name, StringComparison.Ordinal);

            publisher.Name = name;
            publisher.Bio = TrimToNull(dto.Bio);
            publisher.ImageUrl = TrimToNull(dto.ImageUrl);
            publisher.IsActive = dto.IsActive;
            publisher.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Publisher>().Update(publisher);
            await _unitOfWork.SaveChangesAsync();

            if (renamed)
            {
                // Keep the denormalized name on books in sync with the profile.
                await _unitOfWork.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Books SET Publisher = {name} WHERE PublisherId = {id}");
                await InvalidateLinkedBookCachesAsync(id);
            }

            InvalidatePublisherCaches();

            return await GetForAdminAsync(id) ?? ToDto(publisher, 0);
        }

        public async Task<PublisherResponseDto> SetStatusAsync(int id, bool isActive)
        {
            var publisher = await _unitOfWork.Repository<Publisher>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Publisher not found");

            publisher.IsActive = isActive;
            publisher.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Publisher>().Update(publisher);
            await _unitOfWork.SaveChangesAsync();

            InvalidatePublisherCaches();

            return await GetForAdminAsync(id)
                ?? throw new KeyNotFoundException("Publisher not found");
        }

        private Task<PublisherResponseDto?> GetForAdminAsync(int id) =>
            SelectDto(VisibleQuery()).FirstOrDefaultAsync(p => p.PublisherId == id);

        private async Task<List<PublisherResponseDto>> GetActiveListAsync()
        {
            if (_cache.TryGetValue(CacheKeys.AllPublishers, out List<PublisherResponseDto>? cached) && cached != null)
                return cached;

            var result = await SelectDto(VisibleQuery())
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            _cache.Set(CacheKeys.AllPublishers, result, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });

            return result;
        }

        private IQueryable<Publisher> VisibleQuery() =>
            _unitOfWork.Repository<Publisher>().GetQueryable().AsNoTracking();

        private static IQueryable<PublisherResponseDto> SelectDto(IQueryable<Publisher> query) =>
            query.Select(p => new PublisherResponseDto
            {
                PublisherId = p.PublisherId,
                Name = p.Name,
                Bio = p.Bio,
                ImageUrl = p.ImageUrl,
                IsActive = p.IsActive,
                BookCount = p.Books.Count(b =>
                    !b.IsDeleted && b.IsActive && b.Vendor.IsActive && b.Vendor.IsApproved)
            });

        private async Task InvalidateLinkedBookCachesAsync(int publisherId)
        {
            var bookIds = await _unitOfWork.Repository<Book>().GetQueryable()
                .Where(b => b.PublisherId == publisherId)
                .Select(b => b.BookId)
                .ToListAsync();

            _cache.Remove(CacheKeys.AllBooks);
            foreach (var bookId in bookIds)
                _cache.Remove(CacheKeys.BookById(bookId));
        }

        private void InvalidatePublisherCaches() => _cache.Remove(CacheKeys.AllPublishers);

        private static string NormalizeName(string? name)
        {
            var trimmed = name?.Trim();
            if (string.IsNullOrEmpty(trimmed))
                throw new InvalidOperationException("Publisher name is required.");

            return trimmed;
        }

        private static string? TrimToNull(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static PublisherResponseDto ToDto(Publisher publisher, int bookCount) => new()
        {
            PublisherId = publisher.PublisherId,
            Name = publisher.Name,
            Bio = publisher.Bio,
            ImageUrl = publisher.ImageUrl,
            IsActive = publisher.IsActive,
            BookCount = bookCount
        };
    }
}
