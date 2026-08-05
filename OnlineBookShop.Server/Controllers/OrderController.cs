
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.DTOs;
using OnlineBookShop.Server.Interfaces;
using System.Security.Claims;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IVendorService _vendorService;

        public OrderController(IOrderService orderService, IVendorService vendorService)
        {
            _orderService = orderService;
            _vendorService = vendorService; // ← add করো
        }

        // Customer: Create a new order
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null)
                return Unauthorized();

            var order = await _orderService.CreateOrderAsync(dto, userId.Value);
            return CreatedAtAction(nameof(GetOrder), new { orderId = order.OrderId }, order);
        }

        // Customer: Get my orders
        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetUserIdFromClaims();
            if (userId == null)
                return Unauthorized();

            var orders = await _orderService.GetUserOrdersAsync(userId.Value);
            return Ok(orders);
        }

        // Customer/Vendor: Get specific order
        [HttpGet("{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetOrder(int orderId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null)
                return Unauthorized();

            var order = await _orderService.GetOrderByIdAsync(orderId, userId.Value);
            if (order == null)
                return NotFound(new { Error = "Order not found" });

            return Ok(order);
        }

        // Vendor/Admin: Update order status
        [HttpPut("{orderId}/status")]
        [Authorize(Roles = "Vendor,Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] OrderStatusUpdateDto dto)
        {
            try
            {
                await _orderService.UpdateOrderStatusAsync(orderId, dto.NewStatus);
                return Ok(new { Message = $"Order {orderId} status updated to {dto.NewStatus}" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        // Customer: Cancel order
        [HttpPost("{orderId}/cancel")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> CancelOrder(int orderId)
        {
            var userId = GetUserIdFromClaims();
            if (userId == null)
                return Unauthorized();

            await _orderService.CancelOrderAsync(orderId, userId.Value);
            return Ok(new { Message = "Order cancelled successfully" });
        }

        // ── Vendor: Get my orders 

        [HttpGet("vendor/my")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> GetVendorOrders()
        {

            var userId = GetUserIdFromClaims();
            if (userId == null)
                return Unauthorized();
            var vendor = await _vendorService.GetVendorByUserIdAsync(userId.Value);
            if (vendor == null)
                return NotFound(new { Error = "Vendor profile not found" });

            if (!vendor.IsApproved)
                return Forbid();

            var orders = await _orderService.GetVendorOrdersAsync(vendor.VendorId);
            return Ok(orders);
        }

        // Helper: safely get userId from claims
        private int? GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return null;
            return userId;
        }
    }
}