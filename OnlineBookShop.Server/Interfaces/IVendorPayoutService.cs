using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface IVendorPayoutService
    {
        Task<List<VendorPayoutSummaryDto>> GetPendingPayoutSummaryAsync();
        Task<List<VendorEarningDto>> GetVendorPendingEarningsAsync(int vendorId);
        Task<VendorPayoutDto> ProcessPayoutAsync(CreatePayoutDto dto);
        Task<List<VendorPayoutDto>> GetPayoutHistoryAsync(int vendorId);
    }
}
