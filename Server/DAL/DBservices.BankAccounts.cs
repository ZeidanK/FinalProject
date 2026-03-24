using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── BankAccount row ───────────────────────────────────────────────────────
    public class BankAccountRow
    {
        public long      Id                    { get; set; }
        public long      CompanyId             { get; set; }
        public string    BankName              { get; set; } = string.Empty;
        public string?   AccountName           { get; set; }
        public string?   AccountNumberMasked   { get; set; }
        public string    AccountType           { get; set; } = string.Empty;
        public string    Currency              { get; set; } = "USD";
        public bool      IsActive              { get; set; } = true;
        public DateTime? LastSyncAt            { get; set; }
        public decimal   Balance               { get; set; }
        public long?     CreatedByUserId       { get; set; }
        public string?   CreatedByName         { get; set; }
        public DateTime  CreatedAt             { get; set; }
        public DateTime  UpdatedAt             { get; set; }
    }

    public partial class DBservices
    {
        // ── Bank Accounts ─────────────────────────────────────────────────────

        public List<BankAccountRow> GetBankAccountsByCompany(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<BankAccountRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_BankAccounts_GetByCompany", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapBankAccount(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public BankAccountRow? GetBankAccountById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_BankAccounts_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                return reader.Read() ? MapBankAccount(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public long CreateBankAccount(
            long companyId, string bankName, string accountType,
            long? createdByUserId, string? accountName,
            string? accountNumberMasked, string currency, decimal balance)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_BankAccounts_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",           companyId           },
                        { "@BankName",            bankName            },
                        { "@AccountType",         accountType         },
                        { "@CreatedByUserId",     createdByUserId     },
                        { "@AccountName",         accountName         },
                        { "@AccountNumberMasked", accountNumberMasked },
                        { "@Currency",            currency            },
                        { "@Balance",             balance             }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public bool UpdateBankAccount(
            long id, string? bankName, string? accountName,
            string? accountNumberMasked, string? accountType,
            string? currency, bool? isActive, decimal? balance,
            DateTime? lastSyncAt)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_BankAccounts_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",                  id                  },
                        { "@BankName",            bankName            },
                        { "@AccountName",         accountName         },
                        { "@AccountNumberMasked", accountNumberMasked },
                        { "@AccountType",         accountType         },
                        { "@Currency",            currency            },
                        { "@IsActive",            isActive            },
                        { "@Balance",             balance             },
                        { "@LastSyncAt",          lastSyncAt          }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public bool SoftDeleteBankAccount(long id)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_BankAccounts_SoftDelete", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static BankAccountRow MapBankAccount(SqlDataReader r) => new()
        {
            Id                  = Convert.ToInt64(r["id"]),
            CompanyId           = Convert.ToInt64(r["company_id"]),
            BankName            = r["bank_name"]?.ToString()!,
            AccountName         = r["account_name"]         as string,
            AccountNumberMasked = r["account_number_masked"] as string,
            AccountType         = r["account_type"]?.ToString()!,
            Currency            = r["currency"]?.ToString() ?? "USD",
            IsActive            = r["is_active"] != DBNull.Value && Convert.ToBoolean(r["is_active"]),
            LastSyncAt          = r["last_sync_at"] != DBNull.Value ? Convert.ToDateTime(r["last_sync_at"]) : null,
            Balance             = r["balance"] != DBNull.Value ? Convert.ToDecimal(r["balance"]) : 0,
            CreatedByUserId     = r["created_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["created_by_user_id"]) : null,
            CreatedByName       = r.HasColumn("created_by_name") ? r["created_by_name"] as string : null,
            CreatedAt           = r["created_at"] != DBNull.Value ? Convert.ToDateTime(r["created_at"]) : DateTime.MinValue,
            UpdatedAt           = r["updated_at"] != DBNull.Value ? Convert.ToDateTime(r["updated_at"]) : DateTime.MinValue,
        };
    }
}
