using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnlineBookShop.Server.Interfaces;

namespace OnlineBookShop.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Customer")] 
    public class OrderStatusHistoryController : ControllerBase
    {
        private readonly IOrderStatusHistoryService _orderStatusHistoryService;

        public OrderStatusHistoryController(IOrderStatusHistoryService orderStatusHistoryService)
        {
            _orderStatusHistoryService = orderStatusHistoryService;
        }

        // GET: api/OrderStatusHistory/order/{orderId}
        [HttpGet("order/{orderId}")]
        public async Task<IActionResult> GetOrderHistory(int orderId)
        {
            var histories = await _orderStatusHistoryService.GetOrderHistoryAsync(orderId);
            return Ok(histories);
        }
    }
}
