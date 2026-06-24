using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface INotificationService
    {
        long Create(CreateNotificationRequest request);
        List<NotificationRow> GetByUser(long userId, int take = 50);
        bool MarkRead(long id, long userId);
        int MarkAllRead(long userId);
    }
}
