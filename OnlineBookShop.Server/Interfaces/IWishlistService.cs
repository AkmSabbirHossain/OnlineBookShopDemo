using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IWishlistService
    {
        Task<WishlistResponseDto> GetWishlistAsync(int userId);
        Task<WishlistResponseDto> AddToWishlistAsync(int userId, int bookId);
        Task RemoveFromWishlistAsync(int userId, int bookId);
    }


}
