using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnomaliesController : ControllerBase
    {
        private readonly AnomalyService _svc = new();

        // GET api/anomalies/company/{companyId}?status=&severity=&type=
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(
            long companyId,
            [FromQuery] string? status,
            [FromQuery] string? severity,
            [FromQuery] string? type) =>
            Ok(_svc.GetByCompany(companyId, status, severity, type));

        // GET api/anomalies/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var anomaly = _svc.GetById(id);
            return anomaly is null ? NotFound(new { message = "Anomaly not found." }) : Ok(anomaly);
        }

        // GET api/anomalies/stats/{companyId}
        [HttpGet("stats/{companyId:long}")]
        public IActionResult GetStats(long companyId) =>
            Ok(_svc.GetStats(companyId));

        // POST api/anomalies
        [HttpPost]
        public IActionResult Create([FromBody] CreateAnomalyRequest request)
        {
            var (success, id, error) = _svc.Create(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Anomaly created." })
                : BadRequest(new { message = error });
        }

        // PATCH api/anomalies/{id}/resolve
        [HttpPatch("{id:long}/resolve")]
        public IActionResult Resolve(long id, [FromBody] ResolveAnomalyRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, error) = _svc.Resolve(id, userId, request);
            return success ? Ok(new { message = "Anomaly resolved." }) : BadRequest(new { message = error });
        }

        private long GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }
    }
}
