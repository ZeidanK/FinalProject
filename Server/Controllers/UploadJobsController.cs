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
        private readonly DBservices _db;
        private readonly IWebHostEnvironment _env;

        public UploadJobsController(IUploadJobService jobSvc, DBservices db, IWebHostEnvironment env)
        {
            _jobSvc = jobSvc;
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
        public IActionResult MarkVerified(long jobId)
        {
            var userId = GetCurrentUserId();
            var row = _jobSvc.GetById(jobId);
            if (row == null)
                return NotFound(new { message = "Job not found." });

            if (row.UserId != userId && !_db.UserHasActiveCompanyAccess(userId, row.CompanyId))
                return Forbid();

            _jobSvc.MarkVerified(jobId);
            return Ok(new { message = "Job marked as verified." });
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

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(webRoot, normalizedRelativePath.Replace('/', Path.DirectorySeparatorChar));

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
