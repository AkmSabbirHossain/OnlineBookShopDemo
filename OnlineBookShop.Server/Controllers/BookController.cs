// BookController.cs — Fixed Version
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using System.Security.Claims;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly IVendorService _vendorService;

        public BookController(IBookService bookService, IVendorService vendorService)
        {
            _bookService = bookService;
            _vendorService = vendorService;
        }

        // ==================== Public Endpoints ====================
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllBooks() => Ok(await _bookService.GetAllBooksAsync());

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchBooks(
            [FromQuery] string? search,
            [FromQuery] int? categoryId,
            [FromQuery] int? authorId,
            [FromQuery] int? publisherId,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? sortBy,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] bool inStockOnly = false,
            [FromQuery] bool discountedOnly = false)
        {
            var result = await _bookService.GetFilteredBooksAsync(
                search, categoryId, authorId, publisherId, minPrice, maxPrice, sortBy, page, pageSize, inStockOnly, discountedOnly);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBook(int id)
        {
            var book = await _bookService.GetBookByIdAsync(id);
            return book == null ? NotFound(new { Error = "Book not found" }) : Ok(book);
        }

        [HttpGet("{id}/related")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRelatedBooks(int id, [FromQuery] int count = 8)
        {
            try
            {
                return Ok(await _bookService.GetRelatedBooksAsync(id, count));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // ==================== Vendor Protected Endpoints ====================

        [HttpPost]
        [Authorize(Roles = "Vendor,Admin")]
        public async Task<IActionResult> CreateBook([FromBody] BookCreateDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);

            if (vendor == null || !vendor.IsApproved)
                return Forbid("You are not an approved vendor.");

            if (!vendor.IsActive)
                return StatusCode(403, new { message = "Your account has been suspended by the Admin." });

            var book = await _bookService.CreateBookAsync(dto, vendor.VendorId);
            return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, book);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Vendor,Admin")]
        public async Task<IActionResult> UpdateBook(int id, [FromBody] BookUpdateDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);

            if (vendor == null || !vendor.IsApproved)
                return Forbid("You are not an approved vendor.");

            if (!vendor.IsActive)
                return StatusCode(403, new { message = "Your account has been suspended by the Admin." });

            var updated = await _bookService.UpdateBookAsync(id, dto, vendor.VendorId);
            return Ok(updated);
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Vendor,Admin")]
        public async Task<IActionResult> SetBookStatus(int id, [FromBody] BookStatusUpdateDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);

            if (vendor == null || !vendor.IsApproved)
                return Forbid("You are not an approved vendor.");

            if (!vendor.IsActive)
                return StatusCode(403, new { message = "Your account has been suspended by the Admin." });

            var updated = await _bookService.SetBookStatusAsync(id, vendor.VendorId, dto.IsActive, dto.IsFeatured);
            return Ok(updated);
        }

        // ==================== Gallery Endpoints ====================

        [HttpPost("{id}/images")]
        [Authorize(Roles = "Vendor,Admin")]
        [RequestSizeLimit(5_242_880)]
        public async Task<IActionResult> UploadBookImage(int id, [FromForm] IFormFile? file)
        {
            var vendor = await GetActiveVendorAsync();
            if (vendor == null)
                return StatusCode(403, new { message = "An approved and active vendor account is required." });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No image file was provided." });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Image must be 5 MB or smaller." });

            try
            {
                await using var stream = file.OpenReadStream();
                var updated = await _bookService.AddBookImageAsync(
                    id,
                    vendor.VendorId,
                    stream,
                    file.FileName,
                    file.ContentType,
                    HttpContext.RequestAborted);

                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}/images/{imageId}")]
        [Authorize(Roles = "Vendor,Admin")]
        public async Task<IActionResult> DeleteBookImage(int id, int imageId)
        {
            var vendor = await GetActiveVendorAsync();
            if (vendor == null)
                return StatusCode(403, new { message = "An approved and active vendor account is required." });

            try
            {
                return Ok(await _bookService.DeleteBookImageAsync(id, imageId, vendor.VendorId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/images/{imageId}/primary")]
        [Authorize(Roles = "Vendor,Admin")]
        public async Task<IActionResult> SetPrimaryBookImage(int id, int imageId)
        {
            var vendor = await GetActiveVendorAsync();
            if (vendor == null)
                return StatusCode(403, new { message = "An approved and active vendor account is required." });

            try
            {
                return Ok(await _bookService.SetPrimaryBookImageAsync(id, imageId, vendor.VendorId));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private async Task<VendorResponseDto?> GetActiveVendorAsync()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);
            return vendor != null && vendor.IsApproved && vendor.IsActive ? vendor : null;
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);

            if (vendor == null || !vendor.IsApproved)
                return Forbid("You are not an approved vendor.");

            if (!vendor.IsActive)
                return StatusCode(403, new { message = "Your account has been suspended by the Admin." });

            await _bookService.DeleteBookAsync(id, vendor.VendorId);
            return NoContent();
        }

        [HttpGet("my")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> GetMyBooks()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId);

            if (vendor == null || !vendor.IsApproved)
                return Forbid("You are not an approved vendor.");

            if (!vendor.IsActive)
                return StatusCode(403, new { message = "Your account has been suspended by the Admin." });

            var books = await _bookService.GetBooksByVendorAsync(vendor.VendorId);
            return Ok(books);
        }
    }
}