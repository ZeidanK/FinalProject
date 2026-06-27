using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
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
        private readonly IRealtimeNotificationService _realtime;
        private readonly DBservices _db;

        public NotificationsController(
            INotificationService svc,
            IRealtimeNotificationService realtime,
            DBservices db)
        {
            _svc = svc;
            _realtime = realtime;
            _db = db;
        }

        // GET api/notifications?take=50
        [HttpGet]
        public IActionResult GetMine([FromQuery] int take = 50)
        {
            var userId = GetCurrentUserId();
            var result = _svc.GetInbox(userId, NotificationViews.Combined, null, null, take);
            return Ok(result.Items);
        }

        // GET api/notifications/inbox?view=personal|company|combined&companyId=&cursor=&take=25
        [HttpGet("inbox")]
        public IActionResult GetInbox(
            [FromQuery] string view = NotificationViews.Combined,
            [FromQuery] long? companyId = null,
            [FromQuery] string? cursor = null,
            [FromQuery] int take = 25)
        {
            var userId = GetCurrentUserId();
            var normalizedView = view.Trim().ToLowerInvariant();
            if (normalizedView == NotificationViews.Company)
            {
                if (!companyId.HasValue)
                    return BadRequest(new { message = "CompanyId is required for the company notification view." });
                if (!_db.UserHasActiveCompanyAccess(userId, companyId.Value))
                    return Forbid();
            }

            return Ok(_svc.GetInbox(userId, normalizedView, companyId, cursor, take));
        }

        // PATCH api/notifications/{id}/read
        [HttpPatch("{id:long}/read")]
        public async Task<IActionResult> MarkRead(long id, [FromQuery] long? companyId = null, [FromQuery] string view = NotificationViews.Combined)
        {
            var userId = GetCurrentUserId();
            var row = _db.GetNotificationById(id, userId);
            if (row == null)
                return NotFound(new { message = "Notification not found." });

            if (!row.IsRead)
                _svc.MarkRead(id, userId);

            var counts = _svc.GetUnreadCounts(userId, companyId, view);
            await _realtime.NotifyReadStateChangedAsync(userId, new { id, counts });
            return Ok(new { id, isRead = true, counts });
        }

        // PATCH api/notifications/read-all
        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllRead(
            [FromQuery] string view = NotificationViews.Combined,
            [FromQuery] long? companyId = null)
        {
            var userId = GetCurrentUserId();
            var normalizedView = view.Trim().ToLowerInvariant();
            if (normalizedView == NotificationViews.Company)
            {
                if (!companyId.HasValue)
                    return BadRequest(new { message = "CompanyId is required for the company notification view." });
                if (!_db.UserHasActiveCompanyAccess(userId, companyId.Value))
                    return Forbid();
            }

            var count = _svc.MarkAllRead(userId, normalizedView, companyId);
            var counts = _svc.GetUnreadCounts(userId, companyId, normalizedView);
            await _realtime.NotifyReadStateChangedAsync(userId, new { view = normalizedView, companyId, counts });
            return Ok(new { updated = count, counts });
        }
    }
}
