namespace FinalProjectAuthAPI.Models
{
    public sealed record NotificationDefinition(
        string EventType,
        IReadOnlySet<string> AllowedScopes,
        IReadOnlySet<string> AllowedTargets);

    public static class NotificationCatalog
    {
        private static readonly HashSet<string> Severities =
            new(StringComparer.OrdinalIgnoreCase) { "info", "success", "warning", "error" };

        private static readonly HashSet<string> TargetTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                NotificationTargetTypes.AccountantRequest,
                NotificationTargetTypes.Accountant,
                NotificationTargetTypes.Anomaly,
                NotificationTargetTypes.Invoice,
                NotificationTargetTypes.InvoiceUploadJob,
                NotificationTargetTypes.TransactionUploadJob,
                NotificationTargetTypes.Company,
                NotificationTargetTypes.Profile,
            };

        private static readonly IReadOnlyDictionary<string, NotificationDefinition> Definitions =
            new Dictionary<string, NotificationDefinition>(StringComparer.OrdinalIgnoreCase)
            {
                [NotificationEventTypes.AccountantRequestSent] = Definition(
                    NotificationEventTypes.AccountantRequestSent,
                    new[] { NotificationScopes.Personal },
                    new[] { NotificationTargetTypes.AccountantRequest }),
                [NotificationEventTypes.AccountantRequestAccepted] = Definition(
                    NotificationEventTypes.AccountantRequestAccepted,
                    new[] { NotificationScopes.Personal, NotificationScopes.Company },
                    new[] { NotificationTargetTypes.Accountant }),
                [NotificationEventTypes.AccountantRequestDeclined] = Definition(
                    NotificationEventTypes.AccountantRequestDeclined,
                    new[] { NotificationScopes.Personal, NotificationScopes.Company },
                    new[] { NotificationTargetTypes.Accountant }),
                [NotificationEventTypes.AccountantDisconnected] = Definition(
                    NotificationEventTypes.AccountantDisconnected,
                    new[] { NotificationScopes.Personal, NotificationScopes.Company },
                    new[] { NotificationTargetTypes.Accountant, NotificationTargetTypes.Company }),
                [NotificationEventTypes.AnomalyCreated] = Definition(
                    NotificationEventTypes.AnomalyCreated,
                    new[] { NotificationScopes.Company },
                    new[] { NotificationTargetTypes.Anomaly }),
                [NotificationEventTypes.AnomalyResolved] = Definition(
                    NotificationEventTypes.AnomalyResolved,
                    new[] { NotificationScopes.Company },
                    new[] { NotificationTargetTypes.Anomaly }),
                [NotificationEventTypes.AnomalyDuplicateDecided] = Definition(
                    NotificationEventTypes.AnomalyDuplicateDecided,
                    new[] { NotificationScopes.Company },
                    new[] { NotificationTargetTypes.Anomaly }),
                [NotificationEventTypes.AdminUserActiveToggled] = Definition(
                    NotificationEventTypes.AdminUserActiveToggled,
                    new[] { NotificationScopes.Personal },
                    new[] { NotificationTargetTypes.Profile }),
                [NotificationEventTypes.AdminUserBanned] = Definition(
                    NotificationEventTypes.AdminUserBanned,
                    new[] { NotificationScopes.Personal },
                    new[] { NotificationTargetTypes.Profile }),
                [NotificationEventTypes.AdminUserUnbanned] = Definition(
                    NotificationEventTypes.AdminUserUnbanned,
                    new[] { NotificationScopes.Personal },
                    new[] { NotificationTargetTypes.Profile }),
                [NotificationEventTypes.UploadCompleted] = Definition(
                    NotificationEventTypes.UploadCompleted,
                    new[] { NotificationScopes.Personal },
                    new[] { NotificationTargetTypes.Invoice, NotificationTargetTypes.InvoiceUploadJob, NotificationTargetTypes.TransactionUploadJob }),
                [NotificationEventTypes.UploadFailed] = Definition(
                    NotificationEventTypes.UploadFailed,
                    new[] { NotificationScopes.Personal },
                    new[] { NotificationTargetTypes.InvoiceUploadJob, NotificationTargetTypes.TransactionUploadJob }),
            };

        public static bool IsValidSeverity(string? severity) =>
            !string.IsNullOrWhiteSpace(severity) && Severities.Contains(severity);

        public static bool IsValidTargetType(string? targetType) =>
            string.IsNullOrWhiteSpace(targetType) || TargetTypes.Contains(targetType);

        public static string? BuildLink(string? targetType, string? targetId)
        {
            if (string.IsNullOrWhiteSpace(targetType))
                return null;

            var id = Uri.EscapeDataString(targetId ?? string.Empty);
            return targetType switch
            {
                NotificationTargetTypes.AccountantRequest => $"/accountant-workspace?requestId={id}",
                NotificationTargetTypes.Accountant => $"/find-accountant?accountantId={id}",
                NotificationTargetTypes.Anomaly => $"/anomalies?anomalyId={id}",
                NotificationTargetTypes.Invoice => $"/invoices?invoiceId={id}",
                NotificationTargetTypes.InvoiceUploadJob => $"/invoices?jobId={id}",
                NotificationTargetTypes.TransactionUploadJob => $"/transactions?jobId={id}",
                NotificationTargetTypes.Company => $"/accountant-workspace?companyId={id}",
                NotificationTargetTypes.Profile => "/profile",
                _ => null,
            };
        }

        public static void Validate(NotificationMessage message, string scope)
        {
            if (string.IsNullOrWhiteSpace(message.EventType))
                throw new ArgumentException("Notification event type is required.");
            if (string.IsNullOrWhiteSpace(message.Title))
                throw new ArgumentException("Notification title is required.");
            if (!IsValidSeverity(message.Severity))
                throw new ArgumentException("Notification severity is invalid.");
            if (!IsValidTargetType(message.TargetType))
                throw new ArgumentException("Notification target type is invalid.");
            if (!Definitions.TryGetValue(message.EventType, out var definition))
                throw new ArgumentException("Notification event type is not registered in the catalog.");
            if (!definition.AllowedScopes.Contains(scope))
                throw new ArgumentException("Notification scope is not allowed for this event type.");
            if (string.IsNullOrWhiteSpace(message.TargetType)
                || !definition.AllowedTargets.Contains(message.TargetType))
                throw new ArgumentException("Notification target is not allowed for this event type.");
        }

        private static NotificationDefinition Definition(
            string eventType,
            IEnumerable<string> scopes,
            IEnumerable<string> targets) => new(
                eventType,
                new HashSet<string>(scopes, StringComparer.OrdinalIgnoreCase),
                new HashSet<string>(targets, StringComparer.OrdinalIgnoreCase));
    }
}
