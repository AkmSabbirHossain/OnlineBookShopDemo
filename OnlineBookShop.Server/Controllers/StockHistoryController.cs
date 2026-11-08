using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Vendor")]
    public class StockHistoryController : ControllerBase
    {
        private readonly IStockHistoryService _stockHistoryService;
        private readonly IVendorService _vendorService;
        private readonly IMapper _mapper;

        public StockHistoryController(IStockHistoryService stockHistoryService, IVendorService vendorService, IMapper mapper)
        {
            _stockHistoryService = stockHistoryService;
            _vendorService = vendorService;
            _mapper = mapper;
        }

        private async Task<int?> GetMyVendorIdAsync()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);
            return vendor?.VendorId;
        }

        // GET: api/StockHistory/book/{bookId}
        [HttpGet("book/{bookId}")]
        public async Task<IActionResult> GetByBookId(int bookId)
        {
            var vendorId = await GetMyVendorIdAsync();
            if (vendorId == null)
                return Forbid();

            var histories = await _stockHistoryService.GetByBookIdAsync(bookId, vendorId.Value);

            if (histories == null || !histories.Any())
            {
                return NotFound(new { message = $"No stock history found for Book ID: {bookId}" });
            }

            var responseDto = _mapper.Map<IEnumerable<StockHistoryResponseDto>>(histories);
            return Ok(responseDto);
        }

        // GET: api/StockHistory/recent?count=50
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentChanges([FromQuery] int count = 50)
        {
            var vendorId = await GetMyVendorIdAsync();
            if (vendorId == null)
                return Forbid();

            var histories = await _stockHistoryService.GetRecentChangesAsync(vendorId.Value, count);
            var responseDto = _mapper.Map<IEnumerable<StockHistoryResponseDto>>(histories);
            return Ok(responseDto);
        }

        // GET: api/StockHistory/check/{bookId}
        [HttpGet("check/{bookId}")]
        public async Task<IActionResult> HasHistory(int bookId)
        {
            var vendorId = await GetMyVendorIdAsync();
            if (vendorId == null)
                return Forbid();

            var hasHistory = await _stockHistoryService.HasHistoryAsync(bookId, vendorId.Value);
            return Ok(new { bookId, hasHistory });
        }
    }
}