using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Users ─────────────────────────────────────────────────────────────

        public virtual User? GetUserById(long id)
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

        public virtual List<User> GetAllUsers()
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

        public virtual bool UpdateUser(long id, string? name, string? phone, string? profilePicture, string? bio = null, int? yearsOfExperience = null, decimal? hourlyRate = null, string? location = null, string? website = null)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",                id                },
                        { "@Name",              name              },
                        { "@Phone",             phone             },
                        { "@ProfilePicture",    profilePicture    },
                        { "@Bio",               (object?)bio ?? DBNull.Value },
                        { "@YearsOfExperience", (object?)yearsOfExperience ?? DBNull.Value },
                        { "@HourlyRate",        (object?)hourlyRate ?? DBNull.Value },
                        { "@Location",          (object?)location ?? DBNull.Value },
                        { "@Website",           (object?)website ?? DBNull.Value },
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Password operations ─────────────────────────────────────────────

        public virtual string? GetPasswordHash(long id)
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

        public virtual bool ChangePassword(long id, string newPasswordHash)
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

        public virtual bool UpdateUserVisibility(long userId, bool isPublic)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_UpdateVisibility", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", userId },
                        { "@IsPublic", isPublic }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual List<AccountantInfo> GetPublicAccountants(long? requestingCompanyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<AccountantInfo>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_GetPublicAccountants", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", (object?)requestingCompanyId ?? DBNull.Value }
                    });
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

        public virtual PagedAccountantsResponse GetPublicAccountantsPaginated(long? companyId, int page, int limit, string? search, string? sortBy, string? sortDirection)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var response = new PagedAccountantsResponse();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_GetPublicAccountants_Paginated", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",     (object?)companyId ?? DBNull.Value },
                        { "@Page",          page },
                        { "@Limit",         limit },
                        { "@Search",        (object?)search ?? DBNull.Value },
                        { "@SortBy",        sortBy ?? "name" },
                        { "@SortDirection", sortDirection ?? "ASC" },
                    });
                reader = cmd.ExecuteReader();

                // First result set: total count
                if (reader.Read())
                {
                    response.TotalCount = Convert.ToInt32(reader[0]);
                }

                // Second result set: paginated data
                if (reader.NextResult())
                {
                    while (reader.Read())
                    {
                        response.Items.Add(new AccountantInfo
                        {
                            Id                = Convert.ToInt64(reader["id"]),
                            Name              = reader["name"]?.ToString() ?? string.Empty,
                            Email             = reader["email"]?.ToString() ?? string.Empty,
                            Phone             = reader["phone"] != DBNull.Value ? reader["phone"]?.ToString() : null,
                            ProfilePicture    = reader["profile_picture"] != DBNull.Value ? reader["profile_picture"]?.ToString() : null,
                            RequestStatus     = reader["request_status"] != DBNull.Value ? reader["request_status"]?.ToString() : null,
                            Bio               = reader["bio"] != DBNull.Value ? reader["bio"]?.ToString() : null,
                            YearsOfExperience  = reader["years_of_experience"] != DBNull.Value ? Convert.ToInt32(reader["years_of_experience"]) : null,
                            HourlyRate        = reader["hourly_rate"] != DBNull.Value ? Convert.ToDecimal(reader["hourly_rate"]) : null,
                            Location          = reader["location"] != DBNull.Value ? reader["location"]?.ToString() : null,
                            Website           = reader["website"] != DBNull.Value ? reader["website"]?.ToString() : null,
                            Specialties       = reader["specialties"]?.ToString() ?? string.Empty,
                            Certifications    = reader["certifications"]?.ToString() ?? string.Empty,
                            AverageRating     = reader["average_rating"] != DBNull.Value ? Convert.ToDecimal(reader["average_rating"]) : null,
                            ReviewCount       = reader["review_count"] != DBNull.Value ? Convert.ToInt32(reader["review_count"]) : 0,
                        });
                    }
                }

                response.Page = page;
                response.Limit = limit;
                return response;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        // ── Accountant specialties ─────────────────────────────────────────────

        public virtual bool AddAccountantSpecialty(long userId, string specialty)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantSpecialties_Add", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@Specialty", specialty },
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool RemoveAccountantSpecialty(long userId, string specialty)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantSpecialties_Remove", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@Specialty", specialty },
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Accountant certifications ──────────────────────────────────────────

        public virtual bool AddAccountantCertification(long userId, string certification)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantCertifications_Add", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@Certification", certification },
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool RemoveAccountantCertification(long userId, string certification)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantCertifications_Remove", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@Certification", certification },
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Accountant reviews ──────────────────────────────────────────────────

        public virtual bool UpsertAccountantReview(long accountantUserId, long companyId, byte rating, string? review, long createdByUserId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantReviews_Upsert", con,
                    new Dictionary<string, object?>
                    {
                        { "@AccountantUserId", accountantUserId },
                        { "@CompanyId",        companyId },
                        { "@Rating",           rating },
                        { "@Review",           (object?)review ?? DBNull.Value },
                        { "@CreatedByUserId",  createdByUserId },
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Fetch specialties/certifications for a user ────────────────────────

        public virtual List<string> GetAccountantSpecialties(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantSpecialties_GetByUser", con,
                    new Dictionary<string, object?> { { "@UserId", userId } });
                var result = new List<string>();
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                    result.Add(Convert.ToString(reader["specialty"]) ?? "");
                return result;
            }
            finally { con?.Close(); }
        }

        public virtual List<string> GetAccountantCertifications(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_AccountantCertifications_GetByUser", con,
                    new Dictionary<string, object?> { { "@UserId", userId } });
                var result = new List<string>();
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                    result.Add(Convert.ToString(reader["certification"]) ?? "");
                return result;
            }
            finally { con?.Close(); }
        }

        // ── Account soft deletion ──────────────────────────────────────────────

        public virtual bool DeleteUserAccount(long userId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Users_SoftDelete", con,
                    new Dictionary<string, object?> { { "@UserId", userId } });
                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool ReactivateUserAccount(long userId)
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
            Id                = Convert.ToInt64(r["id"]),
            Email             = r["email"]?.ToString()!,
            Name              = r["name"]?.ToString()!,
            Role              = r["role"]?.ToString() ?? "business_owner",
            Phone             = r["phone"] != DBNull.Value ? r["phone"]?.ToString() : null,
            ProfilePicture    = r["profile_picture"] != DBNull.Value ? r["profile_picture"]?.ToString() : null,
            IsActive          = r["is_active"] != DBNull.Value && Convert.ToBoolean(r["is_active"]),
            IsBanned          = r["is_banned"] != DBNull.Value && Convert.ToBoolean(r["is_banned"]),
            IsPublic          = r.HasColumn("is_public") && r["is_public"] != DBNull.Value && Convert.ToBoolean(r["is_public"]),
            Bio               = r["bio"] != DBNull.Value ? r["bio"]?.ToString() : null,
            YearsOfExperience = r["years_of_experience"] != DBNull.Value ? Convert.ToInt32(r["years_of_experience"]) : null,
            HourlyRate        = r["hourly_rate"] != DBNull.Value ? Convert.ToDecimal(r["hourly_rate"]) : null,
            Location          = r["location"] != DBNull.Value ? r["location"]?.ToString() : null,
            Website           = r["website"] != DBNull.Value ? r["website"]?.ToString() : null,
        };
    }
}
