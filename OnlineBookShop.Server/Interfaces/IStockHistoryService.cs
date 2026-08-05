using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Models;

public interface IStockHistoryService
{
    Task<IEnumerable<StockHistory>> GetByBookIdAsync(int bookId);

    Task<StockHistory> AddStockHistoryAsync(int bookId, int oldStock, int newStock,
        string reason, string changedBy, string? notes = null,
        int? referenceId = null, string? referenceType = null);

    Task<IEnumerable<StockHistory>> GetRecentChangesAsync(int count = 50);

    Task<bool> HasHistoryAsync(int bookId);
}