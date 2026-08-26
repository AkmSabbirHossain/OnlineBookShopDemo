using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IBannerService
    {
        Task<List<BannerResponseDto>> GetAllAsync();
        Task<List<BannerResponseDto>> GetActiveAsync();
        Task<BannerResponseDto?> GetByIdAsync(int id);
        Task<BannerResponseDto> CreateAsync(BannerCreateDto dto);
        Task UpdateAsync(int id, BannerCreateDto dto);
        Task DeleteAsync(int id);
    }
}