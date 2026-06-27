using FinalProjectAuthAPI.BL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminController : ApiControllerBase
    {
        private readonly IAdminService _svc;
        private readonly IRealtimeNotificationService _realtime;

        public AdminController(IAdminService svc, IRealtimeNotificationService realtime)
        {
            _svc = svc;
            _realtime = realtime;
        }

        // GET api/admin/stats
        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            var data = _svc.GetStats();
            return SuccessWithLegacy(data, data, "Admin stats retrieved.");
        }

        // GET api/admin/users?page=&limit=&role=&search=
        [HttpGet("users")]
        public IActionResult GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? role = null,
            [FromQuery] string? search = null)
        {
            var data = _svc.GetUsers(page, limit, role, search);
            return SuccessWithLegacy(data, data, "Admin users retrieved.");
        }

        // PATCH api/admin/users/{id}/toggle
        [HttpPatch("users/{id:long}/toggle")]
        public async Task<IActionResult> ToggleUserActive(long id)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId > 0 && id == currentUserId)
            {
                return BadRequest(new { message = "Admins cannot deactivate their own account." });
            }

            var (userId, isActive) = _svc.ToggleUserActive(id);
            var payload = new
            {
                id = userId,
                isActive,
                message = isActive ? "User activated." : "User deactivated."
            };

            await _realtime.CreateUserNotificationAsync(userId, new FinalProjectAuthAPI.Models.NotificationMessage
            {
                EventType = FinalProjectAuthAPI.Models.NotificationEventTypes.AdminUserActiveToggled,
                Title = isActive ? "Account activated" : "Account deactivated",
                Body = isActive
                    ? "Your account has been activated by an administrator."
                    : "Your account has been deactivated. Contact support if this is an error.",
                Severity = isActive ? "success" : "error",
                TargetType = FinalProjectAuthAPI.Models.NotificationTargetTypes.Profile,
                TargetId = userId.ToString(),
                DedupeKey = $"admin-user:{userId}:active:{isActive}:{DateTime.UtcNow.Ticks}",
            }, payload);
            await _realtime.NotifyAdminsEventAsync(FinalProjectAuthAPI.Models.NotificationEventTypes.AdminUserActiveToggled, new
            {
                targetUserId = userId,
                isActive,
                changedByUserId = GetCurrentUserId()
            });
            if (!isActive)
                await _realtime.RevokeUserAccessAsync(userId);

            return SuccessWithLegacy(payload, payload, payload.message);
        }

        // GET api/admin/logs?page=&limit=&level=&category=
        [HttpGet("logs")]
        public IActionResult GetLogs(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] string? level = null,
            [FromQuery] string? category = null)
        {
            var data = _svc.GetLogs(page, limit, level, category);
            return SuccessWithLegacy(data, data, "System logs retrieved.");
        }

        // DELETE api/admin/logs
        [HttpDelete("logs")]
        public IActionResult ClearLogs()
        {
            var deletedCount = _svc.ClearSystemLogs();
            var payload = new
            {
                deletedCount,
                message = deletedCount == 1
                    ? "1 system log entry cleared."
                    : $"{deletedCount} system log entries cleared."
            };

            return SuccessWithLegacy(payload, payload, payload.message);
        }

        // DELETE api/admin/logs/{id}
        [HttpDelete("logs/{id:long}")]
        public IActionResult DeleteLog(long id)
        {
            var deleted = _svc.DeleteSystemLog(id);
            if (!deleted)
                return NotFound(new { message = "System log entry was not found." });

            var payload = new { id, message = "System log entry deleted." };
            return SuccessWithLegacy(payload, payload, payload.message);
        }

        // GET api/admin/audit-logs?page=&limit=&companyId=
        [HttpGet("audit-logs")]
        public IActionResult GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] long? companyId = null)
        {
            var data = _svc.GetAuditLogs(page, limit, companyId);
            return SuccessWithLegacy(data, data, "Audit logs retrieved.");
        }

        // DELETE api/admin/audit-logs
        [HttpDelete("audit-logs")]
        public IActionResult ClearAuditLogs()
        {
            var deletedCount = _svc.ClearAuditLogs();
            var payload = new
            {
                deletedCount,
                message = deletedCount == 1
                    ? "1 audit log entry cleared."
                    : $"{deletedCount} audit log entries cleared."
            };

            return SuccessWithLegacy(payload, payload, payload.message);
        }

        // DELETE api/admin/audit-logs/{id}
        [HttpDelete("audit-logs/{id:long}")]
        public IActionResult DeleteAuditLog(long id)
        {
            var deleted = _svc.DeleteAuditLog(id);
            if (!deleted)
                return NotFound(new { message = "Audit log entry was not found." });

            var payload = new { id, message = "Audit log entry deleted." };
            return SuccessWithLegacy(payload, payload, payload.message);
        }
    }
}
