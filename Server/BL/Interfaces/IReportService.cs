using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IReportService
    {
        DashboardStatsRow GetDashboardStats(long companyId);
        VatReportSummary GetVatReport(long companyId, DateTime? startDate = null, DateTime? endDate = null);
        List<ReconciliationRow> GetReconciliationReport(long companyId, DateTime? startDate = null, DateTime? endDate = null);
    }
}
