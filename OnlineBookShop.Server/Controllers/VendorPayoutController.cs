using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class VendorPayoutController : ControllerBase
{
    private readonly IVendorPayoutService _payoutService;
    private readonly IVendorService _vendorService;

    public VendorPayoutController(IVendorPayoutService payoutService, IVendorService vendorService)
    {
        _payoutService = payoutService;
        _vendorService = vendorService;
    }

    // এটি শুধু অ্যাডমিন দেখতে পারবে
    [HttpGet("pending-summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<VendorPayoutSummaryDto>>> GetPendingSummary()
        => Ok(await _payoutService.GetPendingPayoutSummaryAsync());

    // এটি ভেন্ডর এবং অ্যাডমিন উভয়েই দেখতে পারবে; ভেন্ডর শুধু নিজের ডেটা দেখতে পারবে
    [HttpGet("vendor/{vendorId}/pending-earnings")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<List<VendorEarningDto>>> GetVendorPending(int vendorId)
    {
        var effectiveVendorId = await ResolveVendorIdAsync(vendorId);
        if (effectiveVendorId == null)
            return Forbid();

        return Ok(await _payoutService.GetVendorPendingEarningsAsync(effectiveVendorId.Value));
    }

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

    // এটি ভেন্ডর এবং অ্যাডমিন উভয়েই দেখতে পারবে; ভেন্ডর শুধু নিজের ডেটা দেখতে পারবে
    [HttpGet("vendor/{vendorId}/history")]
    [Authorize(Roles = "Admin,Vendor")]
    public async Task<ActionResult<List<VendorPayoutDto>>> GetHistory(int vendorId)
    {
        var effectiveVendorId = await ResolveVendorIdAsync(vendorId);
        if (effectiveVendorId == null)
            return Forbid();

        return Ok(await _payoutService.GetPayoutHistoryAsync(effectiveVendorId.Value));
    }

    // অ্যাডমিন route-এর vendorId ব্যবহার করতে পারে; ভেন্ডরকে সবসময় নিজের claims থেকে vendorId বেঁধে দেওয়া হয়
    private async Task<int?> ResolveVendorIdAsync(int vendorId)
    {
        if (User.IsInRole("Admin"))
            return vendorId;

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var vendor = await _vendorService.GetVendorByUserIdAsync(userId);

        return vendor?.VendorId;
    }
}