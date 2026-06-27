using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IActivityLogService
    {
        void LogSystem(CreateSystemLogRequest request);
        void LogAudit(CreateAuditLogRequest request);
    }
}
