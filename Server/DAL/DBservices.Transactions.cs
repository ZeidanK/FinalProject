using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── Transaction row ───────────────────────────────────────────────────────
    public class TransactionRow
    {
        public long      Id                  { get; set; }
        public long      CompanyId           { get; set; }
        public long?     BankAccountId       { get; set; }
        public DateTime  TransactionDate     { get; set; }
        public DateTime? PostedDate          { get; set; }
        public string    Description         { get; set; } = string.Empty;
        public string?   VendorName          { get; set; }
        public decimal   Amount              { get; set; }
        public decimal?  BalanceAfter        { get; set; }
        public string    TransactionType     { get; set; } = string.Empty;
        public string?   Category            { get; set; }
        public decimal?  CategoryConfidence  { get; set; }
        public string?   ReferenceNumber     { get; set; }
        public bool      IsMatched           { get; set; }
        public bool      IsDuplicate         { get; set; }
        public string    Status              { get; set; } = "confirmed";
        public long?     CreatedByUserId     { get; set; }
        public DateTime  CreatedAt           { get; set; }
        public DateTime  UpdatedAt           { get; set; }
    }

    public partial class DBservices
    {
        // ── Transactions ──────────────────────────────────────────────────────

        public List<TransactionRow> GetTransactionsByCompany(
            long companyId, string? type, bool? isMatched,
            DateTime? startDate, DateTime? endDate)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<TransactionRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_GetByCompany", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",  companyId  },
                        { "@Type",       type       },
                        { "@IsMatched",  isMatched  },
                        { "@StartDate",  startDate  },
                        { "@EndDate",    endDate    }
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapTransaction(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public TransactionRow? GetTransactionById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                return reader.Read() ? MapTransaction(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public long CreateTransaction(
            long companyId, DateTime transactionDate, string description,
            decimal amount, string transactionType, long? createdByUserId,
            long? bankAccountId, DateTime? postedDate, decimal? balanceAfter,
            string? category, string? referenceNumber, string? vendorName)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",       companyId       },
                        { "@TransactionDate", transactionDate },
                        { "@Description",     description     },
                        { "@Amount",          amount          },
                        { "@TransactionType", transactionType },
                        { "@CreatedByUserId", createdByUserId },
                        { "@BankAccountId",   bankAccountId   },
                        { "@PostedDate",      postedDate      },
                        { "@BalanceAfter",    balanceAfter    },
                        { "@Category",        category        },
                        { "@ReferenceNumber", referenceNumber },
                        { "@VendorName",      vendorName      }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        /// <summary>
        /// Inserts multiple transactions inside a single SqlTransaction.
        /// Returns the list of new IDs (same order as input).
        /// </summary>
        public List<long> BulkCreateTransactions(
            long companyId, long? createdByUserId,
            IEnumerable<(DateTime date, string description, decimal amount,
                         string type, long? bankAccountId, DateTime? postedDate,
                         decimal? balanceAfter, string? category, string? referenceNumber,
                         string? vendorName)> rows)
        {
            SqlConnection? con = null;
            SqlTransaction? tx = null;
            var ids = new List<long>();
            try
            {
                con = Connect();
                tx  = con.BeginTransaction();

                foreach (var row in rows)
                {
                    var cmd = new SqlCommand("FP26_sp_Transactions_Insert", con, tx)
                    {
                        CommandType    = CommandType.StoredProcedure,
                        CommandTimeout = 10
                    };
                    cmd.Parameters.AddWithValue("@CompanyId",       companyId);
                    cmd.Parameters.AddWithValue("@TransactionDate", row.date);
                    cmd.Parameters.AddWithValue("@Description",     row.description);
                    cmd.Parameters.AddWithValue("@Amount",          row.amount);
                    cmd.Parameters.AddWithValue("@TransactionType", row.type);
                    cmd.Parameters.AddWithValue("@CreatedByUserId", (object?)createdByUserId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@BankAccountId",   (object?)row.bankAccountId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@PostedDate",      (object?)row.postedDate    ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@BalanceAfter",    (object?)row.balanceAfter  ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Category",        (object?)row.category      ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ReferenceNumber", (object?)row.referenceNumber ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@VendorName",      (object?)row.vendorName    ?? DBNull.Value);

                    var result = cmd.ExecuteScalar();
                    ids.Add(result != null ? Convert.ToInt64(result) : 0);
                }

                tx.Commit();
                return ids;
            }
            catch
            {
                tx?.Rollback();
                throw;
            }
            finally { con?.Close(); }
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static TransactionRow MapTransaction(SqlDataReader r) => new()
        {
            Id              = Convert.ToInt64(r["id"]),
            CompanyId       = Convert.ToInt64(r["company_id"]),
            BankAccountId   = r["bank_account_id"]  != DBNull.Value ? Convert.ToInt64(r["bank_account_id"]) : null,
            TransactionDate = Convert.ToDateTime(r["transaction_date"]),
            PostedDate      = r["posted_date"]       != DBNull.Value ? Convert.ToDateTime(r["posted_date"]) : null,
            Description     = r["description"]?.ToString()!,
            VendorName      = r.HasColumn("vendor_name") && r["vendor_name"] != DBNull.Value ? r["vendor_name"] as string : null,
            Amount          = Convert.ToDecimal(r["amount"]),
            BalanceAfter    = r["balance_after"]     != DBNull.Value ? Convert.ToDecimal(r["balance_after"]) : null,
            TransactionType = r["transaction_type"]?.ToString()!,
            Category        = r["category"]          as string,
            CategoryConfidence = r.HasColumn("category_confidence") && r["category_confidence"] != DBNull.Value
                                    ? Convert.ToDecimal(r["category_confidence"]) : null,
            ReferenceNumber = r["reference_number"]  as string,
            IsMatched       = r["is_matched"]        != DBNull.Value && Convert.ToBoolean(r["is_matched"]),
            IsDuplicate     = r["is_duplicate"]      != DBNull.Value && Convert.ToBoolean(r["is_duplicate"]),
            Status          = r["status"]?.ToString() ?? "confirmed",
            CreatedByUserId = r["created_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["created_by_user_id"]) : null,
            CreatedAt       = Convert.ToDateTime(r["created_at"]),
            UpdatedAt       = Convert.ToDateTime(r["updated_at"]),
        };
    }
}
