using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.BL;

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

        // ── Mapping helper ────────────────────────────────────────────────────

        private static User MapUser(SqlDataReader r) => new()
        {
            Id       = Convert.ToInt64(r["id"]),
            Email    = r["email"]?.ToString()!,
            Name     = r["name"]?.ToString()!,
            Role     = r["role"]?.ToString() ?? "business_owner",
            IsActive = r["is_active"] != DBNull.Value && Convert.ToBoolean(r["is_active"])
        };
    }
}
