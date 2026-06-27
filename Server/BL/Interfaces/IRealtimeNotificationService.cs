using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IRealtimeNotificationService
    {
        Task NotifyCompanyEventAsync(long companyId, string eventType, object payload);
        Task NotifyUserEventAsync(long userId, string eventType, object payload);
        Task NotifyGroupEventAsync(string groupName, string eventType, object payload);
        Task NotifyAdminsEventAsync(string eventType, object payload);
        Task CreateCompanyNotificationAsync(long companyId, NotificationMessage message, object payload, long? excludeUserId = null, long? excludeUserId2 = null);
        Task CreateUserNotificationAsync(long userId, NotificationMessage message, object payload, long? companyId = null);
        Task NotifyReadStateChangedAsync(long userId, object payload);
        Task NotifyUploadJobUpdatedAsync(UploadJobRow job);
        Task RevokeCompanyAccessAsync(long userId, long companyId);
        Task RevokeUserAccessAsync(long userId);
    }
}
