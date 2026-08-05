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

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBook(int id)
        {
            var book = await _bookService.GetBookByIdAsync(id);
            return book == null ? NotFound(new { Error = "Book not found" }) : Ok(book);
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

            await _bookService.UpdateBookAsync(id, dto, vendor.VendorId);
            return Ok(new { message = "Book updated successfully" });
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