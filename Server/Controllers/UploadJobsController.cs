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
    public class UploadJobsController : ApiControllerBase
    {
        private readonly IUploadJobService _jobSvc;
        private readonly DBservices _db;

        public UploadJobsController(IUploadJobService jobSvc, DBservices db)
        {
            _jobSvc = jobSvc;
            _db = db;
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
    }
}
