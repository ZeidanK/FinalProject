using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Admin ─────────────────────────────────────────────────────────────
        private const string COL_USER_ID = "user_id";
        private const string COL_USER_NAME = "user_name";
        private const string COL_COMPANY_ID = "company_id";

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
                            UserId    = reader[COL_USER_ID]   != DBNull.Value ? Convert.ToInt64(reader[COL_USER_ID]) : null,
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
                            UserId     = reader[COL_USER_ID]    != DBNull.Value ? Convert.ToInt64(reader[COL_USER_ID]) : null,
                            UserName   = reader[COL_USER_NAME]  as string,
                            CompanyId  = reader[COL_COMPANY_ID] != DBNull.Value ? Convert.ToInt64(reader[COL_COMPANY_ID]) : null,
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
