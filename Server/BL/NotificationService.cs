using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class NotificationService : INotificationService
    {
        private readonly IDBservices _db;

        public NotificationService(IDBservices db)
        {
            _db = db;
        }

        public long Create(CreateNotificationRequest request)
        {
            if (request.UserId <= 0 || string.IsNullOrWhiteSpace(request.EventType))
                return 0;

            return _db.CreateNotification(request);
        }

        public NotificationInboxResult GetInbox(
            long userId, string view, long? companyId, string? cursor, int take = 25)
        {
            var normalizedView = NormalizeView(view);
            var safeTake = Math.Clamp(take, 1, 100);
            var (cursorCreatedAt, cursorId) = DecodeCursor(cursor);
            var result = _db.GetNotificationInbox(
                userId, normalizedView, companyId, cursorCreatedAt, cursorId, safeTake + 1);

            string? nextCursor = null;
            if (result.Items.Count > safeTake)
            {
                result.Items.RemoveRange(safeTake, result.Items.Count - safeTake);
                var last = result.Items[^1];
                nextCursor = EncodeCursor(last.CreatedAt, last.Id);
            }

            return new NotificationInboxResult
            {
                Items = result.Items,
                NextCursor = nextCursor,
                Counts = result.Counts,
            };
        }

        public bool MarkRead(long id, long userId) =>
            _db.MarkNotificationRead(id, userId);

        public int MarkAllRead(long userId, string view, long? companyId) =>
            _db.MarkAllNotificationsRead(userId, NormalizeView(view), companyId);

        public NotificationUnreadCounts GetUnreadCounts(long userId, long? companyId, string view) =>
            _db.GetNotificationUnreadCounts(userId, companyId, NormalizeView(view));

        public int CleanupExpired(int readRetentionDays = 90, int unreadRetentionDays = 365) =>
            _db.DeleteExpiredNotifications(
                Math.Clamp(readRetentionDays, 1, 3650),
                Math.Clamp(unreadRetentionDays, 1, 3650));

        private static string NormalizeView(string? view)
        {
            return view?.Trim().ToLowerInvariant() switch
            {
                NotificationViews.Personal => NotificationViews.Personal,
                NotificationViews.Company => NotificationViews.Company,
                _ => NotificationViews.Combined,
            };
        }

        private static string EncodeCursor(DateTime createdAt, long id)
        {
            var raw = $"{createdAt.ToUniversalTime().Ticks}:{id}";
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(raw));
        }

        private static (DateTime? CreatedAt, long? Id) DecodeCursor(string? cursor)
        {
            if (string.IsNullOrWhiteSpace(cursor))
                return (null, null);

            try
            {
                var raw = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
                var parts = raw.Split(':', 2);
                if (parts.Length != 2
                    || !long.TryParse(parts[0], out var ticks)
                    || !long.TryParse(parts[1], out var id))
                    return (null, null);

                return (new DateTime(ticks, DateTimeKind.Utc), id);
            }
            catch
            {
                return (null, null);
            }
        }
    }
}
