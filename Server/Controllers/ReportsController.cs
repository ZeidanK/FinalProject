using FinalProjectAuthAPI.BL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _svc;

        public ReportsController(IReportService svc)
        {
            _svc = svc;
        }

        // GET api/reports/dashboard/{companyId}
        [HttpGet("dashboard/{companyId:long}")]
        public IActionResult GetDashboard(long companyId) =>
            Ok(_svc.GetDashboardStats(companyId));

        // GET api/reports/vat/{companyId}?startDate=&endDate=
        [HttpGet("vat/{companyId:long}")]
        public IActionResult GetVatReport(
            long companyId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate) =>
            Ok(_svc.GetVatReport(companyId, startDate, endDate));

        // GET api/reports/reconciliation/{companyId}?startDate=&endDate=
        [HttpGet("reconciliation/{companyId:long}")]
        public IActionResult GetReconciliation(
            long companyId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate) =>
            Ok(_svc.GetReconciliationReport(companyId, startDate, endDate));
    }
}
