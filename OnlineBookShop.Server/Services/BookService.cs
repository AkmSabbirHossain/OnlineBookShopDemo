// =============================================
// BookService.cs — Updated (Minimal Change)
// =============================================
using AutoMapper;
using Microsoft.EntityFrameworkCore;
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

        public BookService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IStockHistoryService stockHistoryService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _stockHistoryService = stockHistoryService;
        }

        public async Task<List<BookResponseDto>> GetAllBooksAsync()
        {
            var books = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .OrderBy(b => b.Title)
                .ToListAsync();

            return _mapper.Map<List<BookResponseDto>>(books);
        }

        public async Task<BookResponseDto?> GetBookByIdAsync(int id)
        {
            var book = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .FirstOrDefaultAsync(b => b.BookId == id);

            return book == null ? null : _mapper.Map<BookResponseDto>(book);
        }

        public async Task<List<BookResponseDto>> GetBooksByVendorAsync(int vendorId)
        {
            var books = await _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Where(b => b.VendorId == vendorId)
                .OrderBy(b => b.Title)
                .ToListAsync();

            return _mapper.Map<List<BookResponseDto>>(books);
        }

        // ── Create Book ──
        public async Task<BookResponseDto> CreateBookAsync(BookCreateDto dto, int vendorId)
        {
            var book = _mapper.Map<Book>(dto);
            book.VendorId = vendorId;
            book.CreatedAt = DateTime.UtcNow;
            book.IsActive = true;                    

            _unitOfWork.Repository<Book>().Add(book);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Stock History — Initial Stock
            await _stockHistoryService.AddStockHistoryAsync(
                bookId: book.BookId,
                oldStock: 0,
                newStock: book.Stock,
                reason: "Initial Stock",
                changedBy: vendorId.ToString()
            );

            return _mapper.Map<BookResponseDto>(book);
        }

        // ── Update Book ──
        public async Task UpdateBookAsync(int id, BookUpdateDto dto, int vendorId)
        {
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.VendorId != vendorId)
                throw new UnauthorizedAccessException("You can only update your own books");

            int oldStock = book.Stock;
            int newStock = dto.Stock ?? book.Stock;

            // Existing mapping + new fields supported
            _mapper.Map(dto, book);

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
        }

        // ── Delete Book ── (No change needed)
        public async Task DeleteBookAsync(int id, int vendorId)
        {
            var book = await _unitOfWork.Repository<Book>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Book not found");

            if (book.VendorId != vendorId)
                throw new UnauthorizedAccessException("You can only delete your own books");

            _unitOfWork.Repository<Book>().Remove(book);
            await _unitOfWork.SaveChangesAsync();
        }

        // ── Filtered Books ── (No change needed)
        public async Task<PagedResult<BookResponseDto>> GetFilteredBooksAsync(
            string? search,
            int? categoryId,
            decimal? minPrice,
            decimal? maxPrice,
            string? sortBy,
            int page,
            int pageSize)
        {
            var query = _unitOfWork.Repository<Book>()
                .GetQueryable()
                .Include(b => b.Category)
                .Include(b => b.Vendor)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(b => b.Title.Contains(search) || b.Author.Contains(search));

            if (categoryId.HasValue)
                query = query.Where(b => b.CategoryId == categoryId.Value);

            if (minPrice.HasValue)
                query = query.Where(b => b.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(b => b.Price <= maxPrice.Value);

            query = sortBy switch
            {
                "titleAsc" => query.OrderBy(b => b.Title),
                "titleDesc" => query.OrderByDescending(b => b.Title),
                "priceAsc" => query.OrderBy(b => b.Price),
                "priceDesc" => query.OrderByDescending(b => b.Price),
                "createdAtAsc" => query.OrderBy(b => b.CreatedAt),
                "createdAtDesc" => query.OrderByDescending(b => b.CreatedAt),
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