using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        public long CreateNotification(CreateNotificationRequest req)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", req.UserId },
                        { "@EventId", req.EventId },
                        { "@EventType", req.EventType },
                        { "@Scope", req.Scope },
                        { "@Title", req.Title },
                        { "@Body", req.Body ?? string.Empty },
                        { "@Severity", req.Severity ?? "info" },
                        { "@CompanyId", (object?)req.CompanyId ?? DBNull.Value },
                        { "@Link", (object?)req.Link ?? DBNull.Value },
                        { "@TargetType", (object?)req.TargetType ?? DBNull.Value },
                        { "@TargetId", (object?)req.TargetId ?? DBNull.Value },
                        { "@DedupeKey", (object?)req.DedupeKey ?? DBNull.Value },
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public List<NotificationRow> CreateCompanyNotifications(
            long companyId,
            Guid eventId,
            NotificationMessage message,
            long? excludeUserId = null,
            long? excludeUserId2 = null)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var list = new List<NotificationRow>();
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_InsertForCompany", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@EventId", eventId },
                        { "@EventType", message.EventType },
                        { "@Title", message.Title },
                        { "@Body", message.Body ?? string.Empty },
                        { "@Severity", message.Severity ?? "info" },
                        { "@Link", (object?)NotificationCatalog.BuildLink(message.TargetType, message.TargetId) ?? DBNull.Value },
                        { "@TargetType", (object?)message.TargetType ?? DBNull.Value },
                        { "@TargetId", (object?)message.TargetId ?? DBNull.Value },
                        { "@DedupeKey", (object?)message.DedupeKey ?? DBNull.Value },
                        { "@ExcludeUserId", (object?)excludeUserId ?? DBNull.Value },
                        { "@ExcludeUserId2", (object?)excludeUserId2 ?? DBNull.Value },
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapNotification(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public NotificationRow? GetNotificationById(long id, long userId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_GetById", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", id },
                        { "@UserId", userId }
                    });
                reader = cmd.ExecuteReader();
                return reader.Read() ? MapNotification(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public NotificationInboxDbResult GetNotificationInbox(
            long userId,
            string view,
            long? companyId,
            DateTime? cursorCreatedAt,
            long? cursorId,
            int take)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var result = new NotificationInboxDbResult();
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_GetInbox", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@View", view },
                        { "@CompanyId", (object?)companyId ?? DBNull.Value },
                        { "@CursorCreatedAt", (object?)cursorCreatedAt ?? DBNull.Value },
                        { "@CursorId", (object?)cursorId ?? DBNull.Value },
                        { "@Take", take },
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    result.Items.Add(MapNotification(reader));

                if (reader.NextResult() && reader.Read())
                {
                    result.Counts = new NotificationUnreadCounts
                    {
                        PersonalUnread = reader["personal_unread"] == DBNull.Value ? 0 : Convert.ToInt32(reader["personal_unread"]),
                        CompanyUnread = reader["company_unread"] == DBNull.Value ? 0 : Convert.ToInt32(reader["company_unread"]),
                        VisibleUnread = reader["visible_unread"] == DBNull.Value ? 0 : Convert.ToInt32(reader["visible_unread"]),
                    };
                }

                return result;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public bool MarkNotificationRead(long id, long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_MarkRead", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", id },
                        { "@UserId", userId },
                    });

                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public int MarkAllNotificationsRead(long userId, string view, long? companyId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_MarkAllRead", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@View", view },
                        { "@CompanyId", (object?)companyId ?? DBNull.Value },
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt32(result) : 0;
            }
            finally { con?.Close(); }
        }

        public NotificationUnreadCounts GetNotificationUnreadCounts(long userId, long? companyId, string view)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_GetUnreadCounts", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@View", view },
                        { "@CompanyId", (object?)companyId ?? DBNull.Value }
                    });
                reader = cmd.ExecuteReader();
                if (!reader.Read())
                    return new NotificationUnreadCounts();

                return new NotificationUnreadCounts
                {
                    PersonalUnread = reader["personal_unread"] == DBNull.Value ? 0 : Convert.ToInt32(reader["personal_unread"]),
                    CompanyUnread = reader["company_unread"] == DBNull.Value ? 0 : Convert.ToInt32(reader["company_unread"]),
                    VisibleUnread = reader["visible_unread"] == DBNull.Value ? 0 : Convert.ToInt32(reader["visible_unread"]),
                };
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public List<long> GetActiveUserIdsByCompany(long companyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var list = new List<long>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_GetActiveUserIds", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(Convert.ToInt64(reader[0]));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public bool IsUserActive(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_CheckIsActive", con,
                    new Dictionary<string, object?> { { "@UserId", userId } });
                var value = cmd.ExecuteScalar();
                return value != null && value != DBNull.Value && Convert.ToBoolean(value);
            }
            finally { con?.Close(); }
        }

        public int DeleteExpiredNotifications(int readRetentionDays, int unreadRetentionDays)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_DeleteExpired", con,
                    new Dictionary<string, object?>
                    {
                        { "@ReadDays", readRetentionDays },
                        { "@UnreadDays", unreadRetentionDays }
                    });
                return Convert.ToInt32(cmd.ExecuteScalar() ?? 0);
            }
            finally { con?.Close(); }
        }

        public bool IsCompanyCreator(long userId, long companyId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_CheckCreator", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@CompanyId", companyId }
                    });
                return cmd.ExecuteScalar() != null;
            }
            finally { con?.Close(); }
        }

        private static NotificationRow MapNotification(SqlDataReader r)
        {
            var created = Convert.ToDateTime(r["created_at"]);
            var readAt = r["read_at"] != DBNull.Value ? Convert.ToDateTime(r["read_at"]) : (DateTime?)null;
            return new NotificationRow
            {
                Id = Convert.ToInt64(r["id"]),
                EventId = r.HasColumn("event_id") && r["event_id"] != DBNull.Value
                    ? (Guid)r["event_id"]
                    : Guid.Empty,
                UserId = Convert.ToInt64(r["user_id"]),
                EventType = r["event_type"]?.ToString() ?? string.Empty,
                Scope = r.HasColumn("scope") ? r["scope"]?.ToString() ?? NotificationScopes.Personal : NotificationScopes.Personal,
                Title = r["title"]?.ToString() ?? string.Empty,
                Body = r["body"]?.ToString() ?? string.Empty,
                Severity = r["severity"]?.ToString() ?? "info",
                IsRead = r["is_read"] != DBNull.Value && Convert.ToBoolean(r["is_read"]),
                CompanyId = r["company_id"] != DBNull.Value ? Convert.ToInt64(r["company_id"]) : null,
                CompanyName = r.HasColumn("company_name") ? r["company_name"] as string : null,
                Link = r["link"] as string,
                TargetType = r.HasColumn("target_type") ? r["target_type"] as string : null,
                TargetId = r.HasColumn("target_id") ? r["target_id"] as string : null,
                CreatedAt = DateTime.SpecifyKind(created, DateTimeKind.Utc),
                ReadAt = readAt.HasValue ? DateTime.SpecifyKind(readAt.Value, DateTimeKind.Utc) : null,
            };
        }
    }
}
