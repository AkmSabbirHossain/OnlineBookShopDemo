using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using System.Security.Claims;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] 
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        // ==========================================
        // Show your all address
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetMyAddresses()
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var addresses = await _addressService.GetAddressesByUserAsync(userId);
            return Ok(addresses);
        }

        // ==========================================
        //Show Specific address
        // ==========================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var address = await _addressService.GetByIdAsync(id, userId);

            if (address == null)
                return NotFound(new { Message = "Address not found or unauthorized access." });

            return Ok(address);
        }

        // ==========================================
        // Create new address
        // ==========================================
        [HttpPost]
        [Authorize(Roles = "Customer")] 
        public async Task<IActionResult> Create([FromBody] AddressCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = GetUserId();
            var address = await _addressService.CreateAsync(dto, userId);

            return CreatedAtAction(nameof(GetById), new { id = address.AddressId }, address);
        }

        // ==========================================
        // Update address
        // ==========================================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AddressUpdateDto dto)
        {
            var userId = GetUserId();
            try
            {
                await _addressService.UpdateAsync(id, dto, userId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = "Address not found." });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // ==========================================
        // Delete address
        // ==========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            try
            {
                await _addressService.DeleteAsync(id, userId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = "Address not found." });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // ---------------------------------------------------------
        // Helper: Token theke user id berkorar method
        // ---------------------------------------------------------
        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(claim) ? 0 : int.Parse(claim);
        }
    }
}