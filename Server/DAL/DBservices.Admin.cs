using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── Admin result rows ─────────────────────────────────────────────────────
    public class AdminStatsRow
    {
        public int TotalUsers        { get; set; }
        public int ActiveUsers       { get; set; }
        public int TotalCompanies    { get; set; }
        public int ActiveCompanies   { get; set; }
        public int TotalInvoices     { get; set; }
        public int TotalTransactions { get; set; }
        public int TotalMatches      { get; set; }
        public int OpenAnomalies     { get; set; }
    }

    public class AdminUserRow
    {
        public long      Id            { get; set; }
        public string    Email         { get; set; } = string.Empty;
        public string    Name          { get; set; } = string.Empty;
        public string    Role          { get; set; } = string.Empty;
        public string?   Phone         { get; set; }
        public bool      IsActive      { get; set; }
        public bool      EmailVerified { get; set; }
        public DateTime? LastLoginAt   { get; set; }
        public DateTime  CreatedAt     { get; set; }
    }

    public class PagedResult<T>
    {
        public int        TotalCount { get; set; }
        public List<T>    Items      { get; set; } = new();
    }

    public class SystemLogRow
    {
        public long      Id         { get; set; }
        public string    Level      { get; set; } = string.Empty;
        public string?   Category   { get; set; }
        public string    Message    { get; set; } = string.Empty;
        public string?   Details    { get; set; }
        public long?     UserId     { get; set; }
        public string?   IpAddress  { get; set; }
        public DateTime  CreatedAt  { get; set; }
    }

    public class AuditLogRow
    {
        public long      Id          { get; set; }
        public long?     UserId      { get; set; }
        public string?   UserName    { get; set; }
        public long?     CompanyId   { get; set; }
        public string    Action      { get; set; } = string.Empty;
        public string?   EntityType  { get; set; }
        public long?     EntityId    { get; set; }
        public string?   OldValue    { get; set; }
        public string?   NewValue    { get; set; }
        public string?   IpAddress   { get; set; }
        public DateTime  CreatedAt   { get; set; }
    }

    public partial class DBservices
    {
        // ── Admin ─────────────────────────────────────────────────────────────

        public AdminStatsRow GetAdminStats()
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_GetStats", con,
                    new Dictionary<string, object?>());

                reader = cmd.ExecuteReader();
                if (!reader.Read()) return new AdminStatsRow();

                return new AdminStatsRow
                {
                    TotalUsers        = Convert.ToInt32(reader["total_users"]),
                    ActiveUsers       = Convert.ToInt32(reader["active_users"]),
                    TotalCompanies    = Convert.ToInt32(reader["total_companies"]),
                    ActiveCompanies   = Convert.ToInt32(reader["active_companies"]),
                    TotalInvoices     = Convert.ToInt32(reader["total_invoices"]),
                    TotalTransactions = Convert.ToInt32(reader["total_transactions"]),
                    TotalMatches      = Convert.ToInt32(reader["total_matches"]),
                    OpenAnomalies     = Convert.ToInt32(reader["open_anomalies"]),
                };
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public PagedResult<AdminUserRow> GetAdminUsers(
            int page, int limit, string? role, string? search)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var result = new PagedResult<AdminUserRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_GetUsers", con,
                    new Dictionary<string, object?>
                    {
                        { "@Page",   page   },
                        { "@Limit",  limit  },
                        { "@Role",   role   },
                        { "@Search", search }
                    });

                reader = cmd.ExecuteReader();

                // RS1 — total count
                if (reader.Read())
                    result.TotalCount = Convert.ToInt32(reader["total_count"]);

                // RS2 — user rows
                if (reader.NextResult())
                    while (reader.Read())
                        result.Items.Add(new AdminUserRow
                        {
                            Id            = Convert.ToInt64(reader["id"]),
                            Email         = reader["email"]?.ToString()!,
                            Name          = reader["name"]?.ToString()!,
                            Role          = reader["role"]?.ToString()!,
                            Phone         = reader["phone"] as string,
                            IsActive      = reader["is_active"]      != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                            EmailVerified = reader["email_verified"]  != DBNull.Value && Convert.ToBoolean(reader["email_verified"]),
                            LastLoginAt   = reader["last_login_at"]  != DBNull.Value ? Convert.ToDateTime(reader["last_login_at"]) : null,
                            CreatedAt     = Convert.ToDateTime(reader["created_at"]),
                        });

                return result;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public (long Id, bool IsActive) ToggleUserActive(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_ToggleUserActive", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                if (reader.Read())
                    return (Convert.ToInt64(reader["id"]),
                            Convert.ToBoolean(reader["is_active"]));
                return (id, false);
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public PagedResult<SystemLogRow> GetSystemLogs(
            int page, int limit, string? level, string? category)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var result = new PagedResult<SystemLogRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_GetLogs", con,
                    new Dictionary<string, object?>
                    {
                        { "@Page",     page     },
                        { "@Limit",    limit    },
                        { "@Level",    level    },
                        { "@Category", category }
                    });

                reader = cmd.ExecuteReader();

                if (reader.Read())
                    result.TotalCount = Convert.ToInt32(reader["total_count"]);

                if (reader.NextResult())
                    while (reader.Read())
                        result.Items.Add(new SystemLogRow
                        {
                            Id        = Convert.ToInt64(reader["id"]),
                            Level     = reader["level"]?.ToString()!,
                            Category  = reader["category"]  as string,
                            Message   = reader["message"]?.ToString()!,
                            Details   = reader["details"]   as string,
                            UserId    = reader["user_id"]   != DBNull.Value ? Convert.ToInt64(reader["user_id"]) : null,
                            IpAddress = reader["ip_address"] as string,
                            CreatedAt = Convert.ToDateTime(reader["created_at"]),
                        });

                return result;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public PagedResult<AuditLogRow> GetAuditLogs(
            int page, int limit, long? companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var result = new PagedResult<AuditLogRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Admin_GetAuditLogs", con,
                    new Dictionary<string, object?>
                    {
                        { "@Page",      page      },
                        { "@Limit",     limit     },
                        { "@CompanyId", companyId }
                    });

                reader = cmd.ExecuteReader();

                if (reader.Read())
                    result.TotalCount = Convert.ToInt32(reader["total_count"]);

                if (reader.NextResult())
                    while (reader.Read())
                        result.Items.Add(new AuditLogRow
                        {
                            Id         = Convert.ToInt64(reader["id"]),
                            UserId     = reader["user_id"]    != DBNull.Value ? Convert.ToInt64(reader["user_id"]) : null,
                            UserName   = reader["user_name"]  as string,
                            CompanyId  = reader["company_id"] != DBNull.Value ? Convert.ToInt64(reader["company_id"]) : null,
                            Action     = reader["action"]?.ToString()!,
                            EntityType = reader["entity_type"] as string,
                            EntityId   = reader["entity_id"]  != DBNull.Value ? Convert.ToInt64(reader["entity_id"]) : null,
                            OldValue   = reader["old_value"]  as string,
                            NewValue   = reader["new_value"]  as string,
                            IpAddress  = reader["ip_address"] as string,
                            CreatedAt  = Convert.ToDateTime(reader["created_at"]),
                        });

                return result;
            }
            finally { reader?.Close(); con?.Close(); }
        }
    }
}
