namespace FinalProjectAuthAPI.Models
{
    public static class NotificationScopes
    {
        public const string Personal = "personal";
        public const string Company = "company";
    }

    public static class NotificationViews
    {
        public const string Personal = "personal";
        public const string Company = "company";
        public const string Combined = "combined";
    }

    public static class NotificationTargetTypes
    {
        public const string AccountantRequest = "accountant_request";
        public const string Accountant = "accountant";
        public const string Anomaly = "anomaly";
        public const string Invoice = "invoice";
        public const string InvoiceUploadJob = "invoice_upload_job";
        public const string TransactionUploadJob = "transaction_upload_job";
        public const string Company = "company";
        public const string Profile = "profile";
    }

    public static class NotificationEventTypes
    {
        public const string AccountantRequestSent = "accountant.request.sent";
        public const string AccountantRequestAccepted = "accountant.request.accepted";
        public const string AccountantRequestDeclined = "accountant.request.declined";
        public const string AccountantDisconnected = "accountant.connection.disconnected";
        public const string AnomalyCreated = "anomaly.created";
        public const string AnomalyResolved = "anomaly.resolved";
        public const string AnomalyDuplicateDecided = "anomaly.duplicate_invoice.decided";
        public const string AdminUserActiveToggled = "admin.user.active_toggled";
        public const string UploadCompleted = "uploadjob.completed";
        public const string UploadFailed = "uploadjob.failed";
    }

    public class NotificationRow
    {
        public long Id { get; set; }
        public Guid EventId { get; set; }
        public long UserId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string Scope { get; set; } = NotificationScopes.Personal;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public bool IsRead { get; set; }
        public long? CompanyId { get; set; }
        public long? TargetCompanyId => CompanyId;
        public string? CompanyName { get; set; }
        public string? Link { get; set; }
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    public class CreateNotificationRequest
    {
        public long UserId { get; set; }
        public Guid EventId { get; set; } = Guid.NewGuid();
        public string EventType { get; set; } = string.Empty;
        public string Scope { get; set; } = NotificationScopes.Personal;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public long? CompanyId { get; set; }
        public string? Link { get; set; }
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public string? DedupeKey { get; set; }
    }

    public class NotificationMessage
    {
        public string EventType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public string? DedupeKey { get; set; }
    }

    public class NotificationUnreadCounts
    {
        public int PersonalUnread { get; set; }
        public int CompanyUnread { get; set; }
        public int VisibleUnread { get; set; }
    }

    public class NotificationInboxResult
    {
        public List<NotificationRow> Items { get; set; } = new();
        public string? NextCursor { get; set; }
        public NotificationUnreadCounts Counts { get; set; } = new();
    }

    public class NotificationInboxDbResult
    {
        public List<NotificationRow> Items { get; set; } = new();
        public NotificationUnreadCounts Counts { get; set; } = new();
    }
}
