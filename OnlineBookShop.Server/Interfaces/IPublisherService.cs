using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IPublisherService
    {
        Task<PagedResult<PublisherResponseDto>> GetActiveAsync(string? search, int page, int pageSize);
        Task<List<PublisherResponseDto>> GetAllForAdminAsync();
        Task<PublisherResponseDto?> GetByIdAsync(int id);
        Task<PublisherResponseDto> CreateAsync(PublisherUpsertDto dto);
        Task<PublisherResponseDto> UpdateAsync(int id, PublisherUpsertDto dto);
        Task<PublisherResponseDto> SetStatusAsync(int id, bool isActive);
    }
}
