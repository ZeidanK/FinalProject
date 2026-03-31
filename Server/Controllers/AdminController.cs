using FinalProjectAuthAPI.BL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _svc;

        public AdminController(IAdminService svc)
        {
            _svc = svc;
        }

        // GET api/admin/stats
        [HttpGet("stats")]
        public IActionResult GetStats() =>
            Ok(_svc.GetStats());

        // GET api/admin/users?page=&limit=&role=&search=
        [HttpGet("users")]
        public IActionResult GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? role = null,
            [FromQuery] string? search = null) =>
            Ok(_svc.GetUsers(page, limit, role, search));

        // PATCH api/admin/users/{id}/toggle
        [HttpPatch("users/{id:long}/toggle")]
        public IActionResult ToggleUserActive(long id)
        {
            var (userId, isActive) = _svc.ToggleUserActive(id);
            return Ok(new { id = userId, isActive, message = isActive ? "User activated." : "User deactivated." });
        }

        // GET api/admin/logs?page=&limit=&level=&category=
        [HttpGet("logs")]
        public IActionResult GetLogs(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] string? level = null,
            [FromQuery] string? category = null) =>
            Ok(_svc.GetLogs(page, limit, level, category));

        // GET api/admin/audit-logs?page=&limit=&companyId=
        [HttpGet("audit-logs")]
        public IActionResult GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] long? companyId = null) =>
            Ok(_svc.GetAuditLogs(page, limit, companyId));
    }
}
