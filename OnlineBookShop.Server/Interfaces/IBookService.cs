using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IBookService
    {
        Task<BookResponseDto> CreateBookAsync(BookCreateDto dto, int vendorId);
        Task<BookResponseDto?> GetBookByIdAsync(int id);
        Task<List<BookResponseDto>> GetBooksByVendorAsync(int vendorId);
        Task UpdateBookAsync(int id, BookUpdateDto dto, int vendorId);
        Task DeleteBookAsync(int id, int vendorId);
        Task<List<BookResponseDto>> GetAllBooksAsync();

        // filter-enabled method
        Task<PagedResult<BookResponseDto>> GetFilteredBooksAsync(
            string? search,
            int? categoryId,
            decimal? minPrice,
            decimal? maxPrice,
            string? sortBy,
            int page,
            int pageSize
        );
    }
}
