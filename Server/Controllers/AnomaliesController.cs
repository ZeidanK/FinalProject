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
        private readonly IDBservices _db;
        private readonly IFileStorageService _fileSvc;
        private readonly IRealtimeNotificationService _realtime;

        public AnomaliesController(IAnomalyService svc, IDBservices db, IFileStorageService fileSvc, IRealtimeNotificationService realtime)
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
            if (!CanAccessCompany(companyId, _db))
                return Forbid();

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
            if (anomaly is null)
                return NotFound(new { message = "Anomaly not found." });
            if (!CanAccessCompany(anomaly.CompanyId, _db))
                return Forbid();
            return SuccessWithLegacy(anomaly, anomaly, "Anomaly retrieved.");
        }

        // GET api/anomalies/stats/{companyId}
        [HttpGet("stats/{companyId:long}")]
        public IActionResult GetStats(long companyId)
        {
            if (!CanAccessCompany(companyId, _db))
                return Forbid();

            var data = _svc.GetStats(companyId);
            return SuccessWithLegacy(data, data, "Anomaly stats retrieved.");
        }

        // POST api/anomalies
        [HttpPost]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] CreateAnomalyRequest request)
        {
            if (!CanAccessCompany(request.CompanyId, _db))
                return Forbid();

            var (success, id, error) = _svc.Create(request);

            if (success)
            {
                var payload = new
                {
                    anomalyId = id,
                    request.CompanyId,
                    request.AnomalyType,
                    request.Severity,
                    request.Title
                };
                await _realtime.CreateCompanyNotificationAsync(request.CompanyId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AnomalyCreated,
                    Title = $"Anomaly detected: {request.Title}",
                    Body = request.Description ?? string.Empty,
                    Severity = request.Severity == "critical" || request.Severity == "high" ? "error" : "warning",
                    TargetType = NotificationTargetTypes.Anomaly,
                    TargetId = id.ToString(),
                    DedupeKey = $"anomaly:{id}:created",
                }, payload);
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
        public async Task<IActionResult> Resolve(long id, [FromBody] ResolveAnomalyRequest request)
        {
            var anomaly = _svc.GetById(id);
            if (anomaly is null)
                return NotFound(new { message = "Anomaly not found." });
            if (!CanAccessCompany(anomaly.CompanyId, _db))
                return Forbid();

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

            if (anomaly != null)
            {
                var notificationPayload = new
                {
                    anomalyId = id,
                    anomaly.CompanyId,
                    status,
                    resolvedByUserId = userId,
                    request.ResolutionNotes
                };
                await _realtime.CreateCompanyNotificationAsync(anomaly.CompanyId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AnomalyResolved,
                    Title = status == "open" ? "Anomaly reopened" : "Anomaly resolved",
                    Body = $"Anomaly '{anomaly.Title}' has been marked as {status}.",
                    Severity = status == "open" ? "warning" : "success",
                    TargetType = NotificationTargetTypes.Anomaly,
                    TargetId = id.ToString(),
                    DedupeKey = $"anomaly:{id}:status:{status}:{DateTime.UtcNow.Ticks}",
                }, notificationPayload);
            }

            return SuccessWithLegacy(payload, new { message }, message);
        }

        // PATCH api/anomalies/{id}/duplicate-invoices/keep
        [HttpPatch("{id:long}/duplicate-invoices/keep")]
        public async Task<IActionResult> KeepDuplicateInvoice(long id, [FromBody] KeepDuplicateInvoiceRequest request)
        {
            var anomaly = _svc.GetById(id);
            if (anomaly is null)
                return NotFound(new { message = "Anomaly not found." });
            if (!CanAccessCompany(anomaly.CompanyId, _db))
                return Forbid();

            var userId = GetCurrentUserId();
            var (success, error) = _svc.KeepDuplicateInvoice(id, userId, request);
            if (!success)
            {
                return BadRequest(new { message = error });
            }

            var payload = new { id, keepInvoiceId = request.KeepInvoiceId };

            if (anomaly != null)
            {
                var notificationPayload = new
                {
                    anomalyId = id,
                    anomaly.CompanyId,
                    keepInvoiceId = request.KeepInvoiceId,
                    resolvedByUserId = userId
                };
                await _realtime.CreateCompanyNotificationAsync(anomaly.CompanyId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AnomalyDuplicateDecided,
                    Title = "Duplicate invoice decision saved",
                    Body = $"A duplicate invoice decision was saved for '{anomaly.Title}'.",
                    Severity = "info",
                    TargetType = NotificationTargetTypes.Anomaly,
                    TargetId = id.ToString(),
                    DedupeKey = $"anomaly:{id}:duplicate-decision:{request.KeepInvoiceId}",
                }, notificationPayload);
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
