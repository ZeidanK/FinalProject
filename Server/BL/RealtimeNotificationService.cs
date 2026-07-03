using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using FinalProjectAuthAPI.Realtime;
using Microsoft.AspNetCore.SignalR;

namespace FinalProjectAuthAPI.BL
{
    public class RealtimeNotificationService : IRealtimeNotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly DBservices _db;
        private readonly RealtimeConnectionRegistry _registry;
        private readonly ILogger<RealtimeNotificationService> _logger;
        private readonly IActivityLogService _activityLog;

        public RealtimeNotificationService(
            IHubContext<NotificationHub> hubContext,
            DBservices db,
            RealtimeConnectionRegistry registry,
            ILogger<RealtimeNotificationService> logger,
            IActivityLogService activityLog)
        {
            _hubContext = hubContext;
            _db = db;
            _registry = registry;
            _logger = logger;
            _activityLog = activityLog;
        }

        public Task NotifyCompanyEventAsync(long companyId, string eventType, object payload)
        {
            if (companyId <= 0 || string.IsNullOrWhiteSpace(eventType))
                return Task.CompletedTask;

            return SafeSendAsync(
                () => _hubContext.Clients.Group(RealtimeGroups.Company(companyId))
                    .SendAsync("notificationEvent", CreateEnvelope(eventType, payload, companyId: companyId)),
                eventType);
        }

        public Task NotifyUserEventAsync(long userId, string eventType, object payload)
        {
            if (userId <= 0 || string.IsNullOrWhiteSpace(eventType))
                return Task.CompletedTask;

            return SafeSendAsync(
                () => _hubContext.Clients.Group(RealtimeGroups.User(userId))
                    .SendAsync("notificationEvent", CreateEnvelope(eventType, payload, userId: userId)),
                eventType);
        }

        public Task NotifyGroupEventAsync(string groupName, string eventType, object payload)
        {
            if (string.IsNullOrWhiteSpace(groupName) || string.IsNullOrWhiteSpace(eventType))
                return Task.CompletedTask;

            return SafeSendAsync(
                () => _hubContext.Clients.Group(groupName)
                    .SendAsync("notificationEvent", CreateEnvelope(eventType, payload)),
                eventType);
        }

        public Task NotifyAdminsEventAsync(string eventType, object payload) =>
            NotifyGroupEventAsync(RealtimeGroups.Admins, eventType, payload);

