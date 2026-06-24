using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IRealtimeNotificationService
    {
        Task NotifyCompanyEventAsync(long companyId, string eventType, object payload, string? title = null, string? body = null, string? severity = null, string? link = null);
        Task NotifyUserEventAsync(long userId, string eventType, object payload, string? title = null, string? body = null, string? severity = null, long? companyId = null, string? link = null);
        Task NotifyGroupEventAsync(string groupName, string eventType, object payload);
        Task NotifyAdminsEventAsync(string eventType, object payload);
        Task NotifyUploadJobUpdatedAsync(UploadJobRow job);
    }
}