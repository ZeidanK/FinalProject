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
            try
            {
                con = Connect();
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

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
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
                Id                 = Convert.ToInt64(r["id"]),
                Name               = r["name"]?.ToString()!,
                RegistrationNumber = r["registration_number"] as string,
                Street             = r["street"]             as string,
                City               = r["city"]               as string,
                State              = r["state"]              as string,
                PostalCode         = r["postal_code"]        as string,
                Country            = r["country"]?.ToString() ?? "USA",
                Email              = r["email"]              as string,
                Phone              = r["phone"]              as string,
                Website            = r["website"]            as string,
                TaxId              = r["tax_id"]             as string,
                VatNumber          = r["vat_number"]         as string,
                Currency           = r["currency"]?.ToString() ?? "USD",
                IsActive           = r["is_active"] != DBNull.Value && Convert.ToBoolean(r["is_active"]),
                CreatedByUserId    = r["created_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["created_by_user_id"]) : null,
                CreatedAt          = r["created_at"] != DBNull.Value ? Convert.ToDateTime(r["created_at"]) : DateTime.MinValue,
                UpdatedAt          = r["updated_at"] != DBNull.Value ? Convert.ToDateTime(r["updated_at"]) : DateTime.MinValue,
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
    }
}
