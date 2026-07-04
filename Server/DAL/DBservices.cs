using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    /// <summary>
    /// Data Access Layer – mirrors the NewsSitePro DBservices pattern.
    /// Reads the connection string from appsettings.json and calls stored procedures.
    /// </summary>
    public partial class DBservices
    {
        private readonly string connectionString;

        public DBservices()
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();
            connectionString = configuration.GetConnectionString("myProjDB")!;
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private SqlConnection Connect()
        {
            var con = new SqlConnection(connectionString);
            con.Open();
            return con;
        }

        private static SqlCommand CreateCommandWithStoredProcedure(
            string spName,
            SqlConnection con,
            Dictionary<string, object?> parameters)
        {
            var cmd = new SqlCommand(spName, con)
            {
                CommandType    = CommandType.StoredProcedure,
                CommandTimeout = 10
            };
            foreach (var param in parameters)
                cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
            return cmd;
        }

        // ── User queries ─────────────────────────────────────────────────────

        /// <summary>Fetch a single user by email. Returns null if not found.</summary>
        public virtual User? GetUserByEmail(string email)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_GetByEmail", con,
                    new Dictionary<string, object?> { { "@Email", email } });

                reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new User
                    {
                        Id           = Convert.ToInt64(reader["id"]),
                        Email        = reader["email"]?.ToString()!,
                        PasswordHash = reader["password_hash"]?.ToString()!,
                        Name         = reader["name"]?.ToString()!,
                        Role         = reader["role"]?.ToString() ?? "business_owner",
                        IsActive     = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"])
                    };
                }
                return null;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        /// <summary>
        /// Insert a new user. Sets user.Id to the new identity value.
        /// Returns true when a row was created.
        /// </summary>
        public virtual bool CreateUser(User user)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@Email",        user.Email        },
                        { "@PasswordHash", user.PasswordHash },
                        { "@Name",         user.Name         },
                        { "@Role",         user.Role         }
                    });

                var result = cmd.ExecuteScalar();
                user.Id = result != null ? Convert.ToInt64(result) : 0;
                return user.Id > 0;
            }
            finally
            {
                con?.Close();
            }
        }

        /// <summary>Stamp last_login_at for the given user.</summary>
        public void UpdateLastLogin(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_UpdateLastLogin", con,
                    new Dictionary<string, object?> { { "@Id", userId } });
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateLastLogin failed: {ex.Message}");
            }
            finally
            {
                con?.Close();
            }
        }
    }
}
