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
    public class AnomaliesController : ApiControllerBase
    {
        private readonly IAnomalyService _svc;
        private readonly DBservices _db;
        private readonly IFileStorageService _fileSvc;
        private readonly IRealtimeNotificationService _realtime;

        public AnomaliesController(IAnomalyService svc, DBservices db, IFileStorageService fileSvc, IRealtimeNotificationService realtime)
        {
            _svc = svc;
            _db = db;
            _fileSvc = fileSvc;
            _realtime = realtime;
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

            if (success)
            {
                _ = _realtime.NotifyCompanyEventAsync(request.CompanyId, "anomaly.created", new
                {
                    anomalyId = id,
                    request.CompanyId,
                    request.AnomalyType,
                    request.Severity,
                    request.Title
                },
                title: $"Anomaly detected: {request.Title}",
                body: request.Description ?? string.Empty,
                severity: request.Severity == "critical" || request.Severity == "high" ? "error" : "warning",
                link: "/anomalies");
            }

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

            var status = string.IsNullOrWhiteSpace(request.Status)
                ? "resolved"
                : request.Status.Trim().ToLowerInvariant();
            var message = status == "open"
                ? "Anomaly marked unresolved."
                : "Anomaly resolved.";
            var payload = new { id, status, resolutionNotes = request.ResolutionNotes };

            var anomaly = _svc.GetById(id);
            if (anomaly != null)
            {
                _ = _realtime.NotifyCompanyEventAsync(anomaly.CompanyId, "anomaly.resolved", new
                {
                    anomalyId = id,
                    anomaly.CompanyId,
                    status,
                    resolvedByUserId = userId,
                    request.ResolutionNotes
                },
                title: "Anomaly resolved",
                body: $"Anomaly '{anomaly.Title}' has been marked as {status}.",
                severity: "success",
                link: "/anomalies");
            }

            return SuccessWithLegacy(payload, new { message }, message);
        }

        // PATCH api/anomalies/{id}/duplicate-invoices/keep
        [HttpPatch("{id:long}/duplicate-invoices/keep")]
        public IActionResult KeepDuplicateInvoice(long id, [FromBody] KeepDuplicateInvoiceRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, error) = _svc.KeepDuplicateInvoice(id, userId, request);
            if (!success)
            {
                return BadRequest(new { message = error });
            }

            var payload = new { id, keepInvoiceId = request.KeepInvoiceId };

            var anomaly = _svc.GetById(id);
            if (anomaly != null)
            {
                _ = _realtime.NotifyCompanyEventAsync(anomaly.CompanyId, "anomaly.duplicate_invoice.decided", new
                {
                    anomalyId = id,
                    anomaly.CompanyId,
                    keepInvoiceId = request.KeepInvoiceId,
                    resolvedByUserId = userId
                });
            }

            return SuccessWithLegacy(payload, new { message = "Duplicate invoice decision saved." }, "Duplicate invoice decision saved.");
        }

        // DELETE api/anomalies/transaction-file-uploads/{uploadId}
        [HttpDelete("transaction-file-uploads/{uploadId:long}")]
        public IActionResult DeleteTransactionFileUpload(long uploadId)
        {
            var upload = _db.GetTransactionFileUploadById(uploadId);
            if (upload is null)
            {
                return NotFound(new { message = "Transaction file upload not found." });
            }

            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, upload.CompanyId))
            {
                return Forbid();
            }

            var ok = _db.DeleteTransactionFileUpload(uploadId);
            if (!ok)
            {
                return NotFound(new { message = "Transaction file upload not found." });
            }

            var fileDeleted = false;
            if (!string.IsNullOrWhiteSpace(upload.FilePath))
            {
                fileDeleted = _fileSvc.Delete(upload.FilePath);
            }

            return SuccessWithLegacy(
                new { uploadId, fileDeleted },
                new { message = "Duplicate transaction file removed.", uploadId, fileDeleted },
                "Duplicate transaction file removed.");
        }

    }
}
