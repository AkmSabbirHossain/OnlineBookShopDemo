//// =============================================
//// BookService.cs — Updated (Minimal Change)
//// =============================================
//using AutoMapper;
//using Microsoft.EntityFrameworkCore;
//using OnlineBookShop.Server.DTOs;
//using OnlineBookShop.Server.Interfaces;
//using OnlineBookShop.Server.Models;

//namespace OnlineBookShop.Server.Services
//{
//    public class BookService : IBookService
//    {
//        private readonly IUnitOfWork _unitOfWork;
//        private readonly IMapper _mapper;
//        private readonly IStockHistoryService _stockHistoryService;

//        public BookService(
//            IUnitOfWork unitOfWork,
//            IMapper mapper,
//            IStockHistoryService stockHistoryService)
//        {
//            _unitOfWork = unitOfWork;
//            _mapper = mapper;
//            _stockHistoryService = stockHistoryService;
//        }

//        public async Task<List<BookResponseDto>> GetAllBooksAsync()
//        {
//            var books = await _unitOfWork.Repository<Book>()
//                .GetQueryable()
//                .Include(b => b.Category)
//                .Include(b => b.Vendor)
//                .OrderBy(b => b.Title)
//                .ToListAsync();

//            return _mapper.Map<List<BookResponseDto>>(books);
//        }

//        public async Task<BookResponseDto?> GetBookByIdAsync(int id)
//        {
//            var book = await _unitOfWork.Repository<Book>()
//                .GetQueryable()
//                .Include(b => b.Category)
//                .Include(b => b.Vendor)
//                .FirstOrDefaultAsync(b => b.BookId == id);

//            return book == null ? null : _mapper.Map<BookResponseDto>(book);
//        }

//        public async Task<List<BookResponseDto>> GetBooksByVendorAsync(int vendorId)
//        {
//            var books = await _unitOfWork.Repository<Book>()
//                .GetQueryable()
//                .Include(b => b.Category)
//                .Where(b => b.VendorId == vendorId)
//                .OrderBy(b => b.Title)
//                .ToListAsync();

//            return _mapper.Map<List<BookResponseDto>>(books);
//        }

//        // ── Create Book ──
//        public async Task<BookResponseDto> CreateBookAsync(BookCreateDto dto, int vendorId)
//        {
//            var book = _mapper.Map<Book>(dto);
//            book.VendorId = vendorId;
//            book.CreatedAt = DateTime.UtcNow;
//            book.IsActive = true;                    

//            _unitOfWork.Repository<Book>().Add(book);
//            await _unitOfWork.SaveChangesAsync();

//            // ✅ Stock History — Initial Stock
//            await _stockHistoryService.AddStockHistoryAsync(
//                bookId: book.BookId,
//                oldStock: 0,
//                newStock: book.Stock,
//                reason: "Initial Stock",
//                changedBy: vendorId.ToString()
//            );

//            return _mapper.Map<BookResponseDto>(book);
//        }

//        // ── Update Book ──
//        public async Task UpdateBookAsync(int id, BookUpdateDto dto, int vendorId)
//        {
//            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
//                ?? throw new KeyNotFoundException("Book not found");

//            if (book.VendorId != vendorId)
//                throw new UnauthorizedAccessException("You can only update your own books");

//            int oldStock = book.Stock;
//            int newStock = dto.Stock ?? book.Stock;

//            // Existing mapping + new fields supported
//            _mapper.Map(dto, book);

//            _unitOfWork.Repository<Book>().Update(book);
//            await _unitOfWork.SaveChangesAsync();

//            if (oldStock != newStock)
//            {
//                await _stockHistoryService.AddStockHistoryAsync(
//                    bookId: book.BookId,
//                    oldStock: oldStock,
//                    newStock: newStock,
//                    reason: newStock > oldStock ? "New Purchase" : "Manual Adjustment",
//                    changedBy: vendorId.ToString()
//                );
//            }
//        }

//        // ── Delete Book ── (No change needed)
//        public async Task DeleteBookAsync(int id, int vendorId)
//        {
//            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
//                ?? throw new KeyNotFoundException("Book not found");

