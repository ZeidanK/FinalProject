using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.UploadProcessing
{
    public class UploadJobNotificationService
    {
        private readonly IRealtimeNotificationService _realtime;
        private readonly IActivityLogService _activityLog;

        public UploadJobNotificationService(
            IRealtimeNotificationService realtime,
            IActivityLogService activityLog)
        {
            _realtime = realtime;
            _activityLog = activityLog;
        }

        public async Task NotifyUploadJobUpdatedAsync(IUploadJobService jobSvc, long jobId)
        {
            var updated = jobSvc.GetById(jobId);
            if (updated == null)
                return;

            await _realtime.NotifyUploadJobUpdatedAsync(updated);

            var status = updated.Status?.ToLowerInvariant();
            if (status == UploadJobStatuses.Completed || status == UploadJobStatuses.Failed)
            {
                var isCompleted = status == UploadJobStatuses.Completed;
                var fileName = updated.FileOriginalName ?? "file";
                var isInvoiceJob = updated.JobType == UploadJobTypes.InvoiceUploadPdf
                    || updated.JobType == UploadJobTypes.InvoiceUploadAndCreate;
                var invoiceId = isInvoiceJob ? TryGetInvoiceId(updated.ResultJson) : null;
                await _realtime.CreateUserNotificationAsync(updated.UserId, new NotificationMessage
                {
                    EventType = isCompleted ? NotificationEventTypes.UploadCompleted : NotificationEventTypes.UploadFailed,
                    Title = isCompleted ? "Upload complete" : "Upload failed",
                    Body = isCompleted
                        ? $"'{fileName}' was processed successfully."
                        : $"'{fileName}' could not be processed. Please review the upload and try again.",
                    Severity = isCompleted ? "success" : "error",
                    TargetType = invoiceId.HasValue
                        ? NotificationTargetTypes.Invoice
                        : isInvoiceJob
                            ? NotificationTargetTypes.InvoiceUploadJob
                            : NotificationTargetTypes.TransactionUploadJob,
                    TargetId = invoiceId?.ToString() ?? updated.Id.ToString(),
                    DedupeKey = $"upload-job:{updated.Id}:{status}",
                }, new { updated.Id, updated.Status }, updated.CompanyId);
            }
        }

        public async Task NotifyDuplicateInvoiceAnomalyAsync(IAnomalyService anomalySvc, long companyId, long invoiceId)
        {
            var anomaly = anomalySvc
                .GetByCompany(companyId, status: "open", severity: null, type: "duplicate")
                .FirstOrDefault(row => row.RelatedInvoiceId == invoiceId
                    || row.RelatedItems.Any(item => item.EntityId == invoiceId));
            if (anomaly == null)
                return;

            await _realtime.CreateCompanyNotificationAsync(companyId, new NotificationMessage
            {
                EventType = NotificationEventTypes.AnomalyCreated,
                Title = "Duplicate invoice detected",
                Body = anomaly.Description ?? "A duplicate invoice requires review.",
                Severity = "warning",
                TargetType = NotificationTargetTypes.Anomaly,
                TargetId = anomaly.Id.ToString(),
                DedupeKey = $"anomaly:{anomaly.Id}:created",
            }, new { anomalyId = anomaly.Id, companyId, invoiceId });
        }

        public void LogUploadJobFailure(UploadJobRow job, string message, string? error, string level = "WARN")
        {
            var camelCase = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            _activityLog.LogSystem(new CreateSystemLogRequest
            {
                Level = level,
                Category = "jobs",
                Message = message,
                Details = JsonSerializer.Serialize(new
                {
                    job.Id,
                    job.JobType,
                    job.CompanyId,
                    job.UserId,
                    job.FileOriginalName,
                    error
                }, camelCase),
                UserId = job.UserId
            });
        }

        public static long? TryGetInvoiceId(string? resultJson)
        {
            if (string.IsNullOrWhiteSpace(resultJson))
                return null;
            try
            {
                using var document = JsonDocument.Parse(resultJson);
                if (document.RootElement.TryGetProperty("invoiceId", out var value)
                    && value.TryGetInt64(out var invoiceId))
                    return invoiceId;
            }
            catch
            {
            }
            return null;
        }
    }
}
