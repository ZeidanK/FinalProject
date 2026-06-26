using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Users ─────────────────────────────────────────────────────────────

        public User? GetUserById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                if (reader.Read())
                    return MapUser(reader);
                return null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public List<User> GetAllUsers()
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var users = new List<User>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_GetAll", con,
                    new Dictionary<string, object?>());

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    users.Add(MapUser(reader));
                return users;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public bool UpdateUser(long id, string? name, string? phone, string? profilePicture)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",             id             },
                        { "@Name",           name           },
                        { "@Phone",          phone          },
                        { "@ProfilePicture", profilePicture }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Password operations ─────────────────────────────────────────────

        public string? GetPasswordHash(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_GetPasswordHash", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                if (reader.Read())
                    return reader["password_hash"]?.ToString();
                return null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public bool ChangePassword(long id, string newPasswordHash)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_ChangePassword", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",              id              },
                        { "@NewPasswordHash", newPasswordHash }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public bool UpdateUserVisibility(long userId, bool isPublic)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
UPDATE dbo.FP26_users
SET is_public = @IsPublic
WHERE id = @Id;
SELECT @@ROWCOUNT;", con);
                cmd.Parameters.Add("@Id", SqlDbType.BigInt).Value = userId;
                cmd.Parameters.Add("@IsPublic", SqlDbType.Bit).Value = isPublic;
                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public List<AccountantInfo> GetPublicAccountants(long? requestingCompanyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<AccountantInfo>();
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
SELECT u.id, u.name, u.email, u.phone, u.profile_picture,
       uca.status AS request_status
FROM dbo.FP26_users u
LEFT JOIN dbo.FP26_user_company_access uca
    ON uca.user_id = u.id
   AND uca.company_id = @CompanyId
WHERE u.role IN ('accountant', 'accountant_business_owner')
  AND u.is_active = 1
  AND (
    u.is_public = 1
    OR (
      @CompanyId IS NOT NULL
      AND uca.status = 'active'
    )
  )
ORDER BY u.name;", con);
                cmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value =
                    (object?)requestingCompanyId ?? DBNull.Value;
                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new AccountantInfo
                    {
                        Id             = Convert.ToInt64(reader["id"]),
                        Name           = reader["name"]?.ToString() ?? string.Empty,
                        Email          = reader["email"]?.ToString() ?? string.Empty,
                        Phone          = reader["phone"] != DBNull.Value ? reader["phone"]?.ToString() : null,
                        ProfilePicture = reader["profile_picture"] != DBNull.Value ? reader["profile_picture"]?.ToString() : null,
                        RequestStatus  = reader["request_status"] != DBNull.Value ? reader["request_status"]?.ToString() : null,
                    });
                }
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        // ── Account soft deletion ──────────────────────────────────────────────

        public bool DeleteUserAccount(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
                    UPDATE dbo.FP26_users
                    SET is_active = 0,
                        updated_at = GETDATE()
                    WHERE id = @UserId;
                    SELECT @@ROWCOUNT;", con);
                cmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;

                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public bool ReactivateUserAccount(long userId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_SetActive", con,
                    new Dictionary<string, object?> { { "@Id", userId } });

                reader = cmd.ExecuteReader();
                if (reader.Read())
                    return true;

                return false;
            }
            finally { reader?.Close(); con?.Close(); }
        }


        // ── Mapping helper ────────────────────────────────────────────────────

        private static User MapUser(SqlDataReader r) => new()
        {
            Id             = Convert.ToInt64(r["id"]),
            Email          = r["email"]?.ToString()!,
            Name           = r["name"]?.ToString()!,
            Role           = r["role"]?.ToString() ?? "business_owner",
            Phone          = r["phone"] != DBNull.Value ? r["phone"]?.ToString() : null,
            ProfilePicture = r["profile_picture"] != DBNull.Value ? r["profile_picture"]?.ToString() : null,
            IsActive       = r["is_active"] != DBNull.Value && Convert.ToBoolean(r["is_active"]),
            IsPublic       = r.HasColumn("is_public") && r["is_public"] != DBNull.Value && Convert.ToBoolean(r["is_public"]),
        };
    }
}
