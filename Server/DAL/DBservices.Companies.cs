using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Companies ─────────────────────────────────────────────────────────

        public List<CompanyRow> GetAllCompanies()
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<CompanyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_GetAll", con,
                    new Dictionary<string, object?>());

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapCompany(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public CompanyRow? GetCompanyById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                return reader.Read() ? MapCompany(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public List<CompanyRow> GetCompaniesByUserId(long userId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<CompanyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_GetByUserId", con,
                    new Dictionary<string, object?> { { "@UserId", userId } });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapCompany(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public bool UserHasActiveCompanyAccess(long userId, long companyId)
        {
            if (userId <= 0 || companyId <= 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
SELECT TOP 1 1
FROM dbo.FP26_user_company_access uca
INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
WHERE uca.user_id = @UserId
  AND uca.company_id = @CompanyId
  AND uca.status = 'active'
  AND c.is_active = 1;", con);

                cmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
                cmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;

                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value;
            }
            finally { con?.Close(); }
        }

        public bool EnsureUserHasFullCompanyAccess(long userId, long companyId)
        {
            if (userId <= 0 || companyId <= 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
IF EXISTS (
    SELECT 1
    FROM dbo.FP26_user_company_access
    WHERE user_id = @UserId
      AND company_id = @CompanyId
)
BEGIN
    UPDATE dbo.FP26_user_company_access
    SET access_level = 'full',
        status = 'active',
        granted_at = GETDATE()
    WHERE user_id = @UserId
      AND company_id = @CompanyId;
END
ELSE
BEGIN
    INSERT INTO dbo.FP26_user_company_access
        (user_id, company_id, access_level, status, granted_by_user_id, granted_at, created_at)
    VALUES
        (@UserId, @CompanyId, 'full', 'active', @GrantedByUserId, GETDATE(), GETDATE());
END", con);

                cmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
                cmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;
                cmd.Parameters.Add("@GrantedByUserId", SqlDbType.BigInt).Value = userId;

                cmd.ExecuteNonQuery();
                return true;
            }
            finally { con?.Close(); }
        }

        public long CreateCompany(
            string name, long createdByUserId,
            string? registrationNumber, string? street, string? city,
            string? state, string? postalCode, string country,
            string? email, string? phone, string? website,
            string? taxId, string? vatNumber, DateTime? fiscalYearStart,
            string currency)
        {
            SqlConnection? con = null;
            SqlTransaction? tx = null;
            try
            {
                con = Connect();
                tx = con.BeginTransaction();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_Insert", con,
                    BuildCompanyParameters(
                        id: null,
                        name: name,
                        createdByUserId: createdByUserId,
                        registrationNumber: registrationNumber,
                        street: street,
                        city: city,
                        state: state,
                        postalCode: postalCode,
                        country: country,
                        email: email,
                        phone: phone,
                        website: website,
                        taxId: taxId,
                        vatNumber: vatNumber,
                        fiscalYearStart: fiscalYearStart,
                        currency: currency,
                        isActive: null));
                cmd.Transaction = tx;

                var result = cmd.ExecuteScalar();
                var companyId = result != null ? Convert.ToInt64(result) : 0;
                if (companyId <= 0)
                {
                    tx.Rollback();
                    return 0;
                }

                using var accessCmd = new SqlCommand(@"
IF NOT EXISTS (
    SELECT 1
    FROM dbo.FP26_user_company_access
    WHERE user_id = @UserId AND company_id = @CompanyId
)
BEGIN
    INSERT INTO dbo.FP26_user_company_access
        (user_id, company_id, access_level, status, granted_by_user_id, granted_at, created_at)
    VALUES
        (@UserId, @CompanyId, 'full', 'active', @UserId, GETDATE(), GETDATE());
END", con, tx);

                accessCmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = createdByUserId;
                accessCmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;
                accessCmd.ExecuteNonQuery();

                tx.Commit();
                return companyId;
            }
            catch
            {
                tx?.Rollback();
                throw;
            }
            finally { con?.Close(); }
        }

        public bool UpdateCompany(
            long id, string? name, string? street, string? city,
            string? state, string? postalCode, string? country,
            string? email, string? phone, string? website,
            string? taxId, string? vatNumber, bool? isActive)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_Update", con,
                    BuildCompanyParameters(
                        id: id,
                        name: name,
                        createdByUserId: null,
                        registrationNumber: null,
                        street: street,
                        city: city,
                        state: state,
                        postalCode: postalCode,
                        country: country,
                        email: email,
                        phone: phone,
                        website: website,
                        taxId: taxId,
                        vatNumber: vatNumber,
                        fiscalYearStart: null,
                        currency: null,
                        isActive: isActive));

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        private static Dictionary<string, object?> BuildCompanyParameters(
            long? id,
            string? name,
            long? createdByUserId,
            string? registrationNumber,
            string? street,
            string? city,
            string? state,
            string? postalCode,
            string? country,
            string? email,
            string? phone,
            string? website,
            string? taxId,
            string? vatNumber,
            DateTime? fiscalYearStart,
            string? currency,
            bool? isActive)
        {
            var parameters = new Dictionary<string, object?>
            {
                { "@Name",               name               },
                { "@Street",             street             },
                { "@City",               city               },
                { "@State",              state              },
                { "@PostalCode",         postalCode         },
                { "@Country",            country            },
                { "@Email",              email              },
                { "@Phone",              phone              },
                { "@Website",            website            },
                { "@TaxId",              taxId              },
                { "@VatNumber",          vatNumber          },
            };

            if (id.HasValue) parameters["@Id"] = id.Value;
            if (createdByUserId.HasValue) parameters["@CreatedByUserId"] = createdByUserId.Value;
            if (!string.IsNullOrWhiteSpace(registrationNumber)) parameters["@RegistrationNumber"] = registrationNumber;
            if (fiscalYearStart.HasValue) parameters["@FiscalYearStart"] = fiscalYearStart.Value;
            if (!string.IsNullOrWhiteSpace(currency)) parameters["@Currency"] = currency;
            if (isActive.HasValue) parameters["@IsActive"] = isActive.Value;

            return parameters;
        }

        public (bool Success, string Error) CreatePendingAccessRequest(
            long accountantUserId, long companyId, long requestedByUserId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();

                // Check for an existing record
                using var checkCmd = new SqlCommand(@"
SELECT status
FROM dbo.FP26_user_company_access
WHERE user_id = @UserId AND company_id = @CompanyId;", con);
                checkCmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = accountantUserId;
                checkCmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;
                var existing = checkCmd.ExecuteScalar()?.ToString();

                if (existing == "active")
                    return (false, "This accountant is already working with your company.");
                if (existing == "pending")
                    return (false, "A request is already pending for this accountant.");

                if (existing == null)
                {
                    using var insertCmd = new SqlCommand(@"
INSERT INTO dbo.FP26_user_company_access
    (user_id, company_id, access_level, status, granted_by_user_id, created_at)
VALUES
    (@UserId, @CompanyId, 'view_only', 'pending', @RequestedBy, GETDATE());", con);
                    insertCmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = accountantUserId;
                    insertCmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;
                    insertCmd.Parameters.Add("@RequestedBy", SqlDbType.BigInt).Value = requestedByUserId;
                    insertCmd.ExecuteNonQuery();
                }
                else
                {
                    // Previously revoked — reopen as pending
                    using var updateCmd = new SqlCommand(@"
UPDATE dbo.FP26_user_company_access
SET status              = 'pending',
    access_level        = 'view_only',
    granted_by_user_id  = @RequestedBy,
    granted_at          = NULL,
    revoked_at          = NULL,
    revoked_by_user_id  = NULL
WHERE user_id = @UserId AND company_id = @CompanyId;", con);
                    updateCmd.Parameters.Add("@UserId", SqlDbType.BigInt).Value = accountantUserId;
                    updateCmd.Parameters.Add("@CompanyId", SqlDbType.BigInt).Value = companyId;
                    updateCmd.Parameters.Add("@RequestedBy", SqlDbType.BigInt).Value = requestedByUserId;
                    updateCmd.ExecuteNonQuery();
                }

                return (true, string.Empty);
            }
            finally { con?.Close(); }
        }

        public List<AccessRequestRow> GetPendingRequestsByAccountant(long accountantId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<AccessRequestRow>();
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
SELECT uca.id,
       uca.company_id,
       c.name             AS company_name,
       uca.granted_by_user_id AS requested_by_user_id,
       COALESCE(u.name, 'Unknown') AS requested_by_name,
       uca.created_at,
       uca.status
FROM dbo.FP26_user_company_access uca
INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
LEFT  JOIN dbo.FP26_users     u ON u.id = uca.granted_by_user_id
WHERE uca.user_id = @AccountantId
  AND uca.status  = 'pending'
ORDER BY uca.created_at DESC;", con);
                cmd.Parameters.Add("@AccountantId", SqlDbType.BigInt).Value = accountantId;
                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new AccessRequestRow
                    {
                        Id                = Convert.ToInt64(reader["id"]),
                        CompanyId         = Convert.ToInt64(reader["company_id"]),
                        CompanyName       = reader["company_name"]?.ToString() ?? string.Empty,
                        RequestedByUserId = reader["requested_by_user_id"] != DBNull.Value
                                               ? Convert.ToInt64(reader["requested_by_user_id"])
                                               : 0,
                        RequestedByName   = reader["requested_by_name"]?.ToString() ?? "Unknown",
                        CreatedAt         = Convert.ToDateTime(reader["created_at"]),
                        Status            = reader["status"]?.ToString() ?? "pending",
                    });
                }
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public List<CompanyRow> GetActiveCompaniesByAccountant(long accountantId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<CompanyRow>();
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
SELECT c.*, uca.access_level, u.name AS created_by_name
FROM dbo.FP26_user_company_access uca
INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
LEFT  JOIN dbo.FP26_users     u ON u.id = c.created_by_user_id
WHERE uca.user_id = @AccountantId
  AND uca.status  = 'active'
  AND c.is_active = 1
ORDER BY c.name;", con);
                cmd.Parameters.Add("@AccountantId", SqlDbType.BigInt).Value = accountantId;
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapCompany(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public bool RespondToAccessRequest(long requestId, long accountantUserId, bool accept)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(@"
UPDATE dbo.FP26_user_company_access
SET status             = @Status,
    access_level       = CASE WHEN @Accept = 1 THEN 'full' ELSE access_level END,
    granted_at         = CASE WHEN @Accept = 1 THEN GETDATE() ELSE granted_at END,
    revoked_at         = CASE WHEN @Accept = 0 THEN GETDATE() ELSE revoked_at END,
    revoked_by_user_id = CASE WHEN @Accept = 0 THEN @AccountantUserId ELSE revoked_by_user_id END
WHERE id      = @RequestId
  AND user_id = @AccountantUserId
  AND status  = 'pending';
SELECT @@ROWCOUNT;", con);
                cmd.Parameters.Add("@RequestId", SqlDbType.BigInt).Value = requestId;
                cmd.Parameters.Add("@AccountantUserId", SqlDbType.BigInt).Value = accountantUserId;
                cmd.Parameters.Add("@Status", SqlDbType.VarChar, 50).Value = accept ? "active" : "revoked";
                cmd.Parameters.Add("@Accept", SqlDbType.Bit).Value = accept;
                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static CompanyRow MapCompany(SqlDataReader r)
        {
            var row = new CompanyRow
            {
                Id                 = r.GetInt64OrDefault("id"),
                Name               = r.GetStringOrDefault("name", string.Empty),
                RegistrationNumber = r.GetStringOrNull("registration_number"),
                Street             = r.GetStringOrNull("street"),
                City               = r.GetStringOrNull("city"),
                State              = r.GetStringOrNull("state"),
                PostalCode         = r.GetStringOrNull("postal_code"),
                Country            = r.GetStringOrDefault("country", "USA"),
                Email              = r.GetStringOrNull("email"),
                Phone              = r.GetStringOrNull("phone"),
                Website            = r.GetStringOrNull("website"),
                TaxId              = r.GetStringOrNull("tax_id"),
                VatNumber          = r.GetStringOrNull("vat_number"),
                Currency           = r.GetStringOrDefault("currency", "USD"),
                IsActive           = r.GetBoolOrDefault("is_active", true),
                CreatedByUserId    = r.GetInt64OrNull("created_by_user_id"),
                CreatedAt          = r.GetDateTimeOrDefault("created_at", DateTime.MinValue),
                UpdatedAt          = r.GetDateTimeOrDefault("updated_at", DateTime.MinValue),
            };

            if (r.HasColumn("created_by_name"))
                row.CreatedByName = r["created_by_name"] as string;
            if (r.HasColumn("access_level"))
                row.AccessLevel = r["access_level"] as string;
            if (r.HasColumn("fiscal_year_start") && r["fiscal_year_start"] != DBNull.Value)
                row.FiscalYearStart = Convert.ToDateTime(r["fiscal_year_start"]);

            return row;
        }
    }

    // ── Extension used by all mapping helpers ─────────────────────────────────
    internal static class SqlDataReaderExtensions
    {
        internal static bool HasColumn(this SqlDataReader r, string name)
        {
            for (int i = 0; i < r.FieldCount; i++)
                if (r.GetName(i).Equals(name, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        internal static string? GetStringOrNull(this SqlDataReader r, string name)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return null;
            return r[name]?.ToString();
        }

        internal static string GetStringOrDefault(this SqlDataReader r, string name, string defaultValue)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return defaultValue;
            return r[name]?.ToString() ?? defaultValue;
        }

        internal static long GetInt64OrDefault(this SqlDataReader r, string name, long defaultValue = 0)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return defaultValue;
            return Convert.ToInt64(r[name]);
        }

        internal static long? GetInt64OrNull(this SqlDataReader r, string name)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return null;
            return Convert.ToInt64(r[name]);
        }

        internal static bool GetBoolOrDefault(this SqlDataReader r, string name, bool defaultValue)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return defaultValue;
            return Convert.ToBoolean(r[name]);
        }

        internal static DateTime GetDateTimeOrDefault(this SqlDataReader r, string name, DateTime defaultValue)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return defaultValue;
            return Convert.ToDateTime(r[name]);
        }

        internal static decimal? GetDecimalOrNull(this SqlDataReader r, string name)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return null;
            return Convert.ToDecimal(r[name]);
        }

        internal static DateTime? GetDateTimeOrNull(this SqlDataReader r, string name)
        {
            if (!r.HasColumn(name) || r[name] == DBNull.Value) return null;
            return Convert.ToDateTime(r[name]);
        }
    }
}
