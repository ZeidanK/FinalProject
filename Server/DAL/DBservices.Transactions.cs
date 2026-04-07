using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
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
            long companyId, long? createdByUserId, TransactionInsertData data)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",        companyId            },
                        { "@TransactionDate",  data.TransactionDate },
                        { "@Description",      data.Description     },
                        { "@Amount",           data.Amount          },
                        { "@TransactionType",  data.TransactionType },
                        { "@CreatedByUserId",  createdByUserId      },
                        { "@PostedDate",       data.PostedDate      },
                        { "@Category",         data.Category        },
                        { "@ReferenceNumber",  data.ReferenceNumber },
                        { "@VendorName",       data.VendorName      },
                        { "@CardLast4",        data.CardLast4       },
                        { "@ChargeAmount",     data.ChargeAmount    },
                        { "@ChargeCurrency",   data.ChargeCurrency  },
                        { "@OriginalCurrency", data.OriginalCurrency },
                        { "@ExchangeRate",     data.ExchangeRate    }
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
            IEnumerable<TransactionInsertData> rows)
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
                    cmd.Parameters.AddWithValue("@CompanyId",        companyId);
                    cmd.Parameters.AddWithValue("@TransactionDate",  row.TransactionDate);
                    cmd.Parameters.AddWithValue("@Description",      row.Description);
                    cmd.Parameters.AddWithValue("@Amount",           row.Amount);
                    cmd.Parameters.AddWithValue("@TransactionType",  row.TransactionType);
                    cmd.Parameters.AddWithValue("@CreatedByUserId",  (object?)createdByUserId       ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@PostedDate",       (object?)row.PostedDate        ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Category",         (object?)row.Category          ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ReferenceNumber",  (object?)row.ReferenceNumber   ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@VendorName",       (object?)row.VendorName        ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@CardLast4",        (object?)row.CardLast4         ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ChargeAmount",     (object?)row.ChargeAmount      ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ChargeCurrency",   (object?)row.ChargeCurrency    ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@OriginalCurrency", (object?)row.OriginalCurrency  ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ExchangeRate",     (object?)row.ExchangeRate      ?? DBNull.Value);

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

        public bool DeleteTransaction(long id)
        {
            SqlConnection? con = null;
            SqlTransaction? tx = null;
            try
            {
                con = Connect();
                tx = con.BeginTransaction();

                var existsCmd = new SqlCommand(
                    "SELECT COUNT(1) FROM dbo.FP26_transactions WHERE id = @Id",
                    con,
                    tx);
                existsCmd.Parameters.AddWithValue("@Id", id);

                if (Convert.ToInt32(existsCmd.ExecuteScalar()) <= 0)
                {
                    tx.Rollback();
                    return false;
                }

                var cleanupCmd = new SqlCommand(@"
                    DECLARE @AffectedInvoices TABLE (invoice_id BIGINT PRIMARY KEY);

                    INSERT INTO @AffectedInvoices(invoice_id)
                    SELECT DISTINCT invoice_id
                    FROM dbo.FP26_invoice_transaction_matches
                    WHERE transaction_id = @TransactionId;

                    DELETE FROM dbo.FP26_invoice_transaction_matches
                    WHERE transaction_id = @TransactionId;

                    UPDATE i
                    SET
                        is_matched = CASE
                            WHEN EXISTS (
                                SELECT 1
                                FROM dbo.FP26_invoice_transaction_matches m
                                WHERE m.invoice_id = i.id
                            ) THEN 1 ELSE 0 END,
                        matched_amount = ISNULL((
                            SELECT SUM(m2.matched_amount)
                            FROM dbo.FP26_invoice_transaction_matches m2
                            WHERE m2.invoice_id = i.id
                        ), 0),
                        status = CASE
                            WHEN EXISTS (
                                SELECT 1
                                FROM dbo.FP26_invoice_transaction_matches m3
                                WHERE m3.invoice_id = i.id
                            ) THEN 'matched'
                            WHEN i.status = 'matched' THEN 'verified'
                            ELSE i.status
                        END,
                        updated_at = GETDATE()
                    FROM dbo.FP26_invoices i
                    INNER JOIN @AffectedInvoices a ON a.invoice_id = i.id;

                    DELETE FROM dbo.FP26_transactions
                    WHERE id = @TransactionId;
                ", con, tx);
                cleanupCmd.Parameters.AddWithValue("@TransactionId", id);
                var deletedRows = cleanupCmd.ExecuteNonQuery();

                tx.Commit();
                return deletedRows > 0;
            }
            catch
            {
                tx?.Rollback();
                throw;
            }
            finally
            {
                tx?.Dispose();
                con?.Close();
            }
        }

        public (List<long> DeletedIds, List<long> NotFoundIds) BulkDeleteTransactions(IEnumerable<long> ids)
        {
            var deletedIds = new List<long>();
            var notFoundIds = new List<long>();

            foreach (var id in ids)
            {
                if (DeleteTransaction(id))
                    deletedIds.Add(id);
                else
                    notFoundIds.Add(id);
            }

            return (deletedIds, notFoundIds);
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static TransactionRow MapTransaction(SqlDataReader r) => new()
        {
            Id               = Convert.ToInt64(r["id"]),
            CompanyId        = Convert.ToInt64(r["company_id"]),
            TransactionDate  = Convert.ToDateTime(r["transaction_date"]),
            PostedDate       = r.GetDateTimeOrNull("posted_date"),
            Description      = r["description"]?.ToString()!,
            VendorName       = r.GetStringOrNull("vendor_name"),
            CardLast4        = r.GetStringOrNull("card_last4"),
            Amount           = Convert.ToDecimal(r["amount"]),
            TransactionType  = r["transaction_type"]?.ToString()!,
            Category         = r.GetStringOrNull("category"),
            CategoryConfidence = r.GetDecimalOrNull("category_confidence"),
            ReferenceNumber  = r.GetStringOrNull("reference_number"),
            ChargeAmount     = r.GetDecimalOrNull("charge_amount"),
            ChargeCurrency   = r.GetStringOrNull("charge_currency"),
            OriginalCurrency = r.GetStringOrNull("original_currency"),
            ExchangeRate     = r.GetDecimalOrNull("exchange_rate"),
            IsMatched        = r.GetBoolOrDefault("is_matched",  false),
            IsAnomaly        = r.GetBoolOrDefault("is_anomaly",  false),
            IsDuplicate      = r.GetBoolOrDefault("is_duplicate", false),
            Status           = r.GetStringOrDefault("status", "confirmed"),
            CreatedByUserId  = r.GetInt64OrNull("created_by_user_id"),
            CreatedAt        = Convert.ToDateTime(r["created_at"]),
            UpdatedAt        = Convert.ToDateTime(r["updated_at"]),
        };
    }
}