//            if (book.VendorId != vendorId)
//                throw new UnauthorizedAccessException("You can only delete your own books");

//            _unitOfWork.Repository<Book>().Remove(book);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        // ── Filtered Books ── (No change needed)
//        public async Task<PagedResult<BookResponseDto>> GetFilteredBooksAsync(
//            string? search,
//            int? categoryId,
//            decimal? minPrice,
//            decimal? maxPrice,
//            string? sortBy,
//            int page,
//            int pageSize)
//        {
//            var query = _unitOfWork.Repository<Book>()
//                .GetQueryable()
//                .Include(b => b.Category)
//                .Include(b => b.Vendor)
//                .AsQueryable();

//            if (!string.IsNullOrEmpty(search))
//                query = query.Where(b => b.Title.Contains(search) || b.Author.Contains(search));

//            if (categoryId.HasValue)
//                query = query.Where(b => b.CategoryId == categoryId.Value);

//            if (minPrice.HasValue)
//                query = query.Where(b => b.Price >= minPrice.Value);

//            if (maxPrice.HasValue)
//                query = query.Where(b => b.Price <= maxPrice.Value);

//            query = sortBy switch
//            {
//                "titleAsc" => query.OrderBy(b => b.Title),
//                "titleDesc" => query.OrderByDescending(b => b.Title),
//                "priceAsc" => query.OrderBy(b => b.Price),
//                "priceDesc" => query.OrderByDescending(b => b.Price),
//                "createdAtAsc" => query.OrderBy(b => b.CreatedAt),
//                "createdAtDesc" => query.OrderByDescending(b => b.CreatedAt),
//                _ => query.OrderBy(b => b.BookId)
//            };

//            var totalCount = await query.CountAsync();
//            var items = await query
//                .Skip((page - 1) * pageSize)
//                .Take(pageSize)
//                .ToListAsync();

//            return new PagedResult<BookResponseDto>
//            {
//                Items = _mapper.Map<List<BookResponseDto>>(items),
//                TotalCount = totalCount,
//                Page = page,
//                PageSize = pageSize,
//                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
//            };
//        }
//    }
//}

