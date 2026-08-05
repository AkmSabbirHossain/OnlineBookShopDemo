using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class VendorPayoutController : ControllerBase
{
    private readonly IVendorPayoutService _payoutService;

    public VendorPayoutController(IVendorPayoutService payoutService)
    {
        _payoutService = payoutService;
    }

    // এটি শুধু অ্যাডমিন দেখতে পারবে
    [HttpGet("pending-summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<VendorPayoutSummaryDto>>> GetPendingSummary()
        => Ok(await _payoutService.GetPendingPayoutSummaryAsync());

    // এটি ভেন্ডর এবং অ্যাডমিন উভয়েই দেখতে পারবে
    [HttpGet("vendor/{vendorId}/pending-earnings")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<List<VendorEarningDto>>> GetVendorPending(int vendorId)
        => Ok(await _payoutService.GetVendorPendingEarningsAsync(vendorId));

    // এটি শুধু অ্যাডমিন করতে পারবে
    [HttpPost("process")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<VendorPayoutDto>> ProcessPayout(CreatePayoutDto dto)
    {
        try
        {
            var result = await _payoutService.ProcessPayoutAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // এটি ভেন্ডর এবং অ্যাডমিন উভয়েই দেখতে পারবে
    [HttpGet("vendor/{vendorId}/history")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<List<VendorPayoutDto>>> GetHistory(int vendorId)
        => Ok(await _payoutService.GetPayoutHistoryAsync(vendorId));
}