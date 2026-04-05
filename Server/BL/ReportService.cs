using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for reports and dashboard stats.
    /// </summary>
    public class ReportService : IReportService
    {
        private readonly DBservices _db;

        public ReportService(DBservices db)
        {
            _db = db;
        }

        public DashboardStatsRow GetDashboardStats(long companyId) =>
            _db.GetDashboardStats(companyId);

        public VatReportSummary GetVatReport(
            long companyId,
            DateTime? startDate = null,
            DateTime? endDate = null) =>
            _db.GetVatReport(companyId, startDate, endDate);

        public List<ReconciliationRow> GetReconciliationReport(
            long companyId,
            DateTime? startDate = null,
            DateTime? endDate = null) =>
            _db.GetReconciliationReport(companyId, startDate, endDate);
    }
}
