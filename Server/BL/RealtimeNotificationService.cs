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

        public RealtimeNotificationService(IHubContext<NotificationHub> hubContext, DBservices db)
        {
            _hubContext = hubContext;
            _db = db;
        }

        public async Task NotifyCompanyEventAsync(long companyId, string eventType, object payload,
            string? title = null, string? body = null, string? severity = null, string? link = null)
        {
            if (companyId <= 0 || string.IsNullOrWhiteSpace(eventType))
                return;

            var envelope = new RealtimeEventEnvelope
            {
                EventType = eventType,
                CompanyId = companyId,
                Payload = payload,
                EmittedAtUtc = DateTime.UtcNow
            };

            await _hubContext.Clients
                .Group(RealtimeGroups.Company(companyId))
                .SendAsync("notificationEvent", envelope);

            if (!string.IsNullOrWhiteSpace(title))
            {
                var userIds = _db.GetActiveUserIdsByCompany(companyId);
                foreach (var uid in userIds)
                {
                    _db.CreateNotification(new CreateNotificationRequest
                    {
                        UserId    = uid,
                        EventType = eventType,
                        Title     = title,
                        Body      = body ?? string.Empty,
                        Severity  = severity ?? "info",
                        CompanyId = companyId,
                        Link      = link,
                    });
                }
            }
        }

        public async Task NotifyUserEventAsync(long userId, string eventType, object payload,
            string? title = null, string? body = null, string? severity = null,
            long? companyId = null, string? link = null)
        {
            if (userId <= 0 || string.IsNullOrWhiteSpace(eventType))
                return;

            var envelope = new RealtimeEventEnvelope
            {
                EventType = eventType,
                UserId = userId,
                Payload = payload,
                EmittedAtUtc = DateTime.UtcNow
            };

            await _hubContext.Clients
                .Group(RealtimeGroups.User(userId))
                .SendAsync("notificationEvent", envelope);

            if (!string.IsNullOrWhiteSpace(title))
            {
                _db.CreateNotification(new CreateNotificationRequest
                {
                    UserId    = userId,
                    EventType = eventType,
                    Title     = title,
                    Body      = body ?? string.Empty,
                    Severity  = severity ?? "info",
                    CompanyId = companyId,
                    Link      = link,
                });
            }
        }

        public async Task NotifyGroupEventAsync(string groupName, string eventType, object payload)
        {
            if (string.IsNullOrWhiteSpace(groupName) || string.IsNullOrWhiteSpace(eventType))
                return;

            var envelope = new RealtimeEventEnvelope
            {
                EventType = eventType,
                Payload = payload,
                EmittedAtUtc = DateTime.UtcNow
            };

            await _hubContext.Clients
                .Group(groupName)
                .SendAsync("notificationEvent", envelope);
        }

        public Task NotifyAdminsEventAsync(string eventType, object payload)
        {
            return NotifyGroupEventAsync(RealtimeGroups.Admins, eventType, payload);
        }

        public async Task NotifyUploadJobUpdatedAsync(UploadJobRow job)
        {
            var payload = new
            {
                job.Id,
                job.JobType,
                job.Status,
                job.CompanyId,
                job.UserId,
                job.ProgressPercent,
                job.ResultJson,
                job.ErrorMessage,
                job.FilePath,
                job.FileOriginalName,
                job.FileType,
                job.FileSize,
                job.UpdatedAt,
                job.CompletedAt
            };

            await _hubContext.Clients
                .Group(RealtimeGroups.Company(job.CompanyId))
                .SendAsync("uploadJobUpdated", payload);

            await NotifyCompanyEventAsync(job.CompanyId, "uploadjob.updated", payload);
        }
    }
}