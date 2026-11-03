using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class AuthorService : IAuthorService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMemoryCache _cache;

        public AuthorService(IUnitOfWork unitOfWork, IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _cache = cache;
        }

        public async Task<PagedResult<AuthorResponseDto>> GetActiveAsync(string? search, int page, int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 60);

            var authors = await GetActiveListAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                authors = authors
                    .Where(a => a.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var totalCount = authors.Count;
            return new PagedResult<AuthorResponseDto>
            {
                Items = authors.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public async Task<List<AuthorResponseDto>> GetAllForAdminAsync()
        {
            return await SelectDto(VisibleQuery())
                .OrderBy(a => a.Name)
                .ToListAsync();
        }

        public async Task<AuthorResponseDto?> GetByIdAsync(int id)
        {
            return await SelectDto(VisibleQuery())
                .FirstOrDefaultAsync(a => a.AuthorId == id && a.IsActive);
        }

        public async Task<AuthorResponseDto> CreateAsync(AuthorUpsertDto dto)
        {
            var name = NormalizeName(dto.Name);

            var duplicate = await _unitOfWork.Repository<Author>().GetQueryable()
                .AnyAsync(a => a.Name == name);
            if (duplicate)
                throw new InvalidOperationException("An author with this name already exists.");

            var author = new Author
            {
                Name = name,
                Bio = TrimToNull(dto.Bio),
                ImageUrl = TrimToNull(dto.ImageUrl),
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _unitOfWork.Repository<Author>().Add(author);
            await _unitOfWork.SaveChangesAsync();

            InvalidateAuthorCaches();

            return new AuthorResponseDto
            {
                AuthorId = author.AuthorId,
                Name = author.Name,
                Bio = author.Bio,
                ImageUrl = author.ImageUrl,
                IsActive = author.IsActive,
                BookCount = 0
            };
        }

        public async Task<AuthorResponseDto> UpdateAsync(int id, AuthorUpsertDto dto)
        {
            var author = await _unitOfWork.Repository<Author>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Author not found");

            var name = NormalizeName(dto.Name);

            var duplicate = await _unitOfWork.Repository<Author>().GetQueryable()
                .AnyAsync(a => a.AuthorId != id && a.Name == name);
            if (duplicate)
                throw new InvalidOperationException("An author with this name already exists.");

            var renamed = !string.Equals(author.Name, name, StringComparison.Ordinal);

            author.Name = name;
            author.Bio = TrimToNull(dto.Bio);
            author.ImageUrl = TrimToNull(dto.ImageUrl);
            author.IsActive = dto.IsActive;
            author.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Author>().Update(author);
            await _unitOfWork.SaveChangesAsync();

            if (renamed)
            {
                // Keep the denormalized name on books in sync with the profile.
                await _unitOfWork.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Books SET Author = {name} WHERE AuthorId = {id}");
                await InvalidateLinkedBookCachesAsync(id);
            }

            InvalidateAuthorCaches();

            return await GetForAdminAsync(id) ?? ToDto(author, 0);
        }

        public async Task<AuthorResponseDto> SetStatusAsync(int id, bool isActive)
        {
            var author = await _unitOfWork.Repository<Author>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Author not found");

            author.IsActive = isActive;
            author.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Author>().Update(author);
            await _unitOfWork.SaveChangesAsync();

            InvalidateAuthorCaches();

            return await GetForAdminAsync(id)
                ?? throw new KeyNotFoundException("Author not found");
        }

        private Task<AuthorResponseDto?> GetForAdminAsync(int id) =>
            SelectDto(VisibleQuery()).FirstOrDefaultAsync(a => a.AuthorId == id);

        private async Task<List<AuthorResponseDto>> GetActiveListAsync()
        {
            if (_cache.TryGetValue(CacheKeys.AllAuthors, out List<AuthorResponseDto>? cached) && cached != null)
                return cached;

            var result = await SelectDto(VisibleQuery())
                .Where(a => a.IsActive)
                .OrderBy(a => a.Name)
                .ToListAsync();

            _cache.Set(CacheKeys.AllAuthors, result, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });

            return result;
        }

        private IQueryable<Author> VisibleQuery() =>
            _unitOfWork.Repository<Author>().GetQueryable().AsNoTracking();

        private static IQueryable<AuthorResponseDto> SelectDto(IQueryable<Author> query) =>
            query.Select(a => new AuthorResponseDto
            {
                AuthorId = a.AuthorId,
                Name = a.Name,
                Bio = a.Bio,
                ImageUrl = a.ImageUrl,
                IsActive = a.IsActive,
                BookCount = a.Books.Count(b =>
                    !b.IsDeleted && b.IsActive && b.Vendor.IsActive && b.Vendor.IsApproved)
            });

        private async Task InvalidateLinkedBookCachesAsync(int authorId)
        {
            var bookIds = await _unitOfWork.Repository<Book>().GetQueryable()
                .Where(b => b.AuthorId == authorId)
                .Select(b => b.BookId)
                .ToListAsync();

            _cache.Remove(CacheKeys.AllBooks);
            foreach (var bookId in bookIds)
                _cache.Remove(CacheKeys.BookById(bookId));
        }

        private void InvalidateAuthorCaches() => _cache.Remove(CacheKeys.AllAuthors);

        private static string NormalizeName(string? name)
        {
            var trimmed = name?.Trim();
            if (string.IsNullOrEmpty(trimmed))
                throw new InvalidOperationException("Author name is required.");

            return trimmed;
        }

        private static string? TrimToNull(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static AuthorResponseDto ToDto(Author author, int bookCount) => new()
        {
            AuthorId = author.AuthorId,
            Name = author.Name,
            Bio = author.Bio,
            ImageUrl = author.ImageUrl,
            IsActive = author.IsActive,
            BookCount = bookCount
        };
    }
}
