using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.Interfaces;
using System.Security.Claims;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Customer")] 
    public class OrderStatusHistoryController : ControllerBase
    {
        private readonly IOrderStatusHistoryService _orderStatusHistoryService;
        private readonly IOrderService _orderService;

        public OrderStatusHistoryController(
            IOrderStatusHistoryService orderStatusHistoryService,
            IOrderService orderService)
        {
            _orderStatusHistoryService = orderStatusHistoryService;
            _orderService = orderService;
        }

        // GET: api/OrderStatusHistory/order/{orderId}
        [HttpGet("order/{orderId}")]
        public async Task<IActionResult> GetOrderHistory(int orderId)
        {
            // Customers may only read history for their own orders. Admins can read any.
            if (!User.IsInRole("Admin"))
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdClaim, out var userId))
                    return Unauthorized();

                var order = await _orderService.GetOrderByIdAsync(orderId, userId);
                if (order == null)
                    return NotFound(new { message = "Order not found" });
            }

            var histories = await _orderStatusHistoryService.GetOrderHistoryAsync(orderId);
            return Ok(histories);
        }
    }
}
