using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Services
{
    public class StockHistoryService : IStockHistoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public StockHistoryService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<StockHistory>> GetByBookIdAsync(int bookId)
        {
            return await _unitOfWork.Repository<StockHistory>()
                .GetQueryable()
                .Include(h => h.Book)
                .Where(h => h.BookId == bookId)
                .OrderByDescending(h => h.ChangedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<StockHistory> AddStockHistoryAsync(
            int bookId,
            int oldStock,
            int newStock,
            string reason,
            string changedBy,
            string? notes = null,
            int? referenceId = null,
            string? referenceType = null)
        {
            var history = new StockHistory
            {
                BookId = bookId,
                OldStock = oldStock,
                NewStock = newStock,
                Reason = reason,
                ChangedBy = changedBy,
                ChangedAt = DateTime.UtcNow,
                Notes = notes,
                ReferenceId = referenceId,
                ReferenceType = referenceType,
                ChangeReason = GetChangeReasonFromString(reason)
            };

            _unitOfWork.Repository<StockHistory>().Add(history);
            await _unitOfWork.SaveChangesAsync();

            return history;
        }

        public async Task<IEnumerable<StockHistory>> GetRecentChangesAsync(int count = 50)
        {
            return await _unitOfWork.Repository<StockHistory>()
                .GetQueryable()
                .Include(h => h.Book)
                .OrderByDescending(h => h.ChangedAt)
                .Take(count)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> HasHistoryAsync(int bookId)
        {
            return await _unitOfWork.Repository<StockHistory>()
                .GetQueryable()
                .AnyAsync(h => h.BookId == bookId);
        }

        // Helper Method
        private StockChangeReason GetChangeReasonFromString(string reason)
        {
            if (string.IsNullOrWhiteSpace(reason)) return StockChangeReason.ManualAdjustment;

            return reason.ToLower() switch
            {
                var r when r.Contains("sale") => StockChangeReason.Sale,
                var r when r.Contains("purchase") || r.Contains("buy") => StockChangeReason.NewPurchase,
                var r when r.Contains("return") => StockChangeReason.CustomerReturn,
                var r when r.Contains("damage") => StockChangeReason.Damage,
                _ => StockChangeReason.ManualAdjustment
            };
        }
    }
}