        public async Task CreateUserNotificationAsync(
            long userId,
            NotificationMessage message,
            object payload,
            long? companyId = null)
        {
            if (userId <= 0)
                return;

            try
            {
                NotificationCatalog.Validate(message, NotificationScopes.Personal);
                var eventId = Guid.NewGuid();
                var request = new CreateNotificationRequest
                {
                    UserId = userId,
                    EventId = eventId,
                    EventType = message.EventType,
                    Scope = NotificationScopes.Personal,
                    Title = message.Title,
                    Body = message.Body,
                    Severity = message.Severity,
                    CompanyId = companyId,
                    Link = NotificationCatalog.BuildLink(message.TargetType, message.TargetId),
                    TargetType = message.TargetType,
                    TargetId = message.TargetId,
                    DedupeKey = message.DedupeKey,
                };

                var id = await ExecuteWithRetryAsync(() => _db.CreateNotification(request));
                if (id <= 0)
                    return;

                var row = _db.GetNotificationById(id, userId);
                if (row != null)
                {
                    await _hubContext.Clients.Group(RealtimeGroups.User(userId)).SendAsync("notificationCreated", row);
                    _logger.LogDebug(
                        "Delivered realtime notification {NotificationId} ({EventType}) to user {UserId}",
                        row.Id, row.EventType, userId);
                }

                await NotifyUserEventAsync(userId, message.EventType, payload);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to create personal notification {EventType} for user {UserId}",
                    message.EventType, userId);
                LogRealtimeFailure(
                    "Failed to create personal notification",
                    ex.Message,
                    message.EventType,
                    userId: userId,
                    companyId: companyId);
            }
        }

        public async Task CreateCompanyNotificationAsync(
            long companyId,
            NotificationMessage message,
            object payload,
            long? excludeUserId = null,
            long? excludeUserId2 = null)
        {
            if (companyId <= 0)
                return;

            try
            {
                NotificationCatalog.Validate(message, NotificationScopes.Company);
                var eventId = Guid.NewGuid();
                var rows = await ExecuteWithRetryAsync(() =>
                    _db.CreateCompanyNotifications(companyId, eventId, message, excludeUserId, excludeUserId2));

                await Task.WhenAll(rows.Select(row =>
                    _hubContext.Clients
                        .Group(RealtimeGroups.User(row.UserId))
                        .SendAsync("notificationCreated", row)));

                _logger.LogDebug(
                    "Delivered realtime company notification {EventType} to {RecipientCount} recipients for company {CompanyId}",
                    message.EventType, rows.Count, companyId);

                await NotifyCompanyEventAsync(companyId, message.EventType, payload);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to create company notification {EventType} for company {CompanyId}",
                    message.EventType, companyId);
                LogRealtimeFailure(
                    "Failed to create company notification",
                    ex.Message,
                    message.EventType,
                    companyId: companyId);
            }
        }

        public Task NotifyReadStateChangedAsync(long userId, object payload) =>
            SafeSendAsync(
                () => _hubContext.Clients.Group(RealtimeGroups.User(userId))
                    .SendAsync("notificationReadStateChanged", payload),
                "notification.read_state_changed");

        public Task NotifyUploadJobUpdatedAsync(UploadJobRow job)
        {
            var payload = new
            {
                job.Id,
                job.JobType,
                job.Status,
                job.CompanyId,
                job.UserId,
                job.ProgressPercent,
                job.FileOriginalName,
                job.FileType,
                job.FileSize,
                job.FilePath,
                job.ResultJson,
                job.ErrorMessage,
                job.UpdatedAt,
                job.CompletedAt
            };

            return SafeSendAsync(
                () => _hubContext.Clients.Group(RealtimeGroups.User(job.UserId))
                    .SendAsync("uploadJobUpdated", payload),
                "uploadjob.updated");
        }

        public async Task RevokeCompanyAccessAsync(long userId, long companyId)
        {
            foreach (var connectionId in _registry.GetUserConnections(userId))
            {
                try
                {
                    await Task.WhenAll(
                        _hubContext.Groups.RemoveFromGroupAsync(connectionId, RealtimeGroups.Company(companyId)),
                        _hubContext.Groups.RemoveFromGroupAsync(connectionId, RealtimeGroups.CompanyOwners(companyId)),
                        _hubContext.Groups.RemoveFromGroupAsync(connectionId, RealtimeGroups.CompanyAccountants(companyId)));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to revoke realtime company {CompanyId} from user {UserId}",
                        companyId, userId);
                    LogRealtimeFailure(
                        "Failed to revoke realtime company access",
                        ex.Message,
                        "realtime.company_access.revoked",
                        userId,
                        companyId);
                }
                finally
                {
                    _registry.LeaveCompany(connectionId, companyId);
                }
            }
        }

        public async Task RevokeUserAccessAsync(long userId)
        {
            foreach (var connectionId in _registry.GetUserConnections(userId))
            {
                foreach (var companyId in _registry.GetConnectionCompanies(connectionId))
                    await RevokeCompanyAccessAsync(userId, companyId);

                try
                {
                    await _hubContext.Groups.RemoveFromGroupAsync(connectionId, RealtimeGroups.User(userId));
                    await _hubContext.Groups.RemoveFromGroupAsync(connectionId, RealtimeGroups.Admins);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to revoke realtime access from user {UserId}", userId);
                    LogRealtimeFailure(
                        "Failed to revoke realtime user access",
                        ex.Message,
                        "realtime.user_access.revoked",
                        userId);
                }
            }
        }

        private static RealtimeEventEnvelope CreateEnvelope(
            string eventType,
            object payload,
            long? companyId = null,
            long? userId = null) => new()
            {
                EventType = eventType,
                CompanyId = companyId,
                UserId = userId,
                Payload = payload,
                EmittedAtUtc = DateTime.UtcNow,
            };

        private static async Task<T> ExecuteWithRetryAsync<T>(Func<T> action)
        {
            Exception? last = null;
            foreach (var delay in new[] { 0, 100, 300 })
            {
                try
                {
                    if (delay > 0)
                        await Task.Delay(delay);
                    return action();
                }
                catch (Exception ex)
                {
                    last = ex;
                }
            }

            throw last ?? new InvalidOperationException("Notification persistence failed.");
        }

        private async Task SafeSendAsync(Func<Task> send, string eventType)
        {
            try
            {
                await send();
                _logger.LogDebug("Delivered realtime event {EventType}", eventType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Realtime event {EventType} could not be delivered", eventType);
                LogRealtimeFailure(
                    "Realtime event could not be delivered",
                    ex.Message,
                    eventType);
            }
        }

        private void LogRealtimeFailure(
            string message,
            string error,
            string eventType,
            long? userId = null,
            long? companyId = null)
        {
            _activityLog.LogSystem(new CreateSystemLogRequest
            {
                Level = "WARN",
                Category = "realtime",
                Message = message,
                Details = System.Text.Json.JsonSerializer.Serialize(new
                {
                    eventType,
                    userId,
                    companyId,
                    error
                }),
                UserId = userId
            });
        }
    }
}