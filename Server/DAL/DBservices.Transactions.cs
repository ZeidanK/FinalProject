using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Transactions ──────────────────────────────────────────────────────

        public virtual TransactionFilterOptionsResponse GetTransactionFilterOptions(long companyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var result = new TransactionFilterOptionsResponse();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_GetFilterOptions", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();

                while (reader.Read())
                    result.Types.Add(reader.GetString(0));

                reader.NextResult();
                while (reader.Read())
                    result.Categories.Add(reader.GetString(0));

                return result;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public virtual PagedResponse<TransactionRow> GetTransactionsByCompany(
            long companyId, TransactionFilterRequest filter)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<TransactionRow>();
            int totalCount = 0;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_GetByCompany", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",       companyId              },
                        { "@Type",            filter.Type            },
                        { "@IsMatched",       filter.IsMatched       },
                        { "@StartDate",       filter.StartDate       },
                        { "@EndDate",         filter.EndDate         },
                        { "@PageNumber",      filter.PageNumber      },
                        { "@PageSize",        filter.PageSize        },
                        { "@SortBy",          filter.SortBy          },
                        { "@SortDirection",   filter.SortDirection   },
                        { "@SearchTerm",      filter.SearchTerm      },
                        { "@RequiresInvoice", filter.RequiresInvoice },
                        { "@Category",        filter.Category        },
                    });

                reader = cmd.ExecuteReader();

                // First result set: total count
                if (reader.Read())
                    totalCount = Convert.ToInt32(reader[0]);

                // Second result set: data rows
                reader.NextResult();
                while (reader.Read())
                    list.Add(MapTransaction(reader));

                return new PagedResponse<TransactionRow>
                {
                    Items = list,
                    TotalCount = totalCount,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                };
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

        public virtual List<long> GetTransactionIdsByCompany(long companyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var ids = new List<long>();
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(
                    "SELECT id FROM dbo.FP26_transactions WHERE company_id = @CompanyId", con);
                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    ids.Add(Convert.ToInt64(reader[0]));
                return ids;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public virtual TransactionSummaryResponse GetTransactionSummary(long companyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var result = new TransactionSummaryResponse();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Transactions_GetSummary", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();

                // 1. Overall summary
                if (reader.Read())
                {
                    result.Overall = new OverallSummary
                    {
                        TotalCount   = Convert.ToInt32(reader["total_count"]),
                        TotalAmount  = Convert.ToDecimal(reader["total_amount"]),
                        TotalDebits  = Convert.ToDecimal(reader["total_debits"]),
                        TotalCredits = Convert.ToDecimal(reader["total_credits"]),
                        AvgAmount    = Convert.ToDecimal(reader["avg_amount"]),
                    };
                }

                // 2. By transaction type
                reader.NextResult();
                while (reader.Read())
                {
                    result.ByType.Add(new TypeBreakdownItem
                    {
                        TransactionType = reader["transaction_type"]?.ToString() ?? string.Empty,
                        Count           = Convert.ToInt32(reader["count"]),
                        SumAmount       = Convert.ToDecimal(reader["sum_amount"]),
                    });
                }

                // 3. By category
                reader.NextResult();
                while (reader.Read())
                {
                    result.ByCategory.Add(new CategoryBreakdownItem
                    {
                        Category  = reader["category"]?.ToString() ?? "Uncategorized",
                        Count     = Convert.ToInt32(reader["count"]),
                        SumAmount = Convert.ToDecimal(reader["sum_amount"]),
                    });
                }

                // 4. Monthly breakdown
                reader.NextResult();
                while (reader.Read())
                {
                    result.Monthly.Add(new MonthlyBreakdownItem
                    {
                        Year      = Convert.ToInt32(reader["year"]),
                        Month     = Convert.ToInt32(reader["month"]),
                        Count     = Convert.ToInt32(reader["count"]),
                        SumAmount = Convert.ToDecimal(reader["sum_amount"]),
                    });
                }

                // 5. Top vendors
                reader.NextResult();
                while (reader.Read())
                {
                    result.TopVendors.Add(new VendorSummaryItem
                    {
                        VendorName = reader["vendor_name"]?.ToString() ?? "Unknown",
                        Count      = Convert.ToInt32(reader["count"]),
                        SumAmount  = Convert.ToDecimal(reader["sum_amount"]),
                    });
                }

                // 6. Status summary
                reader.NextResult();
                if (reader.Read())
                {
                    result.Status = new StatusSummaryItem
                    {
                        MatchedCount        = Convert.ToInt32(reader["matched_count"]),
                        AnomalyCount        = Convert.ToInt32(reader["anomaly_count"]),
                        DuplicateCount      = Convert.ToInt32(reader["duplicate_count"]),
                        RequiresInvoiceCount = Convert.ToInt32(reader["requires_invoice_count"]),
                        WithoutInvoiceCount = Convert.ToInt32(reader["without_invoice_count"]),
                    };
                }

                return result;
            }
            finally { reader?.Close(); con?.Close(); }
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
