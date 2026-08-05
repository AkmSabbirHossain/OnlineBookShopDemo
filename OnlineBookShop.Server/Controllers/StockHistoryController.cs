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
        private readonly IMapper _mapper;

        public StockHistoryController(IStockHistoryService stockHistoryService, IMapper mapper)
        {
            _stockHistoryService = stockHistoryService;
            _mapper = mapper;
        }

        // GET: api/StockHistory/book/{bookId}
        [HttpGet("book/{bookId}")]
        public async Task<IActionResult> GetByBookId(int bookId)
        {
            var histories = await _stockHistoryService.GetByBookIdAsync(bookId);

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
            var histories = await _stockHistoryService.GetRecentChangesAsync(count);
            var responseDto = _mapper.Map<IEnumerable<StockHistoryResponseDto>>(histories);
            return Ok(responseDto);
        }

        // GET: api/StockHistory/check/{bookId}
        [HttpGet("check/{bookId}")]
        public async Task<IActionResult> HasHistory(int bookId)
        {
            var hasHistory = await _stockHistoryService.HasHistoryAsync(bookId);
            return Ok(new { bookId, hasHistory });
        }
    }
}