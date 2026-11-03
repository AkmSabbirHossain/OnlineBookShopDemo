using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IAuthorService
    {
        Task<PagedResult<AuthorResponseDto>> GetActiveAsync(string? search, int page, int pageSize);
        Task<List<AuthorResponseDto>> GetAllForAdminAsync();
        Task<AuthorResponseDto?> GetByIdAsync(int id);
        Task<AuthorResponseDto> CreateAsync(AuthorUpsertDto dto);
        Task<AuthorResponseDto> UpdateAsync(int id, AuthorUpsertDto dto);
        Task<AuthorResponseDto> SetStatusAsync(int id, bool isActive);
    }
}
