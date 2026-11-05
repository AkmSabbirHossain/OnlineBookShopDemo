using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.Interfaces;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/admin/sales-report")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SalesReportController : ControllerBase
    {
        private readonly ISalesReportService _salesReportService;

        public SalesReportController(ISalesReportService salesReportService)
        {
            _salesReportService = salesReportService;
        }

        [HttpGet]
        public async Task<IActionResult> GetReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            try
            {
                return Ok(await _salesReportService.GetReportAsync(from, to));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            try
            {
                var csv = await _salesReportService.ExportCsvAsync(from, to);
                var today = DateTime.UtcNow.Date;
                var start = (from ?? today.AddDays(-29)).Date;
                var end = (to ?? today).Date;

                return File(
                    csv,
                    "text/csv; charset=utf-8",
                    $"sales-report-{start:yyyyMMdd}-{end:yyyyMMdd}.csv");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
