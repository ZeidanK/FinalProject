using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IAdminService
    {
        AdminStatsRow GetStats();
        PagedResult<AdminUserRow> GetUsers(int page = 1, int limit = 20, string? role = null, string? search = null);
        (long Id, bool IsActive) ToggleUserActive(long id);
        PagedResult<SystemLogRow> GetLogs(int page = 1, int limit = 50, string? level = null, string? category = null);
        PagedResult<AuditLogRow> GetAuditLogs(int page = 1, int limit = 50, long? companyId = null);
        int ClearSystemLogs();
        int ClearAuditLogs();
        bool DeleteSystemLog(long id);
        bool DeleteAuditLog(long id);
    }
}
