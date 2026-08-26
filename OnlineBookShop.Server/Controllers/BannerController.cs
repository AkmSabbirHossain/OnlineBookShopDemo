using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BannerController : ControllerBase
    {
        private readonly IBannerService _bannerService;

        public BannerController(IBannerService bannerService)
        {
            _bannerService = bannerService;
        }

        // Public: Active banners only — HomePage slider e use hobe
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive()
        {
            var banners = await _bannerService.GetActiveAsync();
            return Ok(banners);
        }

        // Admin: All banners (active + inactive)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var banners = await _bannerService.GetAllAsync();
            return Ok(banners);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var banner = await _bannerService.GetByIdAsync(id);
            if (banner == null) return NotFound();
            return Ok(banner);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] BannerCreateDto dto)
        {
            var banner = await _bannerService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = banner.BannerId }, banner);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] BannerCreateDto dto)
        {
            await _bannerService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            await _bannerService.DeleteAsync(id);
            return NoContent();
        }
    }
}