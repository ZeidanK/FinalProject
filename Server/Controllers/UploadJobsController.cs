using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UploadJobsController : ApiControllerBase
    {
        private readonly IUploadJobService _jobSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly IInvoiceVerificationService _invoiceVerificationSvc;
        private readonly IDBservices _db;
        private readonly IWebHostEnvironment _env;

        public UploadJobsController(
            IUploadJobService jobSvc,
            IFileStorageService fileSvc,
            IInvoiceVerificationService invoiceVerificationSvc,
            IDBservices db,
            IWebHostEnvironment env)
        {
            _jobSvc = jobSvc;
            _fileSvc = fileSvc;
            _invoiceVerificationSvc = invoiceVerificationSvc;
            _db = db;
            _env = env;
        }

        [HttpGet("{jobId:long}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UploadJobRow))]
        public IActionResult GetById(long jobId)
        {
            var userId = GetCurrentUserId();
            var row = _jobSvc.GetById(jobId);
            if (row == null)
                return NotFound(new { message = "Job not found." });

            if (row.UserId != userId && !_db.UserHasActiveCompanyAccess(userId, row.CompanyId))
                return Forbid();

            return Ok(row);
        }

        [HttpGet("mine")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<UploadJobRow>))]
        public IActionResult GetMine(
            [FromQuery] long? companyId = null,
            [FromQuery] string? status = null,
            [FromQuery] int take = 50)
        {
            var userId = GetCurrentUserId();

            if (companyId.HasValue && !_db.UserHasActiveCompanyAccess(userId, companyId.Value))
                return Forbid();

            var jobs = _jobSvc.GetByUser(userId, companyId, status, take);
            return Ok(jobs);
        }

        [HttpPatch("{jobId:long}/verified")]
        public async Task<IActionResult> MarkVerified(long jobId)
        {
            var result = await _invoiceVerificationSvc.VerifyJobAsync(jobId, GetCurrentUserId());
            return result.IsSuccessful ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{jobId:long}/verify-invoice")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(InvoiceJobVerificationResult))]
        public async Task<IActionResult> VerifyInvoice(
            long jobId,
            [FromBody] CreateInvoiceRequest request)
        {
            var result = await _invoiceVerificationSvc.VerifyJobAsync(
                jobId,
                GetCurrentUserId(),
                request);

            return result.Outcome switch
            {
                InvoiceJobVerificationOutcomes.Unavailable => NotFound(result),
                InvoiceJobVerificationOutcomes.RequiresReview => BadRequest(result),
                InvoiceJobVerificationOutcomes.Failed => BadRequest(result),
                _ => Ok(result)
            };
        }

        [HttpPost("verify-invoices")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(BulkInvoiceJobVerificationResponse))]
        public async Task<IActionResult> VerifyInvoices(
            [FromBody] VerifyInvoiceUploadJobsRequest request)
        {
            var result = await _invoiceVerificationSvc.VerifyJobsAsync(
                request.JobIds,
                GetCurrentUserId());
            return Ok(result);
        }

        [HttpDelete("{jobId:long}")]
        public IActionResult Delete(long jobId)
        {
            var userId = GetCurrentUserId();
            var row = _jobSvc.GetById(jobId);
            if (row == null)
                return NotFound(new { message = "Job not found." });

            if (row.UserId != userId && !_db.UserHasActiveCompanyAccess(userId, row.CompanyId))
                return Forbid();

            if (string.Equals(row.Status, UploadJobStatuses.Verified, StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = "Verified upload jobs cannot be deleted because their files belong to invoice records." });

            if (!string.IsNullOrWhiteSpace(row.FilePath))
            {
                try
                {
                    _fileSvc.Delete(row.FilePath);
                }
                catch
                {
                    // Swallow file deletion errors so DB cleanup can still proceed.
                }
            }

            var deleted = _jobSvc.Delete(jobId);
            return deleted
                ? Ok(new { message = "Upload job deleted." })
                : NotFound(new { message = "Job not found." });
        }

        [HttpDelete("company/{companyId:long}")]
        public IActionResult DeleteByCompany(long companyId, [FromQuery] string? jobType = null)
        {
            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                return Forbid();

            var deleted = _jobSvc.DeleteByCompany(companyId, jobType);
            return Ok(new { deletedCount = deleted, message = "Upload jobs deleted." });
        }

        [HttpGet("{jobId:long}/download")]
        public IActionResult Download(long jobId)
        {
            var userId = GetCurrentUserId();
            var row = _jobSvc.GetById(jobId);
            if (row == null)
                return NotFound(new { message = "Job not found." });

            if (row.UserId != userId && !_db.UserHasActiveCompanyAccess(userId, row.CompanyId))
                return Forbid();

            if (string.IsNullOrWhiteSpace(row.FilePath))
                return NotFound(new { message = "No saved file was found for this job." });

            var normalizedRelativePath = row.FilePath
                .Replace('\\', '/')
                .TrimStart('/');

            if (normalizedRelativePath.Contains("..") || !normalizedRelativePath.StartsWith("uploads/invoices/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Invalid file path." });

            var expectedCompanyPrefix = $"uploads/invoices/{row.CompanyId}/";
            if (!normalizedRelativePath.StartsWith(expectedCompanyPrefix, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Upload job file path does not match the job company." });

            string fullPath;
            try
            {
                fullPath = _fileSvc.GetInvoiceFullPath(normalizedRelativePath);
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { message = "Upload job file could not be found on disk." });
            }

            if (!System.IO.File.Exists(fullPath))
                return NotFound(new { message = "Upload job file could not be found on disk." });

            var contentType = string.IsNullOrWhiteSpace(row.FileType) ? "application/pdf" : row.FileType;
            var fileName = string.IsNullOrWhiteSpace(row.FileOriginalName)
                ? Path.GetFileName(fullPath)
                : row.FileOriginalName;

            return PhysicalFile(fullPath, contentType, fileName);
        }
    }
}
