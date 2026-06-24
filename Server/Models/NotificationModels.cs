namespace FinalProjectAuthAPI.Models
{
    public class NotificationRow
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public bool IsRead { get; set; }
        public long? CompanyId { get; set; }
        public string? Link { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    public class CreateNotificationRequest
    {
        public long UserId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public long? CompanyId { get; set; }
        public string? Link { get; set; }
    }
}
