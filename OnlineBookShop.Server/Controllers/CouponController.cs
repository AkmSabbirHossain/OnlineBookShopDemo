using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        // Customer: validate a coupon against the current cart total.
        [HttpPost("validate")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Validate([FromBody] CouponApplyDto dto)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null)
                return Unauthorized();

            try
            {
                var result = await _couponService.ValidateForCartAsync(userId.Value, dto.Code);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Admin: list all coupons with usage and computed status.
        [HttpGet("manage")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _couponService.GetAllForAdminAsync());
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CouponUpsertDto dto)
        {
            try
            {
                var coupon = await _couponService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetAll), new { id = coupon.CouponId }, coupon);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] CouponUpsertDto dto)
        {
            try
            {
                return Ok(await _couponService.UpdateAsync(id, dto));
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

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetStatus(int id, [FromBody] CouponStatusUpdateDto dto)
        {
            try
            {
                return Ok(await _couponService.SetStatusAsync(id, dto.IsActive));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        private int? GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
