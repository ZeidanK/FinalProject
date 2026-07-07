using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoicesController : ApiControllerBase
    {
        private readonly IInvoiceService _svc;
        private readonly IFileStorageService _fileSvc;
        private readonly IUploadJobService _jobSvc;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IDBservices _db;
        private readonly IWebHostEnvironment _env;
        private readonly IAnomalyService _anomalySvc;
        private readonly IRealtimeNotificationService _realtime;

        public InvoicesController(
            IInvoiceService svc,
            IFileStorageService fileSvc,
            IUploadJobService jobSvc,
            IBackgroundJobClient backgroundJobClient,
            IDBservices db,
            IWebHostEnvironment env,
            IAnomalyService anomalySvc,
            IRealtimeNotificationService realtime)
        {
            _svc = svc;
            _fileSvc = fileSvc;
            _jobSvc = jobSvc;
            _backgroundJobClient = backgroundJobClient;
            _db = db;
            _env = env;
            _anomalySvc = anomalySvc;
            _realtime = realtime;
        }

        // GET api/invoices/company/{companyId}?status=&startDate=&endDate=&isMatched=
        [HttpGet("company/{companyId:long}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<InvoiceRow>))]
        public IActionResult GetByCompany(
            long companyId,
            [FromQuery] string? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] bool? isMatched) =>
            Ok(_svc.GetByCompany(companyId, status, startDate, endDate, isMatched));

        // GET api/invoices/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var invoice = _svc.GetById(id);
            return invoice is null ? NotFound(new { message = "Invoice not found." }) : Ok(invoice);
        }

        // POST api/invoices
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request, [FromQuery] bool autoMatch = false)
        {
            var userId = GetCurrentUserId();
            var (success, id, error, isDuplicate) = _svc.Create(
                request,
                userId,
                request.FileOriginalName,
                request.FilePath,
                request.FileType,
                request.FileSize,
                request.AiExtractionConfidence);

            if (!success)
                return BadRequest(new { message = error });

            if (!_svc.MarkVerified(id, userId))
                return BadRequest(new { message = "Invoice was created but could not be marked as verified." });

            // Duplicate invoice — saved and flagged; skip auto-match for duplicates
            if (isDuplicate)
            {
                var anomaly = _anomalySvc
                    .GetByCompany(request.CompanyId, status: "open", severity: null, type: "duplicate")
                    .FirstOrDefault(row => row.RelatedInvoiceId == id
                        || row.RelatedItems.Any(item => item.EntityId == id));
                if (anomaly != null)
                {
                    await _realtime.CreateCompanyNotificationAsync(request.CompanyId, new NotificationMessage
                    {
                        EventType = NotificationEventTypes.AnomalyCreated,
                        Title = "Duplicate invoice detected",
                        Body = anomaly.Description ?? "A duplicate invoice requires review.",
                        Severity = "warning",
                        TargetType = NotificationTargetTypes.Anomaly,
                        TargetId = anomaly.Id.ToString(),
                        DedupeKey = $"anomaly:{anomaly.Id}:created",
                    }, new { anomalyId = anomaly.Id, companyId = request.CompanyId, invoiceId = id });
                }

                return CreatedAtAction(nameof(GetById), new { id }, new
                {
                    id,
                    message = "Invoice already exists and has been saved as a duplicate. It has been flagged in Anomalies.",
                    isDuplicate = true
                });
            }

            // Optionally attempt automatic matching
            if (autoMatch)
            {
                var matchResult = await _svc.AutoMatchAfterCreateAsync(id, userId, 70m);
                return CreatedAtAction(nameof(GetById), new { id }, new { 
                    id, 
                    message = "Invoice created.",
                    isDuplicate = false,
                    autoMatchResult = new {
                        matched = matchResult.Success,
                        matchId = matchResult.MatchId,
                        matchScore = matchResult.MatchScore,
                        matchMessage = matchResult.Message
                    }
                });
            }

            return CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Invoice created.", isDuplicate = false });
        }

        // PUT api/invoices/{id}
        [HttpPut("{id:long}")]
        public IActionResult Update(long id, [FromBody] CreateInvoiceRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, error, notFound) = _svc.Update(id, request, userId);

            if (success)
                return Ok(new { message = "Invoice updated." });

            if (notFound)
                return NotFound(new { message = error });

            return BadRequest(new { message = error });
        }

        // PATCH api/invoices/{id}/status
        [HttpPatch("{id:long}/status")]
        public IActionResult UpdateStatus(long id, [FromBody] UpdateInvoiceStatusRequest request)
        {
            var ok = _svc.UpdateStatus(id, request.Status);
            return ok ? Ok(new { message = "Invoice status updated." }) : BadRequest(new { message = "Invalid status or invoice not found." });
        }

        // DELETE api/invoices/{id}
        [HttpDelete("{id:long}")]
        public IActionResult Delete(long id)
        {
            var invoice = _svc.GetById(id);

            if (invoice is null)
                return NotFound(new { message = "Invoice not found." });

            if (!string.IsNullOrWhiteSpace(invoice.FilePath))
            {
                try
                {
                    _fileSvc.Delete(invoice.FilePath);
                }
                catch
                {
                    // Swallow file deletion errors so the DB operation can still complete.
                }
            }

            var ok = _svc.Delete(id);
            return ok
                ? Ok(new { message = "Invoice deleted." })
                : NotFound(new { message = "Invoice not found." });
        }

        // DELETE api/invoices/bulk
        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteInvoicesRequest request)
        {
            if (request?.Ids == null || request.Ids.Count == 0)
                return BadRequest(new { message = "At least one invoice ID is required." });

            var filesToDelete = new List<string>();
            foreach (var id in request.Ids)
            {
                var invoice = _svc.GetById(id);
                if (invoice != null && !string.IsNullOrWhiteSpace(invoice.FilePath))
                    filesToDelete.Add(invoice.FilePath);
            }

            foreach (var path in filesToDelete)
            {
                try
                {
                    await Task.Run(() => _fileSvc.Delete(path));
                }
                catch
                {
                    // Swallow file deletion errors so the DB operation can still complete.
                }
            }

            var (deletedIds, notFoundIds) = _svc.BulkDelete(request.Ids);
            var deletedCount = deletedIds.Count;
            var notFoundCount = notFoundIds.Count;

            return Ok(new
            {
                deletedCount,
                notFoundCount,
                deletedIds,
                notFoundIds,
                message = notFoundCount == 0
                    ? "Invoices deleted."
                    : "Bulk delete completed with partial success."
            });
        }

        // GET api/invoices/{id}/download
        // Returns the stored invoice file content for viewing/downloading.
        [HttpGet("{id:long}/download")]
        public IActionResult Download(long id)
        {
            var invoice = _svc.GetById(id);
            if (invoice is null)
                return NotFound(new { message = "Invoice not found." });

            if (string.IsNullOrWhiteSpace(invoice.FilePath))
                return NotFound(new { message = "No saved file was found for this invoice." });

            var normalizedRelativePath = invoice.FilePath
                .Replace('\\', '/')
                .TrimStart('/');

            if (normalizedRelativePath.Contains("..") || !normalizedRelativePath.StartsWith("uploads/invoices/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Invalid file path." });

            var expectedCompanyPrefix = $"uploads/invoices/{invoice.CompanyId}/";
            if (!normalizedRelativePath.StartsWith(expectedCompanyPrefix, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Invoice file path does not match the invoice company." });

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(webRoot, normalizedRelativePath.Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(fullPath))
                return NotFound(new { message = "Invoice file could not be found on disk." });

            var contentType = string.IsNullOrWhiteSpace(invoice.FileType) ? "application/pdf" : invoice.FileType;
            var fileName = string.IsNullOrWhiteSpace(invoice.FileOriginalName)
                ? Path.GetFileName(fullPath)
                : invoice.FileOriginalName;

            return PhysicalFile(fullPath, contentType, fileName);
        }

        // POST api/invoices/upload-pdf
        // Uploads a PDF, saves the file, extracts data, and returns extracted fields for review.
        [HttpPost("upload-pdf")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadPdf(
            IFormFile file,
            [FromForm] long companyId,
            [FromForm] bool autoVerify = false)
        {
            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                return Forbid();

            try
            {
                var (relativePath, _) = await _fileSvc.SaveAsync(file, companyId);

                var jobId = _jobSvc.Create(new CreateUploadJobRequest
                {
                    JobType = UploadJobTypes.InvoiceUploadPdf,
                    FilePath = relativePath,
                    FileOriginalName = file.FileName,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    CompanyId = companyId,
                    UserId = userId,
                    PayloadJson = JsonSerializer.Serialize(new UploadJobPayload
                    {
                        AutoVerify = autoVerify
                    }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
                });

                var hangfireJobId = _backgroundJobClient.Enqueue<IUploadJobWorker>(
                    w => w.ProcessInvoiceJobAsync(
                        jobId,
                        relativePath,
                        file.FileName,
                        file.ContentType,
                        file.Length,
                        companyId,
                        userId,
                        UploadJobTypes.InvoiceUploadPdf));
                _jobSvc.SetHangfireJobId(jobId, hangfireJobId);

                return Accepted(new QueueUploadJobResponse
                {
                    JobId = jobId,
                    Status = UploadJobStatuses.Queued,
                    HangfireJobId = hangfireJobId,
                    Message = "Invoice PDF accepted and queued for background processing."
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to queue invoice upload: {ex.Message}" });
            }
        }

        // POST api/invoices/upload-and-create
        // Uploads a PDF, extracts data, and creates the invoice record in one step.
        [HttpPost("upload-and-create")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadAndCreate(IFormFile file, [FromForm] long companyId)
        {
            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                return Forbid();

            try
            {
                var (relativePath, _) = await _fileSvc.SaveAsync(file, companyId);

                var jobId = _jobSvc.Create(new CreateUploadJobRequest
                {
                    JobType = UploadJobTypes.InvoiceUploadAndCreate,
                    FilePath = relativePath,
                    FileOriginalName = file.FileName,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    CompanyId = companyId,
                    UserId = userId,
                    PayloadJson = null
                });

                var hangfireJobId = _backgroundJobClient.Enqueue<IUploadJobWorker>(
                    w => w.ProcessInvoiceJobAsync(
                        jobId,
                        relativePath,
                        file.FileName,
                        file.ContentType,
                        file.Length,
                        companyId,
                        userId,
                        UploadJobTypes.InvoiceUploadAndCreate));
                _jobSvc.SetHangfireJobId(jobId, hangfireJobId);

                return Accepted(new QueueUploadJobResponse
                {
                    JobId = jobId,
                    Status = UploadJobStatuses.Queued,
                    HangfireJobId = hangfireJobId,
                    Message = "Invoice upload accepted and queued for background creation."
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to queue invoice upload: {ex.Message}" });
            }
        }

    }
}
