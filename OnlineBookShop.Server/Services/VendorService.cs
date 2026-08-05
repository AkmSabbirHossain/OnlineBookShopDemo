using AutoMapper;
using Microsoft.AspNetCore.Identity;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class VendorService : IVendorService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;
        private readonly INotificationService _notificationService;

        public VendorService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            UserManager<AppUser> userManager,
            INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        // ── Vendor Register ──
        public async Task<VendorResponseDto> RegisterVendorAsync(VendorRegisterDto dto, int userId)
        {
            var existing = await _unitOfWork.Repository<Vendor>()
                .GetFirstOrDefaultAsync(v => v.UserId == userId);

            if (existing != null)
                throw new InvalidOperationException("User is already registered as a vendor");

            var vendor = _mapper.Map<Vendor>(dto);
            vendor.UserId = userId;

            _unitOfWork.Repository<Vendor>().Add(vendor);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<VendorResponseDto>(vendor);
        }

        // ── Get Vendor by UserId ──
        public async Task<VendorResponseDto?> GetVendorByUserIdAsync(int userId)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetFirstOrDefaultAsync(v => v.UserId == userId);

            return vendor == null ? null : _mapper.Map<VendorResponseDto>(vendor);
        }

        // ── Get All Vendors (Only Approved) ──
        public async Task<List<VendorResponseDto>> GetAllVendorsAsync()
        {
            var vendors = await _unitOfWork.Repository<Vendor>()
                .FindAsync(v => v.IsApproved == true);

            return _mapper.Map<List<VendorResponseDto>>(vendors);
        }

        // ── Get Pending Vendors ──
        public async Task<List<VendorResponseDto>> GetPendingVendorsAsync()
        {
            var pending = await _unitOfWork.Repository<Vendor>()
                .FindAsync(v => v.IsApproved == false);

            return _mapper.Map<List<VendorResponseDto>>(pending);
        }

        // ── Approve Vendor ──
        public async Task ApproveVendorAsync(int vendorId)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetByIdAsync(vendorId)
                ?? throw new KeyNotFoundException("Vendor not found");

            vendor.IsApproved = true;
            vendor.IsActive = true;
            vendor.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Vendor>().Update(vendor);
            await UpdateUserRoleAsync(vendor.UserId, AppUserRole.Vendor);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Vendor কে Approved notification
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = vendor.UserId,
                Title = "আপনার Vendor Account Approved! 🎉",
                Message = $"অভিনন্দন! আপনার '{vendor.ShopName}' shop অনুমোদিত হয়েছে। এখন বই বিক্রি শুরু করুন।"
            });
        }

        // ── Reject Vendor ──
        public async Task RejectVendorAsync(int vendorId)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetByIdAsync(vendorId)
                ?? throw new KeyNotFoundException("Vendor not found");

            // Remove করার আগে UserId save করো
            var userId = vendor.UserId;
            var shopName = vendor.ShopName;

            await UpdateUserRoleAsync(userId, AppUserRole.Customer);
            _unitOfWork.Repository<Vendor>().Remove(vendor);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Vendor কে Rejected notification
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = userId,
                Title = "Vendor আবেদন প্রত্যাখ্যাত ❌",
                Message = $"দুঃখিত, '{shopName}' এর Vendor আবেদন এই মুহূর্তে গ্রহণ করা সম্ভব হয়নি। পরে আবার চেষ্টা করুন।"
            });
        }

        // ── Suspend Vendor ──
        public async Task SuspendVendorAsync(int vendorId)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetByIdAsync(vendorId)
                ?? throw new KeyNotFoundException("Vendor not found");

            vendor.IsActive = false;
            vendor.UpdatedAt = DateTime.UtcNow;
            vendor.AdminNote = "Suspended by admin";

            _unitOfWork.Repository<Vendor>().Update(vendor);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Vendor কে Suspended notification
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = vendor.UserId,
                Title = "আপনার Shop Suspended ⚠️",
                Message = $"'{vendor.ShopName}' shop সাময়িকভাবে স্থগিত করা হয়েছে। বিস্তারিত জানতে Admin এর সাথে যোগাযোগ করুন।"
            });
        }

        // ── Activate Vendor ──
        public async Task ActivateVendorAsync(int vendorId)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetByIdAsync(vendorId)
                ?? throw new KeyNotFoundException("Vendor not found");

            vendor.IsActive = true;
            vendor.UpdatedAt = DateTime.UtcNow;
            vendor.AdminNote = "Activated by admin";

            _unitOfWork.Repository<Vendor>().Update(vendor);
            await _unitOfWork.SaveChangesAsync();

            // ✅ Vendor কে Activated notification
            await _notificationService.CreateNotificationAsync(new CreateNotificationDto
            {
                UserId = vendor.UserId,
                Title = "আপনার Shop আবার চালু হয়েছে ✅",
                Message = $"'{vendor.ShopName}' shop পুনরায় সক্রিয় করা হয়েছে। আপনি আবার বিক্রি শুরু করতে পারবেন।"
            });
        }

        // ── Update Vendor Profile ──
        public async Task<VendorResponseDto> UpdateVendorProfileAsync(VendorUpdateDto dto, int userId)
        {
            var vendor = await _unitOfWork.Repository<Vendor>()
                .GetFirstOrDefaultAsync(v => v.UserId == userId)
                ?? throw new KeyNotFoundException("Vendor profile not found");

            if (!vendor.IsApproved)
                throw new InvalidOperationException("Your vendor account is not approved yet");

            if (!string.IsNullOrWhiteSpace(dto.ShopName))
                vendor.ShopName = dto.ShopName;

            if (!string.IsNullOrWhiteSpace(dto.Description))
                vendor.Description = dto.Description;

            if (!string.IsNullOrWhiteSpace(dto.ShopAddress))
                vendor.Address = dto.ShopAddress;

            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                vendor.PhoneNumber = dto.PhoneNumber;

            if (!string.IsNullOrWhiteSpace(dto.City))
                vendor.City = dto.City;

            if (!string.IsNullOrWhiteSpace(dto.LogoUrl))
                vendor.LogoUrl = dto.LogoUrl;

            if (!string.IsNullOrWhiteSpace(dto.BannerUrl))
                vendor.BannerUrl = dto.BannerUrl;

            if (!string.IsNullOrWhiteSpace(dto.BusinessRegistrationNumber))
                vendor.BusinessRegistrationNumber = dto.BusinessRegistrationNumber;

            vendor.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Vendor>().Update(vendor);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<VendorResponseDto>(vendor);
        }

        // ── Private Helper ──
        private async Task UpdateUserRoleAsync(int userId, AppUserRole role)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return;

            user.Role = role;
            await _userManager.UpdateAsync(user);

            string roleName = role.ToString();

            if (!await _userManager.IsInRoleAsync(user, roleName))
                await _userManager.AddToRoleAsync(user, roleName);

            string oppositeRole = role == AppUserRole.Vendor ? "Customer" : "Vendor";
            if (await _userManager.IsInRoleAsync(user, oppositeRole))
                await _userManager.RemoveFromRoleAsync(user, oppositeRole);
        }
    }
}

