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
                        { "@UserId",    req.UserId },
                        { "@EventType", req.EventType },
                        { "@Title",     req.Title },
                        { "@Body",      req.Body ?? string.Empty },
                        { "@Severity",  req.Severity ?? "info" },
                        { "@CompanyId", (object?)req.CompanyId ?? DBNull.Value },
                        { "@Link",      (object?)req.Link ?? DBNull.Value },
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public List<NotificationRow> GetNotificationsByUser(long userId, int take = 50)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var list = new List<NotificationRow>();
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_GetByUser", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@Take",   take },
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapNotification(reader));

                return list;
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
                        { "@Id",     id },
                        { "@UserId", userId },
                    });

                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public int MarkAllNotificationsRead(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Notifications_MarkAllRead", con,
                    new Dictionary<string, object?> { { "@UserId", userId } });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt32(result) : 0;
            }
            finally { con?.Close(); }
        }

        public List<long> GetActiveUserIdsByCompany(long companyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var list = new List<long>();
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
SELECT uca.user_id
FROM dbo.FP26_user_company_access uca
INNER JOIN dbo.FP26_users u ON u.id = uca.user_id
WHERE uca.company_id = @CompanyId
  AND uca.status     = 'active'
  AND u.is_active    = 1;", con);
                cmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(Convert.ToInt64(reader[0]));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        private static NotificationRow MapNotification(SqlDataReader r) => new()
        {
            Id        = Convert.ToInt64(r["id"]),
            UserId    = Convert.ToInt64(r["user_id"]),
            EventType = r["event_type"]?.ToString() ?? string.Empty,
            Title     = r["title"]?.ToString() ?? string.Empty,
            Body      = r["body"]?.ToString() ?? string.Empty,
            Severity  = r["severity"]?.ToString() ?? "info",
            IsRead    = r["is_read"] != DBNull.Value && Convert.ToBoolean(r["is_read"]),
            CompanyId = r["company_id"] != DBNull.Value ? Convert.ToInt64(r["company_id"]) : null,
            Link      = r["link"] as string,
            CreatedAt = Convert.ToDateTime(r["created_at"]),
            ReadAt    = r["read_at"] != DBNull.Value ? Convert.ToDateTime(r["read_at"]) : null,
        };
    }
}
