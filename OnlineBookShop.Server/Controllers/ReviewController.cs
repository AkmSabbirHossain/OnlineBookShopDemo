using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using System.Security.Claims;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        // POST: api/Review
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> AddReview([FromBody] ReviewCreateDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

            try
            {
                var review = await _reviewService.AddReviewAsync(dto, userId);
                return Ok(review);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/Review/book/{bookId} — public so signed-out visitors can read reviews
        [HttpGet("book/{bookId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBookReviews(int bookId)
        {
            var reviews = await _reviewService.GetBookReviewsAsync(bookId);
            return Ok(reviews);
        }

        // DELETE: api/Review/{reviewId}
        [HttpDelete("{reviewId}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> DeleteReview(int reviewId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

            try
            {
                await _reviewService.DeleteReviewAsync(reviewId, userId);
                return Ok(new { Message = "Review deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