//using AutoMapper;
//using Microsoft.AspNetCore.Identity;
//using OnlineBookShop.Server.DTOs;
//using OnlineBookShop.Server.Interfaces;
//using OnlineBookShop.Server.Models;

//namespace OnlineBookShop.Server.Services
//{
//    public class VendorService : IVendorService
//    {
//        private readonly IUnitOfWork _unitOfWork;
//        private readonly IMapper _mapper;
//        private readonly UserManager<AppUser> _userManager;

//        public VendorService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<AppUser> userManager)
//        {
//            _unitOfWork = unitOfWork;
//            _mapper = mapper;
//            _userManager = userManager;
//        }

//        // ── Vendor Register ──
//        public async Task<VendorResponseDto> RegisterVendorAsync(VendorRegisterDto dto, int userId)
//        {
//            var existing = await _unitOfWork.Repository<Vendor>()
//                .GetFirstOrDefaultAsync(v => v.UserId == userId);

//            if (existing != null)
//                throw new InvalidOperationException("User is already registered as a vendor");

//            var vendor = _mapper.Map<Vendor>(dto);
//            vendor.UserId = userId;
//            // IsApproved, IsActive, CreatedAt etc. already handled in AutoMapper

//            _unitOfWork.Repository<Vendor>().Add(vendor);
//            await _unitOfWork.SaveChangesAsync();

//            return _mapper.Map<VendorResponseDto>(vendor);
//        }

//        // ── Get Vendor by UserId ──
//        public async Task<VendorResponseDto?> GetVendorByUserIdAsync(int userId)
//        {
//            var vendor = await _unitOfWork.Repository<Vendor>()
//                .GetFirstOrDefaultAsync(v => v.UserId == userId);

//            return vendor == null ? null : _mapper.Map<VendorResponseDto>(vendor);
//        }
//        // ── Get All Vendors (Only Approved) ──
//        public async Task<List<VendorResponseDto>> GetAllVendorsAsync()
//        {
//            var vendors = await _unitOfWork.Repository<Vendor>()
//                .FindAsync(v => v.IsApproved == true);   // ← শুধু Approved ভেন্ডর

//            return _mapper.Map<List<VendorResponseDto>>(vendors);
//        }

//        // ── Get Pending Vendors ──
//        public async Task<List<VendorResponseDto>> GetPendingVendorsAsync()
//        {
//            var pending = await _unitOfWork.Repository<Vendor>()
//                .FindAsync(v => v.IsApproved == false);   // ← শুধু Pending

