using AutoMapper;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Models;
using System.Linq;

namespace OnlineBookShop.Server.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // --- User mappings ---
            CreateMap<UserRegisterDto, AppUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email));

            CreateMap<AppUser, UserResponseDto>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            
            // UpdateProfileDto → AppUser
            CreateMap<UpdateProfileDto, AppUser>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            //  Vendor Mappings ===

            CreateMap<VendorRegisterDto, Vendor>()
                .ForMember(dest => dest.IsApproved, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.TotalSales, opt => opt.MapFrom(src => 0))
                .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src => 0))
                .ForMember(dest => dest.TotalReviews, opt => opt.MapFrom(src => 0));

            CreateMap<Vendor, VendorResponseDto>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId));
          
            CreateMap<VendorUpdateDto, Vendor>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));


            // --- Book mappings ---
            CreateMap<BookCreateDto, Book>();
            CreateMap<BookUpdateDto, Book>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Book, BookResponseDto>();

            // --- Order mappings ---

            CreateMap<Order, OrderResponseDto>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems))
                 .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address));

            CreateMap<OrderItem, OrderItemResponseDto>()
                 .ForMember(dest => dest.Title,opt => opt.MapFrom(src => src.Book.Title));

            CreateMap<OrderCreateDto, Order>();
            CreateMap<OrderItemCreateDto, OrderItem>();

            // --- Address mappings ---
            CreateMap<AddressCreateDto, Address>();
            CreateMap<AddressUpdateDto, Address>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Address, AddressResponseDto>();

            // --- Category mappings ---
            CreateMap<CategoryCreateDto, Category>();
            CreateMap<Category, CategoryResponseDto>();

            // Cart → CartResponseDto
            CreateMap<Cart, CartResponseDto>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.CartItems))
                .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => 
                src.CartItems.Sum(ci => ci.Quantity * ci.Book.Price)));

            CreateMap<CartItem, CartItemResponseDto>()
                .ForMember(dest => dest.BookTitle, opt => opt.MapFrom(src => src.Book.Title))
                .ForMember(dest => dest.BookPrice, opt => opt.MapFrom(src => src.Book.Price))
                .ForMember(dest => dest.Subtotal, opt => opt.MapFrom(src => src.Quantity * src.Book.Price))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Book.ImageUrl));

            // --- Review mappings ---
            CreateMap<ReviewCreateDto, Review>();
            CreateMap<Review, ReviewResponseDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.AppUser.UserName));


            // --- VendorEarning mappings ---
            CreateMap<VendorEarning, VendorEarningDto>();

            // --- VendorPayout mappings ---
            CreateMap<VendorPayout, VendorPayoutDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreatePayoutDto, VendorPayout>();

            // --- VendorPayoutSummary mapping ---
            CreateMap<Vendor, VendorPayoutSummaryDto>()
                .ForMember(dest => dest.VendorId, opt => opt.MapFrom(src => src.VendorId))
                .ForMember(dest => dest.VendorName, opt => opt.MapFrom(src => src.ShopName));
            // --- StockHistory mappings ---
            CreateMap<StockHistory, StockHistoryResponseDto>()
                       .ForMember(dest => dest.BookTitle, opt => opt.MapFrom(src => src.Book != null ? src.Book.Title : null));

            // --- OrderStatusHistory mappings ---
            CreateMap<OrderStatusHistory, OrderStatusHistoryResponseDto>()
             .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            // Helpers/MappingProfiles.cs (existing file e add koro)
            CreateMap<Notification, NotificationDto>();
            CreateMap<CreateNotificationDto, Notification>();

            // Wishlist ↔ WishlistResponseDto
            CreateMap<Wishlist, WishlistResponseDto>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.WishlistItems));

            CreateMap<WishlistItem, WishlistItemResponseDto>()
      .ForMember(dest => dest.WishlistItemId, opt => opt.MapFrom(src => src.WishlistItemId))
      .ForMember(dest => dest.BookId, opt => opt.MapFrom(src => src.BookId))
      .ForMember(dest => dest.BookTitle, opt => opt.MapFrom(src => src.Book.Title))
      .ForMember(dest => dest.Author, opt => opt.MapFrom(src => src.Book.Author))
      .ForMember(dest => dest.BookPrice, opt => opt.MapFrom(src => src.Book.Price))
      .ForMember(dest => dest.DiscountPrice, opt => opt.MapFrom(src => src.Book.DiscountPrice))
      .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.Book.ImageUrl))
      .ForMember(dest => dest.Stock, opt => opt.MapFrom(src => src.Book.Stock));
        }


    }
}