// =============================================
// BookService.cs — In-Memory Caching added
// =============================================
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class BookService : IBookService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IStockHistoryService _stockHistoryService;
        private readonly IMemoryCache _cache;
        private readonly IFileStorage _fileStorage;

        public BookService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStockHistoryService stockHistoryService,
            IMemoryCache cache,
            IFileStorage fileStorage)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _stockHistoryService = stockHistoryService;
            _cache = cache;
            _fileStorage = fileStorage;
        }

        // ── Get All active books — CACHED, 5 minute ──
        public async Task<List<BookResponseDto>> GetAllBooksAsync()
        {
            if (_cache.TryGetValue(CacheKeys.AllBooks, out List<BookResponseDto>? cachedBooks) && cachedBooks != null)
            {
                return cachedBooks;
            }

            var books = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .Where(b => !b.IsDeleted && b.IsActive && b.Vendor.IsActive && b.Vendor.IsApproved)
                .OrderBy(b => b.Title)
                .ToListAsync();
            var result = _mapper.Map<List<BookResponseDto>>(books);

            _cache.Set(CacheKeys.AllBooks, result, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            });

            return result;
        }

        // ── Get Single Book (public) — CACHED, 5 minute ──
        public async Task<BookResponseDto?> GetBookByIdAsync(int id)
        {
            var cacheKey = CacheKeys.BookById(id);

            if (_cache.TryGetValue(cacheKey, out BookResponseDto? cachedBook))
            {
                return cachedBook;
            }

            var book = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .Include(b => b.Images)
                .FirstOrDefaultAsync(b =>
                    b.BookId == id &&
                    !b.IsDeleted &&
                    b.IsActive &&
                    b.Vendor.IsActive &&
                    b.Vendor.IsApproved);

            var result = book == null ? null : _mapper.Map<BookResponseDto>(book);

            if (result != null)
            {
                _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });
            }

            return result;
        }

        // ── Vendor's own books — NOT cached (vendor dashboard e always fresh data lagbe) ──
        public async Task<List<BookResponseDto>> GetBooksByVendorAsync(int vendorId)
        {
            var books = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Where(b => b.VendorId == vendorId && !b.IsDeleted)
                .OrderBy(b => b.Title)
                .ToListAsync();

            return _mapper.Map<List<BookResponseDto>>(books);
        }

        // ── Create Book — cache invalidate koro (notun boi list e dekhate hobe) ──
        public async Task<BookResponseDto> CreateBookAsync(BookCreateDto dto, int vendorId)
        {
            var book = _mapper.Map<Book>(dto);
            book.VendorId = vendorId;
            book.CreatedAt = DateTime.UtcNow;
            book.IsActive = true;

            _unitOfWork.Repository<Book>().Add(book);
            await _unitOfWork.SaveChangesAsync();

            await _stockHistoryService.AddStockHistoryAsync(
                bookId: book.BookId,
                oldStock: 0,
                newStock: book.Stock,
                reason: "Initial Stock",
                changedBy: vendorId.ToString()
            );

            InvalidateBookCaches(book.BookId);

            return _mapper.Map<BookResponseDto>(book);
        }

        // ── Update Book — cache invalidate koro (list + oi specific book) ──
        public async Task<BookResponseDto> UpdateBookAsync(int id, BookUpdateDto dto, int vendorId)
        {
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.VendorId != vendorId)
                throw new UnauthorizedAccessException("You can only update your own books");

            if (book.IsDeleted)
                throw new InvalidOperationException("This book has been deleted.");

            int oldStock = book.Stock;
            int newStock = dto.Stock ?? book.Stock;

            _mapper.Map(dto, book);
            book.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Book>().Update(book);
            await _unitOfWork.SaveChangesAsync();

            if (oldStock != newStock)
            {
                await _stockHistoryService.AddStockHistoryAsync(
                    bookId: book.BookId,
                    oldStock: oldStock,
                    newStock: newStock,
                    reason: newStock > oldStock ? "New Purchase" : "Manual Adjustment",
                    changedBy: vendorId.ToString()
                );
            }

            InvalidateBookCaches(id);

            return _mapper.Map<BookResponseDto>(book);
        }

        // ── Quick active/featured toggle from the vendor table ──
        public async Task<BookResponseDto> SetBookStatusAsync(int id, int vendorId, bool? isActive, bool? isFeatured)
        {
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.VendorId != vendorId)
                throw new UnauthorizedAccessException("You can only update your own books");

            if (book.IsDeleted)
                throw new InvalidOperationException("This book has been deleted.");

            if (isActive.HasValue) book.IsActive = isActive.Value;
            if (isFeatured.HasValue) book.IsFeatured = isFeatured.Value;
            book.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Book>().Update(book);
            await _unitOfWork.SaveChangesAsync();

            InvalidateBookCaches(id);

            return _mapper.Map<BookResponseDto>(book);
        }

        // ── Soft delete — order history stays intact ──
        public async Task DeleteBookAsync(int id, int vendorId)
        {
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.VendorId != vendorId)
                throw new UnauthorizedAccessException("You can only delete your own books");

            book.IsDeleted = true;
            book.IsActive = false;
            book.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Book>().Update(book);
            await _unitOfWork.SaveChangesAsync();

            InvalidateBookCaches(id);
        }

        private void InvalidateBookCaches(int bookId)
        {
            _cache.Remove(CacheKeys.AllBooks);
            _cache.Remove(CacheKeys.BookById(bookId));
            _cache.Remove(CacheKeys.AllCategories);
        }

        private IQueryable<Book> VisibleBooks() =>
            _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Where(b => !b.IsDeleted && b.IsActive && b.Vendor.IsActive && b.Vendor.IsApproved);

        // ── Related books: customers also bought, then same-category fallback ──
        public async Task<List<BookResponseDto>> GetRelatedBooksAsync(int bookId, int count = 8)
        {
            count = Math.Clamp(count, 1, 20);

            var current = await VisibleBooks()
                .Where(b => b.BookId == bookId)
                .Select(b => new { b.CategoryId })
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Book not found");

            var boughtIds = await _unitOfWork.Repository<OrderItem>()
                .GetQueryable()
                .Where(oi => oi.BookId != bookId
                    && oi.Order.OrderItems.Any(other => other.BookId == bookId))
                .Where(oi => !oi.Book.IsDeleted
                    && oi.Book.IsActive
                    && oi.Book.Vendor.IsActive
                    && oi.Book.Vendor.IsApproved)
                .GroupBy(oi => oi.BookId)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .Take(count)
                .ToListAsync();

            var result = new List<Book>();
            if (boughtIds.Count > 0)
            {
                var boughtBooks = await VisibleBooks()
                    .Include(b => b.Category)
                    .Include(b => b.Vendor)
                    .Where(b => boughtIds.Contains(b.BookId))
                    .ToListAsync();

                result.AddRange(boughtIds
                    .Select(id => boughtBooks.FirstOrDefault(b => b.BookId == id))
                    .Where(b => b != null)
                    .Select(b => b!));
            }

            if (result.Count < count)
            {
                var excludedIds = result.Select(b => b.BookId)
                    .Append(bookId)
                    .Distinct()
                    .ToList();

                var fallback = await VisibleBooks()
                    .Include(b => b.Category)
                    .Include(b => b.Vendor)
                    .Where(b => b.CategoryId == current.CategoryId && !excludedIds.Contains(b.BookId))
                    .OrderByDescending(b => b.AverageRating)
                    .ThenByDescending(b => b.ReviewCount)
                    .ThenByDescending(b => b.CreatedAt)
                    .Take(count - result.Count)
                    .ToListAsync();

                result.AddRange(fallback);
            }

            return _mapper.Map<List<BookResponseDto>>(result);
        }

        // ── Gallery: upload ──
        public async Task<BookResponseDto> AddBookImageAsync(
            int bookId,
            int vendorId,
            Stream content,
            string fileName,
            string? contentType,
            CancellationToken cancellationToken = default)
        {
            var book = await GetOwnedBookWithImagesAsync(bookId, vendorId);

            if (book.Images.Count >= 8)
                throw new InvalidOperationException("A book can have at most 8 gallery images.");

            var imageUrl = await _fileStorage.SaveImageAsync(content, fileName, contentType, cancellationToken);

            var image = new BookImage
            {
                BookId = bookId,
                ImageUrl = imageUrl,
                IsPrimary = book.Images.Count == 0,
                DisplayOrder = book.Images.Count == 0 ? 0 : book.Images.Max(i => i.DisplayOrder) + 1,
                CreatedAt = DateTime.UtcNow
            };

            book.Images.Add(image);

            if (image.IsPrimary)
                book.ImageUrl = image.ImageUrl;

            try
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // Do not leave an orphaned file behind if the insert fails.
                await _fileStorage.DeleteAsync(imageUrl, cancellationToken);
                throw;
            }

            InvalidateBookCaches(bookId);
            return _mapper.Map<BookResponseDto>(book);
        }

        // ── Gallery: delete (promotes the next image when the cover is removed) ──
        public async Task<BookResponseDto> DeleteBookImageAsync(int bookId, int imageId, int vendorId)
        {
            var book = await GetOwnedBookWithImagesAsync(bookId, vendorId);

            var image = book.Images.FirstOrDefault(i => i.BookImageId == imageId)
                ?? throw new KeyNotFoundException("Image not found");

            var wasPrimary = image.IsPrimary;
            var imageUrl = image.ImageUrl;

            book.Images.Remove(image);
            _unitOfWork.Repository<BookImage>().Remove(image);
            await _unitOfWork.SaveChangesAsync();

            if (wasPrimary)
            {
                var next = book.Images
                    .OrderBy(i => i.DisplayOrder)
                    .ThenBy(i => i.BookImageId)
                    .FirstOrDefault();

                foreach (var img in book.Images)
                    img.IsPrimary = false;

                if (next != null)
                    next.IsPrimary = true;

                book.ImageUrl = next?.ImageUrl;
                await _unitOfWork.SaveChangesAsync();
            }

            await _fileStorage.DeleteAsync(imageUrl);
            InvalidateBookCaches(bookId);

            return _mapper.Map<BookResponseDto>(book);
        }

        // ── Gallery: choose the cover image ──
        public async Task<BookResponseDto> SetPrimaryBookImageAsync(int bookId, int imageId, int vendorId)
        {
            var book = await GetOwnedBookWithImagesAsync(bookId, vendorId);

            var image = book.Images.FirstOrDefault(i => i.BookImageId == imageId)
                ?? throw new KeyNotFoundException("Image not found");

            foreach (var img in book.Images)
                img.IsPrimary = img.BookImageId == imageId;

            book.ImageUrl = image.ImageUrl;
            await _unitOfWork.SaveChangesAsync();

            InvalidateBookCaches(bookId);
            return _mapper.Map<BookResponseDto>(book);
        }

        private async Task<Book> GetOwnedBookWithImagesAsync(int bookId, int vendorId)
        {
            var book = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Images)
                .FirstOrDefaultAsync(b => b.BookId == bookId)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.VendorId != vendorId)
                throw new UnauthorizedAccessException("You can only manage your own books");

            if (book.IsDeleted)
                throw new InvalidOperationException("This book has been deleted.");

            return book;
        }

        // ── Filtered Books — NOT cached (search/filter combination onek, cache miss e labh nai) ──
        public async Task<PagedResult<BookResponseDto>> GetFilteredBooksAsync(
            string? search,
            int? categoryId,
            decimal? minPrice,
            decimal? maxPrice,
            string? sortBy,
            int page,
            int pageSize,
            bool inStockOnly = false)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _unitOfWork.Repository<Book>()
                .GetQueryable()
                .AsNoTracking()
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .Where(b => !b.IsDeleted && b.IsActive && b.Vendor.IsActive && b.Vendor.IsApproved);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(b =>
                    b.Title.Contains(term) ||
                    b.Author.Contains(term) ||
                    (b.Subtitle != null && b.Subtitle.Contains(term)) ||
                    (b.Publisher != null && b.Publisher.Contains(term)) ||
                    (b.ISBN != null && b.ISBN.Contains(term)));
            }

            if (categoryId.HasValue)
                query = query.Where(b => b.CategoryId == categoryId.Value);

            if (minPrice.HasValue)
                query = query.Where(b =>
                    (b.DiscountPrice.HasValue && b.DiscountPrice.Value < b.Price ? b.DiscountPrice.Value : b.Price) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(b =>
                    (b.DiscountPrice.HasValue && b.DiscountPrice.Value < b.Price ? b.DiscountPrice.Value : b.Price) <= maxPrice.Value);

            if (inStockOnly)
                query = query.Where(b => b.Stock > 0);

            query = sortBy?.Trim().ToLowerInvariant() switch
            {
                "titleasc" or "title_asc" => query.OrderBy(b => b.Title),
                "titledesc" or "title_desc" => query.OrderByDescending(b => b.Title),
                "priceasc" or "price_asc" => query.OrderBy(b =>
                    b.DiscountPrice.HasValue && b.DiscountPrice.Value < b.Price ? b.DiscountPrice.Value : b.Price),
                "pricedesc" or "price_desc" => query.OrderByDescending(b =>
                    b.DiscountPrice.HasValue && b.DiscountPrice.Value < b.Price ? b.DiscountPrice.Value : b.Price),
                "createdatasc" or "created_at_asc" or "oldest" => query.OrderBy(b => b.CreatedAt),
                "createdatdesc" or "created_at_desc" or "newest" => query.OrderByDescending(b => b.CreatedAt),
                "rating" or "rating_desc" or "ratingdesc" => query
                    .OrderByDescending(b => b.AverageRating)
                    .ThenByDescending(b => b.ReviewCount),
                "rating_asc" or "ratingasc" => query
                    .OrderBy(b => b.AverageRating)
                    .ThenBy(b => b.ReviewCount),
                "popular" or "popularity" => query
                    .OrderByDescending(b => b.ReviewCount)
                    .ThenByDescending(b => b.AverageRating),
                _ => query.OrderBy(b => b.BookId)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<BookResponseDto>
            {
                Items = _mapper.Map<List<BookResponseDto>>(items),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }
    }
}