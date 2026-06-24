using FinalProjectAuthAPI.BL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ApiControllerBase
    {
        private readonly INotificationService _svc;

        public NotificationsController(INotificationService svc)
        {
            _svc = svc;
        }

        // GET api/notifications?take=50
        [HttpGet]
        public IActionResult GetMine([FromQuery] int take = 50)
        {
            var userId = GetCurrentUserId();
            var items = _svc.GetByUser(userId, take);
            return Ok(items);
        }

        // PATCH api/notifications/{id}/read
        [HttpPatch("{id:long}/read")]
        public IActionResult MarkRead(long id)
        {
            var userId = GetCurrentUserId();
            _svc.MarkRead(id, userId);
            return Ok(new { message = "Marked as read." });
        }

        // PATCH api/notifications/read-all
        [HttpPatch("read-all")]
        public IActionResult MarkAllRead()
        {
            var userId = GetCurrentUserId();
            var count = _svc.MarkAllRead(userId);
            return Ok(new { updated = count });
        }
    }
}
