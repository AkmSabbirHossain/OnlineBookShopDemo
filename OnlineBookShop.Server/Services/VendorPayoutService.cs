using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

public class VendorPayoutService : IVendorPayoutService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    private const decimal CommissionRate = 0.10m; 

    public VendorPayoutService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    // Shob vendor er pending balance ekshathe dekhar jonno (admin dashboard)
    public async Task<List<VendorPayoutSummaryDto>> GetPendingPayoutSummaryAsync()
    {
        var summary = await _unitOfWork.Repository<VendorEarning>()
            .GetQueryable()
            .Where(e => !e.IsPaidOut)
            .GroupBy(e => e.VendorId)
            .Select(g => new VendorPayoutSummaryDto
            {
                VendorId = g.Key,
                PendingAmount = g.Sum(e => e.NetAmount),
                PendingEarningsCount = g.Count()
            })
            .ToListAsync();

        var vendorIds = summary.Select(s => s.VendorId).ToList();
        var vendors = await _unitOfWork.Repository<Vendor>()
            .GetQueryable()
            .Where(v => vendorIds.Contains(v.VendorId))
            .ToListAsync();

        var vendorDict = _mapper.Map<List<VendorPayoutSummaryDto>>(vendors)
            .ToDictionary(v => v.VendorId, v => v.VendorName);

        foreach (var s in summary)
            s.VendorName = vendorDict.GetValueOrDefault(s.VendorId, "Unknown");

        return summary;
    }

    public async Task<List<VendorEarningDto>> GetVendorPendingEarningsAsync(int vendorId)
    {
        var earnings = await _unitOfWork.Repository<VendorEarning>()
            .GetQueryable()
            .Where(e => e.VendorId == vendorId && !e.IsPaidOut)
            .OrderBy(e => e.EarnedAt)
            .ToListAsync();

        return _mapper.Map<List<VendorEarningDto>>(earnings);
    }

    // Payout process korar main logic
    public async Task<VendorPayoutDto> ProcessPayoutAsync(CreatePayoutDto dto)
    {
        var pendingEarnings = await _unitOfWork.Repository<VendorEarning>()
            .GetQueryable()
            .Where(e => e.VendorId == dto.VendorId && !e.IsPaidOut)
            .ToListAsync();

        if (!pendingEarnings.Any())
            throw new InvalidOperationException("No pending earnings for this vendor");

        var totalAmount = pendingEarnings.Sum(e => e.NetAmount);

        var payout = new VendorPayout
        {
            VendorId = dto.VendorId,
            Amount = totalAmount,
            PaidAt = DateTime.UtcNow,
            Status = PayoutStatus.Completed,
            TransactionReference = dto.TransactionReference,
            Notes = dto.Notes
        };

        _unitOfWork.Repository<VendorPayout>().Add(payout);
        await _unitOfWork.SaveChangesAsync(); // payout id generate korar jonno save koro age

        // Ekhon earnings gulo ke ei payout er sathe link koro
        foreach (var earning in pendingEarnings)
        {
            earning.IsPaidOut = true;
            earning.VendorPayoutId = payout.VendorPayoutId;
            _unitOfWork.Repository<VendorEarning>().Update(earning);
        }

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<VendorPayoutDto>(payout);
    }

    public async Task<List<VendorPayoutDto>> GetPayoutHistoryAsync(int vendorId)
    {
        var payouts = await _unitOfWork.Repository<VendorPayout>()
            .GetQueryable()
            .Where(p => p.VendorId == vendorId)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();

        return _mapper.Map<List<VendorPayoutDto>>(payouts);
    }
}