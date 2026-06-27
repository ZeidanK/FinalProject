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

        public ReconciliationReport GetReconciliationReport(
            long companyId,
            DateTime? startDate = null,
            DateTime? endDate = null) =>
            _db.GetReconciliationReport(companyId, startDate, endDate);

        public PayablesAgingReport GetPayablesAgingReport(
            long companyId,
            DateTime asOfDate) =>
            _db.GetPayablesAgingReport(companyId, asOfDate);
    }
}
