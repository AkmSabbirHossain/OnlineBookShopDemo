using AutoMapper;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class AddressService : IAddressService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AddressService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<List<AddressResponseDto>> GetAddressesByUserAsync(int userId)
        {
            var addresses = await _unitOfWork.Repository<Address>()
                .FindAsync(a => a.UserId == userId);

            return _mapper.Map<List<AddressResponseDto>>(addresses);
        }

        public async Task<AddressResponseDto?> GetByIdAsync(int id, int userId)
        {
            var address = await _unitOfWork.Repository<Address>()
                .FindAsync(a => a.AddressId == id && a.UserId == userId);

            var entity = address.FirstOrDefault();
            return entity == null ? null : _mapper.Map<AddressResponseDto>(entity);
        }

        public async Task<AddressResponseDto> CreateAsync(AddressCreateDto dto, int userId)
        {
            var address = _mapper.Map<Address>(dto);
            address.UserId = userId;

            _unitOfWork.Repository<Address>().Add(address);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AddressResponseDto>(address);
        }

        public async Task UpdateAsync(int id, AddressUpdateDto dto, int userId)
        {
            var address = await _unitOfWork.Repository<Address>()
                .GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Address not found");

            if (address.UserId != userId)
                throw new UnauthorizedAccessException("Not authorized");

            _mapper.Map(dto, address);
            _unitOfWork.Repository<Address>().Update(address);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id, int userId)
        {
            var address = await _unitOfWork.Repository<Address>()
                .GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Address not found");

            if (address.UserId != userId)
                throw new UnauthorizedAccessException("Not authorized");

            _unitOfWork.Repository<Address>().Remove(address);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
