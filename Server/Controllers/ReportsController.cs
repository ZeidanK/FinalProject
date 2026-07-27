using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ApiControllerBase
    {
        private readonly IReportService _svc;
        private readonly IDBservices _db;

        public ReportsController(IReportService svc, IDBservices db)
        {
            _svc = svc;
            _db = db;
        }

        // GET api/reports/dashboard/{companyId}
        [HttpGet("dashboard/{companyId:long}")]
        public IActionResult GetDashboard(long companyId)
        {
            if (!CanAccessCompany(companyId))
                return Forbid();

            return Ok(_svc.GetDashboardStats(companyId));
        }

        // GET api/reports/reconciliation/{companyId}?startDate=&endDate=
        [HttpGet("reconciliation/{companyId:long}")]
        public IActionResult GetReconciliation(
            long companyId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            if (!CanAccessCompany(companyId))
                return Forbid();

            if (startDate.HasValue && endDate.HasValue && startDate.Value.Date > endDate.Value.Date)
                return BadRequest(new { message = "startDate must be on or before endDate." });

            return Ok(_svc.GetReconciliationReport(companyId, startDate?.Date, endDate?.Date));
        }

        // GET api/reports/aging/{companyId}?asOfDate=
        [HttpGet("aging/{companyId:long}")]
        public IActionResult GetPayablesAging(
            long companyId,
            [FromQuery] DateTime? asOfDate)
        {
            if (!CanAccessCompany(companyId))
                return Forbid();

            var effectiveAsOfDate = (asOfDate ?? DateTime.UtcNow).Date;
            return Ok(_svc.GetPayablesAgingReport(companyId, effectiveAsOfDate));
        }

        private bool CanAccessCompany(long companyId) =>
            _db.UserHasActiveCompanyAccess(GetCurrentUserId(), companyId);
    }
}
