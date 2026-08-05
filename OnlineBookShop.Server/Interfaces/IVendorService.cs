// =============================================
// IVendorService.cs
// =============================================
using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IVendorService
    {
        Task<VendorResponseDto> RegisterVendorAsync(VendorRegisterDto dto, int userId);
        Task<VendorResponseDto?> GetVendorByUserIdAsync(int userId);
        Task<List<VendorResponseDto>> GetAllVendorsAsync();
        Task<List<VendorResponseDto>> GetPendingVendorsAsync();
        Task ApproveVendorAsync(int vendorId);
        Task RejectVendorAsync(int vendorId);
        Task SuspendVendorAsync(int vendorId);
        Task ActivateVendorAsync(int vendorId);


        Task<VendorResponseDto> UpdateVendorProfileAsync(VendorUpdateDto dto, int userId);
    }
}






//using OnlineBookShop.Server.DTOs;

//namespace OnlineBookShop.Server.Interfaces
//{
//    public interface IVendorService
//    {
//        Task<VendorResponseDto> RegisterVendorAsync(VendorRegisterDto dto, int userId);
//        Task<VendorResponseDto?> GetVendorByUserIdAsync(int userId);
//        Task ApproveVendorAsync(int vendorId);
//        Task RejectVendorAsync(int vendorId);
//        Task<List<VendorResponseDto>> GetPendingVendorsAsync();

//    }
//}
