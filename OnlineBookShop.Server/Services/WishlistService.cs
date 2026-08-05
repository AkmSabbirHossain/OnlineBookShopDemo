

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
public class WishlistService : IWishlistService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public WishlistService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<WishlistResponseDto> GetWishlistAsync(int userId)
    {
        var wishlist = await _unitOfWork.Repository<Wishlist>()
            .GetQueryable()
            .Include(w => w.WishlistItems)
                .ThenInclude(wi => wi.Book)
            .FirstOrDefaultAsync(w => w.UserId == userId)
            ?? new Wishlist { UserId = userId };

        return _mapper.Map<WishlistResponseDto>(wishlist);
    }


    public async Task<WishlistResponseDto> AddToWishlistAsync(int userId, int bookId)
    {
        var wishlist = await _unitOfWork.Repository<Wishlist>()
            .GetQueryable()
            .Include(w => w.WishlistItems)
                .ThenInclude(wi => wi.Book)
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wishlist == null)
        {
            wishlist = new Wishlist { UserId = userId };
            _unitOfWork.Repository<Wishlist>().Add(wishlist);
        }

        if (wishlist.WishlistItems.Any(wi => wi.BookId == bookId))
            throw new InvalidOperationException("Book already in wishlist");

        var book = await _unitOfWork.Repository<Book>().GetByIdAsync(bookId)
            ?? throw new KeyNotFoundException("Book not found");

        var wishlistItem = new WishlistItem { BookId = bookId, Wishlist = wishlist, Book = book };
        wishlist.WishlistItems.Add(wishlistItem);

        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<WishlistResponseDto>(wishlist);
    }

    public async Task RemoveFromWishlistAsync(int userId, int bookId)
    {
        var wishlist = await _unitOfWork.Repository<Wishlist>()
            .GetQueryable()
            .Include(w => w.WishlistItems)
            .FirstOrDefaultAsync(w => w.UserId == userId)
            ?? throw new KeyNotFoundException("Wishlist not found");

        var item = wishlist.WishlistItems.FirstOrDefault(wi => wi.BookId == bookId)
            ?? throw new KeyNotFoundException("Book not found in wishlist");

        wishlist.WishlistItems.Remove(item);
        _unitOfWork.Repository<WishlistItem>().Remove(item);

        await _unitOfWork.SaveChangesAsync();
    }
}

