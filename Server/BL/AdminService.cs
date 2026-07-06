using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for admin operations (stats, user management, logs).
    /// </summary>
    public class AdminService : IAdminService
    {
        private readonly DBservices _db;

        public AdminService(DBservices db)
        {
            _db = db;
        }

        public AdminStatsRow GetStats() => _db.GetAdminStats();

        public PagedResult<AdminUserRow> GetUsers(
            int page = 1, int limit = 20,
            string? role = null, string? search = null)
        {
            if (page < 1)  page  = 1;
            if (limit < 1) limit = 1;
            if (limit > 100) limit = 100;

            return _db.GetAdminUsers(page, limit, role, search);
        }

        public (long Id, bool IsBanned) ToggleUserBan(long id) =>
            _db.ToggleUserBan(id);

        public PagedResult<SystemLogRow> GetLogs(
            int page = 1, int limit = 50,
            string? level = null, string? category = null)
        {
            if (page < 1)  page  = 1;
            if (limit < 1) limit = 1;
            if (limit > 200) limit = 200;

            return _db.GetSystemLogs(page, limit, level, category);
        }

        public PagedResult<AuditLogRow> GetAuditLogs(
            int page = 1, int limit = 50, long? companyId = null)
        {
            if (page < 1)  page  = 1;
            if (limit < 1) limit = 1;
            if (limit > 200) limit = 200;

            return _db.GetAuditLogs(page, limit, companyId);
        }

        public int ClearSystemLogs() => _db.ClearSystemLogs();

        public int ClearAuditLogs() => _db.ClearAuditLogs();

        public bool DeleteSystemLog(long id) => id > 0 && _db.DeleteSystemLog(id);

        public bool DeleteAuditLog(long id) => id > 0 && _db.DeleteAuditLog(id);
    }
}
