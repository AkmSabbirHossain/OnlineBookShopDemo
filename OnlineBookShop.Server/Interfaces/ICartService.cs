using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(int userId);
        Task AddItemAsync(int userId, CartItemCreateDto dto);
        Task UpdateItemAsync(int userId, CartItemUpdateDto dto);
        Task RemoveItemAsync(int userId, int bookId);
        Task ClearCartAsync(int userId);
    }
}
