using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Transactions ──────────────────────────────────────────────────────

        public virtual List<TransactionRow> GetTransactionsByCompany(
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

        public virtual TransactionRow? GetTransactionById(long id)
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

        public virtual long CreateTransaction(
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
                        { "@ExchangeRate",     data.ExchangeRate    },
                        { "@FileUploadId",     data.FileUploadId    },
                    { "@RequiresInvoice",  data.RequiresInvoice }
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
        public virtual List<long> BulkCreateTransactions(
            long companyId, long? createdByUserId,
            IEnumerable<TransactionInsertData> rows,
            long? fileUploadId = null)
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
                    cmd.Parameters.AddWithValue("@FileUploadId",     (object?)(fileUploadId ?? row.FileUploadId) ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@RequiresInvoice", row.RequiresInvoice);

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

        public virtual bool DeleteTransaction(long id)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_DeleteCascade", con,
                    new Dictionary<string, object?> { { "@TransactionId", id } });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual (List<long> DeletedIds, List<long> NotFoundIds) BulkDeleteTransactions(IEnumerable<long> ids)
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
            RequiresInvoice  = r.GetBoolOrDefault("requires_invoice", true),
            IsMatched        = r.GetBoolOrDefault("is_matched",  false),
            IsAnomaly        = r.GetBoolOrDefault("is_anomaly",  false),
            IsDuplicate      = r.GetBoolOrDefault("is_duplicate", false),
            Status           = r.GetStringOrDefault("status", "confirmed"),
            CreatedByUserId  = r.GetInt64OrNull("created_by_user_id"),
            CreatedByName    = r.GetStringOrNull("created_by_name"),
            FileUploadId     = r.GetInt64OrNull("file_upload_id"),
            CreatedAt        = Convert.ToDateTime(r["created_at"]),
            UpdatedAt        = Convert.ToDateTime(r["updated_at"]),
        };

        public virtual bool SetTransactionRequiresInvoice(long id, bool requiresInvoice)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_SetRequiresInvoice", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", id },
                        { "@RequiresInvoice", requiresInvoice }
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual int CountTransactionsByFileUploadId(long fileUploadId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(
                    "SELECT COUNT(1) FROM dbo.FP26_transactions WHERE file_upload_id = @FileUploadId", con);
                cmd.Parameters.AddWithValue("@FileUploadId", fileUploadId);
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
            finally { con?.Close(); }
        }

        public virtual List<TransactionRow> GetTransactionsByFileUploadIds(List<long> fileUploadIds)
        {
            if (fileUploadIds == null || fileUploadIds.Count == 0)
                return new List<TransactionRow>();

            var idsParam = string.Join(",", fileUploadIds.Select((_, i) => $"@id{i}"));
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var list = new List<TransactionRow>();
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(
                    $"SELECT * FROM dbo.FP26_transactions WHERE file_upload_id IN ({idsParam})", con);
                for (var i = 0; i < fileUploadIds.Count; i++)
                    cmd.Parameters.AddWithValue($"@id{i}", fileUploadIds[i]);

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapTransaction(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }
    }
}
