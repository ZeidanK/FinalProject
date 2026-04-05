using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── Company row ───────────────────────────────────────────────────────────
    public class CompanyRow
    {
        public long    Id                 { get; set; }
        public string  Name               { get; set; } = string.Empty;
        public string? RegistrationNumber { get; set; }
        public string? Street             { get; set; }
        public string? City               { get; set; }
        public string? State              { get; set; }
        public string? PostalCode         { get; set; }
        public string  Country            { get; set; } = "USA";
        public string? Email              { get; set; }
        public string? Phone              { get; set; }
        public string? Website            { get; set; }
        public string? TaxId              { get; set; }
        public string? VatNumber          { get; set; }
        public DateTime? FiscalYearStart  { get; set; }
        public string  Currency           { get; set; } = "USD";
        public bool    IsActive           { get; set; } = true;
        public long?   CreatedByUserId    { get; set; }
        public string? CreatedByName      { get; set; }
        public string? AccessLevel        { get; set; }
        public DateTime CreatedAt         { get; set; }
        public DateTime UpdatedAt         { get; set; }
    }

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
    }
}
