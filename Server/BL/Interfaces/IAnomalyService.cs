using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IAnomalyService
    {
        List<AnomalyRow> GetByCompany(long companyId, string? status = null, string? severity = null, string? type = null);
        AnomalyRow? GetById(long id);
        AnomalyStatsRow GetStats(long companyId);
        (bool Success, long Id, string Error) Create(CreateAnomalyRequest req);
        (bool Success, string Error) Resolve(long id, long resolvedByUserId, ResolveAnomalyRequest req);
    }
}
