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
    }
}