//            return _mapper.Map<List<VendorResponseDto>>(pending);
//        }

//        // ── Approve Vendor ──
//        public async Task ApproveVendorAsync(int vendorId)
//        {
//            var vendor = await _unitOfWork.Repository<Vendor>()
//                .GetByIdAsync(vendorId) ?? throw new KeyNotFoundException("Vendor not found");

//            vendor.IsApproved = true;
//            vendor.IsActive = true;
//            vendor.UpdatedAt = DateTime.UtcNow;

//            _unitOfWork.Repository<Vendor>().Update(vendor);

//            await UpdateUserRoleAsync(vendor.UserId, AppUserRole.Vendor);

//            await _unitOfWork.SaveChangesAsync();
//        }

//        // ── Reject Vendor ──
//        public async Task RejectVendorAsync(int vendorId)
//        {
//            var vendor = await _unitOfWork.Repository<Vendor>()
//                .GetByIdAsync(vendorId) ?? throw new KeyNotFoundException("Vendor not found");

//            await UpdateUserRoleAsync(vendor.UserId, AppUserRole.Customer);

//            _unitOfWork.Repository<Vendor>().Remove(vendor);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        // ── Suspend Vendor ──
//        public async Task SuspendVendorAsync(int vendorId)
//        {
//            var vendor = await _unitOfWork.Repository<Vendor>()
//                .GetByIdAsync(vendorId) ?? throw new KeyNotFoundException("Vendor not found");

//            vendor.IsActive = false;
//            vendor.UpdatedAt = DateTime.UtcNow;
//            vendor.AdminNote = "Suspended by admin";

//            _unitOfWork.Repository<Vendor>().Update(vendor);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        // ── Activate Vendor ──
//        public async Task ActivateVendorAsync(int vendorId)
//        {
//            var vendor = await _unitOfWork.Repository<Vendor>()
//                .GetByIdAsync(vendorId) ?? throw new KeyNotFoundException("Vendor not found");

//            vendor.IsActive = true;
//            vendor.UpdatedAt = DateTime.UtcNow;
//            vendor.AdminNote = "Activated by admin";

//            _unitOfWork.Repository<Vendor>().Update(vendor);
//            await _unitOfWork.SaveChangesAsync();
//        }

//        // ── Private Helper Method ──
//        private async Task UpdateUserRoleAsync(int userId, AppUserRole role)
//        {
//            var user = await _userManager.FindByIdAsync(userId.ToString());
//            if (user == null) return;

//            user.Role = role;
//            await _userManager.UpdateAsync(user);

//            string roleName = role.ToString();

//            if (!await _userManager.IsInRoleAsync(user, roleName))
//                await _userManager.AddToRoleAsync(user, roleName);

//            // Remove conflicting role
//            string oppositeRole = role == AppUserRole.Vendor ? "Customer" : "Vendor";
//            if (await _userManager.IsInRoleAsync(user, oppositeRole))
//                await _userManager.RemoveFromRoleAsync(user, oppositeRole);
//        }
//        public async Task<VendorResponseDto> UpdateVendorProfileAsync(VendorUpdateDto dto, int userId)
//        {
//            var vendor = await _unitOfWork.Repository<Vendor>()
//                .GetFirstOrDefaultAsync(v => v.UserId == userId);

//            if (vendor == null)
//                throw new KeyNotFoundException("Vendor profile not found");

//            if (!vendor.IsApproved)
//                throw new InvalidOperationException("Your vendor account is not approved yet");


//            if (!string.IsNullOrWhiteSpace(dto.ShopName))
//                vendor.ShopName = dto.ShopName;

//            if (!string.IsNullOrWhiteSpace(dto.Description))
//                vendor.Description = dto.Description;   

//            if (!string.IsNullOrWhiteSpace(dto.ShopAddress))
//                vendor.Address = dto.ShopAddress;          

//            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
//                vendor.PhoneNumber = dto.PhoneNumber;

//            if (!string.IsNullOrWhiteSpace(dto.City))
//                vendor.City = dto.City;

//            if (!string.IsNullOrWhiteSpace(dto.LogoUrl))
//                vendor.LogoUrl = dto.LogoUrl;

//            if (!string.IsNullOrWhiteSpace(dto.BannerUrl))
//                vendor.BannerUrl = dto.BannerUrl;

//            if (!string.IsNullOrWhiteSpace(dto.BusinessRegistrationNumber))
//                vendor.BusinessRegistrationNumber = dto.BusinessRegistrationNumber; 

//            vendor.UpdatedAt = DateTime.UtcNow;

//            _unitOfWork.Repository<Vendor>().Update(vendor);
//            await _unitOfWork.SaveChangesAsync();

//            return _mapper.Map<VendorResponseDto>(vendor);
//        }
//    }
//}

