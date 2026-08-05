using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IAddressService
    {
        Task<List<AddressResponseDto>> GetAddressesByUserAsync(int userId);
        Task<AddressResponseDto?> GetByIdAsync(int id, int userId);
        Task<AddressResponseDto> CreateAsync(AddressCreateDto dto, int userId);
        Task UpdateAsync(int id, AddressUpdateDto dto, int userId);
        Task DeleteAsync(int id, int userId);
    }
}