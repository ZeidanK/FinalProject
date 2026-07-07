using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class ActivityLogService : IActivityLogService
    {
        private static readonly HashSet<string> ValidLevels = new(StringComparer.OrdinalIgnoreCase)
        {
            "DEBUG",
            "INFO",
            "WARN",
            "ERROR"
        };

        private readonly IDBservices _db;
        private readonly ILogger<ActivityLogService> _logger;

        public ActivityLogService(IDBservices db, ILogger<ActivityLogService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public void LogSystem(CreateSystemLogRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return;

            request.Level = NormalizeLevel(request.Level);
            request.Category = TrimToNull(request.Category, 100);
            request.IpAddress = TrimToNull(request.IpAddress, 50);
            request.UserAgent = TrimToNull(request.UserAgent, 500);

            TryWrite(() => _db.InsertSystemLog(request), "system");
        }

        public void LogAudit(CreateAuditLogRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Action))
                return;

            request.Action = TrimToNull(request.Action, 100) ?? "unknown";
            request.EntityType = TrimToNull(request.EntityType, 100);
            request.IpAddress = TrimToNull(request.IpAddress, 50);

            TryWrite(() => _db.InsertAuditLog(request), "audit");
        }

        private void TryWrite(Action write, string logType)
        {
            try
            {
                write();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to write {LogType} log entry.", logType);
            }
        }

        private static string NormalizeLevel(string? level)
        {
            var normalized = string.IsNullOrWhiteSpace(level) ? "INFO" : level.Trim().ToUpperInvariant();
            return ValidLevels.Contains(normalized) ? normalized : "INFO";
        }

        private static string? TrimToNull(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var trimmed = value.Trim();
            return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
        }
    }
}
