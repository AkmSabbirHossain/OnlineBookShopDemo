using AutoMapper;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class BannerService : IBannerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public BannerService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<List<BannerResponseDto>> GetAllAsync()
        {
            var banners = await _unitOfWork.Repository<Banner>().GetAllAsync();
            var ordered = banners.OrderBy(b => b.DisplayOrder);
            return _mapper.Map<List<BannerResponseDto>>(ordered);
        }

        public async Task<List<BannerResponseDto>> GetActiveAsync()
        {
            var banners = await _unitOfWork.Repository<Banner>().GetAllAsync();
            var active = banners.Where(b => b.IsActive).OrderBy(b => b.DisplayOrder);
            return _mapper.Map<List<BannerResponseDto>>(active);
        }

        public async Task<BannerResponseDto?> GetByIdAsync(int id)
        {
            var banner = await _unitOfWork.Repository<Banner>().GetByIdAsync(id);
            return banner == null ? null : _mapper.Map<BannerResponseDto>(banner);
        }

        public async Task<BannerResponseDto> CreateAsync(BannerCreateDto dto)
        {
            var banner = _mapper.Map<Banner>(dto);
            _unitOfWork.Repository<Banner>().Add(banner);
            await _unitOfWork.SaveChangesAsync();
            return _mapper.Map<BannerResponseDto>(banner);
        }

        public async Task UpdateAsync(int id, BannerCreateDto dto)
        {
            var banner = await _unitOfWork.Repository<Banner>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Banner not found");

            _mapper.Map(dto, banner);
            _unitOfWork.Repository<Banner>().Update(banner);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var banner = await _unitOfWork.Repository<Banner>().GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Banner not found");

            _unitOfWork.Repository<Banner>().Remove(banner);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}