//using AutoMapper;
//using OnlineBookShop.Server.DTOs;
//using OnlineBookShop.Server.Interfaces;
//using OnlineBookShop.Server.Models;

//namespace OnlineBookShop.Server.Services
//{
//    public class CategoryService : ICategoryService
//    {
//        private readonly IUnitOfWork _unitOfWork;
//        private readonly IMapper _mapper;

//        public CategoryService(IUnitOfWork unitOfWork, IMapper mapper)
//        {
//            _unitOfWork = unitOfWork;
//            _mapper = mapper;
//        }

//        public async Task<List<CategoryResponseDto>> GetAllAsync()
//        {
//            var categories = await _unitOfWork.Repository<Category>().GetAllAsync();
//            return _mapper.Map<List<CategoryResponseDto>>(categories);
//        }

//        public async Task<CategoryResponseDto?> GetByIdAsync(int id)
//        {
//            var category = await _unitOfWork.Repository<Category>().GetByIdAsync(id);
//            return category == null ? null : _mapper.Map<CategoryResponseDto>(category);
//        }

//        public async Task<CategoryResponseDto> CreateAsync(CategoryCreateDto dto)
//        {
//            var category = _mapper.Map<Category>(dto);
//            _unitOfWork.Repository<Category>().Add(category);
//            await _unitOfWork.SaveChangesAsync();
//            return _mapper.Map<CategoryResponseDto>(category);
//        }

//        public async Task UpdateAsync(int id, CategoryCreateDto dto)
//        {
//            var category = await _unitOfWork.Repository<Category>().GetByIdAsync(id)
//                ?? throw new KeyNotFoundException("Category not found");

//            _mapper.Map(dto, category);
//            _unitOfWork.Repository<Category>().Update(category);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        public async Task DeleteAsync(int id)
//        {
//            var category = await _unitOfWork.Repository<Category>().GetByIdAsync(id)
//                ?? throw new KeyNotFoundException("Category not found");

//            _unitOfWork.Repository<Category>().Remove(category);
//            await _unitOfWork.SaveChangesAsync();
//        }
//    }
//}


using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;

        public CategoryService(IUnitOfWork unitOfWork, IMapper mapper, IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cache = cache;
        }

        // ── Get All Categories — CACHED, 30 minute (kom change hoy) ──
        public async Task<List<CategoryResponseDto>> GetAllAsync()
        {
            if (_cache.TryGetValue(CacheKeys.AllCategories, out List<CategoryResponseDto>? cached) && cached != null)
            {
                return cached;
            }

            var result = await _unitOfWork.Repository<Category>()
                .GetQueryable()
                .Select(c => new CategoryResponseDto
                {
                    CategoryId = c.CategoryId,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    DisplayOrder = c.DisplayOrder,
                    IsActive = c.IsActive,
                    BookCount = c.Books.Count(b => !b.IsDeleted && b.IsActive)
                })
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            _cache.Set(CacheKeys.AllCategories, result, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            });

            return result;
        }

        // ── Get By Id — NOT cached (kom hit hoy, admin panel e beshi use hoy) ──
        public async Task<CategoryResponseDto?> GetByIdAsync(int id)
        {
            var category = await _unitOfWork.Repository<Category>().GetByIdAsync(id);
            return category == null ? null : _mapper.Map<CategoryResponseDto>(category);
        }

        // ── Create — cache invalidate ──
        public async Task<CategoryResponseDto> CreateAsync(CategoryCreateDto dto)
        {
            var category = _mapper.Map<Category>(dto);
            _unitOfWork.Repository<Category>().Add(category);
            await _unitOfWork.SaveChangesAsync();

            _cache.Remove(CacheKeys.AllCategories);   

            return _mapper.Map<CategoryResponseDto>(category);
        }

        // ── Update — cache invalidate ──
        public async Task UpdateAsync(int id, CategoryCreateDto dto)
        {
            var category = await _unitOfWork.Repository<Category>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Category not found");

            _mapper.Map(dto, category);
            _unitOfWork.Repository<Category>().Update(category);
            await _unitOfWork.SaveChangesAsync();

            _cache.Remove(CacheKeys.AllCategories);   
        }

        // ── Delete — cache invalidate ──
        public async Task DeleteAsync(int id)
        {
            var category = await _unitOfWork.Repository<Category>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Category not found");

            _unitOfWork.Repository<Category>().Remove(category);
            await _unitOfWork.SaveChangesAsync();

            _cache.Remove(CacheKeys.AllCategories);   
        }
    }
}