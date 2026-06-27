namespace FinalProjectAuthAPI.Models
{
    public class CreateSystemLogRequest
    {
        public string Level { get; set; } = "INFO";
        public string? Category { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Details { get; set; }
        public long? UserId { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }

    public class CreateAuditLogRequest
    {
        public long? UserId { get; set; }
        public long? CompanyId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public long? EntityId { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? IpAddress { get; set; }
    }
}
