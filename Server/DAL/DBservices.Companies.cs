using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Companies ─────────────────────────────────────────────────────────

        public virtual List<CompanyRow> GetAllCompanies()
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

        public virtual CompanyRow? GetCompanyById(long id)
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

        public virtual List<CompanyRow> GetCompaniesByUserId(long userId)
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

        public virtual bool UserHasActiveCompanyAccess(long userId, long companyId)
        {
            if (userId <= 0 || companyId <= 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_CheckUserAccess", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@CompanyId", companyId }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value;
            }
            finally { con?.Close(); }
        }

        public virtual bool EnsureUserHasFullCompanyAccess(long userId, long companyId)
        {
            if (userId <= 0 || companyId <= 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_UpsertUserAccess", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", userId },
                        { "@CompanyId", companyId },
                        { "@GrantedByUserId", userId }
                    });
                cmd.ExecuteNonQuery();
                return true;
            }
            finally { con?.Close(); }
        }

        public virtual long CreateCompany(
            string name, long createdByUserId,
            string? registrationNumber, string? street, string? city,
            string? state, string? postalCode, string country,
            string? email, string? phone,
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

                var accessCmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_GrantCreatorAccess", con,
                    new Dictionary<string, object?>
                    {
                        { "@UserId", createdByUserId },
                        { "@CompanyId", companyId }
                    });
                accessCmd.Transaction = tx;
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

        public virtual bool UpdateCompany(
            long id, string? name, string? street, string? city,
            string? state, string? postalCode, string? country,
            string? email, string? phone,
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

        public virtual (bool Success, string Error) CreatePendingAccessRequest(
            long accountantUserId, long companyId, long requestedByUserId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_CreatePendingRequest", con,
                    new Dictionary<string, object?>
                    {
                        { "@AccountantUserId", accountantUserId },
                        { "@CompanyId", companyId },
                        { "@RequestedByUserId", requestedByUserId }
                    });

                var result = cmd.ExecuteScalar()?.ToString();
                if (result == "already_active")
                    return (false, "This accountant is already working with your company.");
                if (result == "already_pending")
                    return (false, "A request is already pending for this accountant.");
                return (true, string.Empty);
            }
            finally { con?.Close(); }
        }

        public virtual List<AccessRequestRow> GetPendingRequestsByAccountant(long accountantId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<AccessRequestRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_GetPendingRequests", con,
                    new Dictionary<string, object?> { { "@AccountantId", accountantId } });
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
                        OwnerEmail        = reader.GetStringOrNull("owner_email"),
                        OwnerPhone        = reader.GetStringOrNull("owner_phone"),
                        OwnerProfilePicture = reader.GetStringOrNull("owner_profile_picture"),
                        CompanyEmail      = reader.GetStringOrNull("company_email"),
                        CompanyPhone      = reader.GetStringOrNull("company_phone"),
                        CompanyStreet     = reader.GetStringOrNull("company_street"),
                        CompanyCity       = reader.GetStringOrNull("company_city"),
                        CompanyState      = reader.GetStringOrNull("company_state"),
                        CompanyCountry    = reader.GetStringOrNull("company_country"),
                        CompanyRegistrationNumber = reader.GetStringOrNull("company_registration_number"),
                        CompanyTaxId      = reader.GetStringOrNull("company_tax_id"),
                        CreatedAt         = Convert.ToDateTime(reader["created_at"]),
                        Status            = reader["status"]?.ToString() ?? "pending",
                    });
                }
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public virtual List<CompanyRow> GetActiveCompaniesByAccountant(long accountantId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<CompanyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_GetActiveByAccountant", con,
                    new Dictionary<string, object?> { { "@AccountantId", accountantId } });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapCompany(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public virtual bool RespondToAccessRequest(long requestId, long accountantUserId, bool accept)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_RespondToRequest", con,
                    new Dictionary<string, object?>
                    {
                        { "@RequestId", requestId },
                        { "@AccountantUserId", accountantUserId },
                        { "@Accept", accept }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool CancelPendingAccessRequest(long accountantUserId, long companyId, long requestedByUserId)
        {
            if (accountantUserId <= 0 || companyId <= 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_CancelPendingRequest", con,
                    new Dictionary<string, object?>
                    {
                        { "@AccountantUserId", accountantUserId },
                        { "@CompanyId", companyId },
                        { "@RequestedByUserId", requestedByUserId }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool DisconnectAccountantFromCompany(long accountantUserId, long companyId, long requestedByUserId)
        {
            if (accountantUserId <= 0 || companyId <= 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Companies_RevokeAccess", con,
                    new Dictionary<string, object?>
                    {
                        { "@AccountantUserId", accountantUserId },
                        { "@CompanyId", companyId },
                        { "@RequestedByUserId", requestedByUserId }
                    });
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
