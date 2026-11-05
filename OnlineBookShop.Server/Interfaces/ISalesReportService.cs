using OnlineBookShop.Server.DTOs;

namespace OnlineBookShop.Server.Interfaces
{
    public interface ISalesReportService
    {
        Task<SalesReportDto> GetReportAsync(DateTime? from, DateTime? to);
        Task<byte[]> ExportCsvAsync(DateTime? from, DateTime? to);
    }
}
