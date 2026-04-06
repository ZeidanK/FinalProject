using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnomaliesController : ApiControllerBase
    {
        private readonly IAnomalyService _svc;

        public AnomaliesController(IAnomalyService svc)
        {
            _svc = svc;
        }

        // GET api/anomalies/company/{companyId}?status=&severity=&type=
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(
            long companyId,
            [FromQuery] string? status,
            [FromQuery] string? severity,
            [FromQuery] string? type)
        {
            var data = _svc.GetByCompany(companyId, status, severity, type);
            var legacy = new
            {
                items = data,
                totalCount = data?.Count ?? 0
            };

            return SuccessWithLegacy(data, legacy, "Anomalies retrieved.");
        }

        // GET api/anomalies/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var anomaly = _svc.GetById(id);
            return anomaly is null
                ? NotFound(new { message = "Anomaly not found." })
                : SuccessWithLegacy(anomaly, anomaly, "Anomaly retrieved.");
        }

        // GET api/anomalies/stats/{companyId}
        [HttpGet("stats/{companyId:long}")]
        public IActionResult GetStats(long companyId)
        {
            var data = _svc.GetStats(companyId);
            return SuccessWithLegacy(data, data, "Anomaly stats retrieved.");
        }

        // POST api/anomalies
        [HttpPost]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public IActionResult Create([FromBody] CreateAnomalyRequest request)
        {
            var (success, id, error) = _svc.Create(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new
                {
                    success = true,
                    code = 201,
                    message = "Anomaly created.",
                    data = new { id },
                    id
                })
                : BadRequest(new { message = error });
        }

        // PATCH api/anomalies/{id}/resolve
        [HttpPatch("{id:long}/resolve")]
        public IActionResult Resolve(long id, [FromBody] ResolveAnomalyRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, error) = _svc.Resolve(id, userId, request);
            if (!success)
            {
                return BadRequest(new { message = error });
            }

            var payload = new { id, status = request.Status, resolutionNotes = request.ResolutionNotes };
            return SuccessWithLegacy(payload, new { message = "Anomaly resolved." }, "Anomaly resolved.");
        }

    }
}
