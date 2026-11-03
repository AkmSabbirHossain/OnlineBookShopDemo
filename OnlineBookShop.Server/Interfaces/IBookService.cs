using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IBookService
    {
        Task<BookResponseDto> CreateBookAsync(BookCreateDto dto, int vendorId);
        Task<BookResponseDto?> GetBookByIdAsync(int id);
        Task<List<BookResponseDto>> GetBooksByVendorAsync(int vendorId);
        Task<BookResponseDto> UpdateBookAsync(int id, BookUpdateDto dto, int vendorId);
        Task<BookResponseDto> SetBookStatusAsync(int id, int vendorId, bool? isActive, bool? isFeatured);
        Task DeleteBookAsync(int id, int vendorId);
        Task<List<BookResponseDto>> GetAllBooksAsync();
        Task<List<BookResponseDto>> GetRelatedBooksAsync(int bookId, int count = 8);

        Task<BookResponseDto> AddBookImageAsync(
            int bookId,
            int vendorId,
            Stream content,
            string fileName,
            string? contentType,
            CancellationToken cancellationToken = default);

        Task<BookResponseDto> DeleteBookImageAsync(int bookId, int imageId, int vendorId);
        Task<BookResponseDto> SetPrimaryBookImageAsync(int bookId, int imageId, int vendorId);

        // filter-enabled method
        Task<PagedResult<BookResponseDto>> GetFilteredBooksAsync(
            string? search,
            int? categoryId,
            int? authorId,
            int? publisherId,
            decimal? minPrice,
            decimal? maxPrice,
            string? sortBy,
            int page,
            int pageSize,
            bool inStockOnly = false
        );
    }
}
