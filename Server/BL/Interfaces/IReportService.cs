using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IReportService
    {
        DashboardStatsRow GetDashboardStats(long companyId);
        ReconciliationReport GetReconciliationReport(long companyId, DateTime? startDate = null, DateTime? endDate = null);
        PayablesAgingReport GetPayablesAgingReport(long companyId, DateTime asOfDate);
    }
}
