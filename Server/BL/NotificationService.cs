using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class NotificationService : INotificationService
    {
        private readonly DBservices _db;

        public NotificationService(DBservices db)
        {
            _db = db;
        }

        public long Create(CreateNotificationRequest request)
        {
            if (request.UserId <= 0 || string.IsNullOrWhiteSpace(request.EventType))
                return 0;

            return _db.CreateNotification(request);
        }

        public List<NotificationRow> GetByUser(long userId, int take = 50) =>
            _db.GetNotificationsByUser(userId, take);

        public bool MarkRead(long id, long userId) =>
            _db.MarkNotificationRead(id, userId);

        public int MarkAllRead(long userId) =>
            _db.MarkAllNotificationsRead(userId);
    }
}
