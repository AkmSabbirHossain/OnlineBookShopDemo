using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class CartService : ICartService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CartService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<CartResponseDto> GetCartAsync(int userId)
        {
            var cart = await _unitOfWork.Repository<Cart>()
                .GetQueryable()
                .Include(c => c.CartItems)        
                    .ThenInclude(ci => ci.Book)   
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return new CartResponseDto { UserId = userId };

            return _mapper.Map<CartResponseDto>(cart);
        }

        public async Task AddItemAsync(int userId, CartItemCreateDto dto)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var existingItem = cart.CartItems.FirstOrDefault(ci => ci.BookId == dto.BookId);
            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                _unitOfWork.Repository<CartItem>().Update(existingItem);
            }
            else
            {
                var book = await _unitOfWork.Repository<Book>().GetByIdAsync(dto.BookId)
                    ?? throw new KeyNotFoundException("Book not found");

                var cartItem = new CartItem
                {
                    CartId = cart.CartId,
                    BookId = dto.BookId,
                    Quantity = dto.Quantity
                };

                cart.CartItems.Add(cartItem);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateItemAsync(int userId, CartItemUpdateDto dto)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var item = cart.CartItems.FirstOrDefault(ci => ci.BookId == dto.BookId)
                ?? throw new KeyNotFoundException("Item not found in cart");

            item.Quantity = dto.Quantity;
            _unitOfWork.Repository<CartItem>().Update(item);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task RemoveItemAsync(int userId, int bookId)
        {
            var cart = await GetOrCreateCartAsync(userId);

            var item = cart.CartItems.FirstOrDefault(ci => ci.BookId == bookId)
                ?? throw new KeyNotFoundException("Item not found in cart");

            cart.CartItems.Remove(item);
            _unitOfWork.Repository<CartItem>().Remove(item);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task ClearCartAsync(int userId)
        {
            var cart = await GetOrCreateCartAsync(userId);

            _unitOfWork.Repository<CartItem>().RemoveRange(cart.CartItems);
            cart.CartItems.Clear();
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<Cart> GetOrCreateCartAsync(int userId)
        {
            var cart = await _unitOfWork.Repository<Cart>()
                .GetQueryable()
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _unitOfWork.Repository<Cart>().Add(cart);
                await _unitOfWork.SaveChangesAsync();
            }

            return cart;
        }
    }
}
