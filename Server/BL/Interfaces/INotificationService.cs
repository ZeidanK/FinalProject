using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface INotificationService
    {
        long Create(CreateNotificationRequest request);
        NotificationInboxResult GetInbox(long userId, string view, long? companyId, string? cursor, int take = 25);
        bool MarkRead(long id, long userId);
        int MarkAllRead(long userId, string view, long? companyId);
        NotificationUnreadCounts GetUnreadCounts(long userId, long? companyId, string view);
        int CleanupExpired(int readRetentionDays = 90, int unreadRetentionDays = 365);
    }
}
