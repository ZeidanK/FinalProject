using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Anomalies ─────────────────────────────────────────────────────────

        public List<AnomalyRow> GetAnomaliesByCompany(
            long companyId, string? status, string? severity, string? type,
            string? searchTerm = null)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<AnomalyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetByCompany", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",  companyId  },
                        { "@Status",     status     },
                        { "@Severity",   severity   },
                        { "@Type",       type       },
                        { "@SearchTerm", searchTerm }
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapAnomaly(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public AnomalyRow? GetAnomalyById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                return reader.Read() ? MapAnomaly(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public long CreateAnomaly(
            long companyId, string anomalyType, string title,
            string description, string severity, string? suggestedAction,
            long? relatedInvoiceId, long? relatedTransactionId,
            long? relatedMatchId, decimal? amount,
            string detectionMethod, decimal? detectionConfidence)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",             companyId            },
                        { "@AnomalyType",           anomalyType          },
                        { "@Title",                 title                },
                        { "@Description",           description          },
                        { "@Severity",              severity             },
                        { "@SuggestedAction",       suggestedAction      },
                        { "@RelatedInvoiceId",      relatedInvoiceId     },
                        { "@RelatedTransactionId",  relatedTransactionId },
                        { "@RelatedMatchId",        relatedMatchId       },
                        { "@Amount",                amount               },
                        { "@DetectionMethod",       detectionMethod      },
                        { "@DetectionConfidence",   detectionConfidence  }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public bool ResolveAnomaly(
            long id, long resolvedByUserId,
            string? resolutionNotes, string status)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_Resolve", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",                id                },
                        { "@ResolvedByUserId",  resolvedByUserId  },
                        { "@ResolutionNotes",   resolutionNotes   },
                        { "@Status",            status            }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public bool ResolveAnomalies(
            IEnumerable<long> ids,
            long resolvedByUserId,
            string? resolutionNotes,
            string status)
        {
            var normalizedIds = ids
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (normalizedIds.Count == 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var rowsAffected = 0;
                foreach (var id in normalizedIds)
                {
                    var cmd = CreateCommandWithStoredProcedure(
                        "FP26_sp_Anomalies_ResolveBulk", con,
                        new Dictionary<string, object?>
                        {
                            { "@Id", id },
                            { "@Status", status },
                            { "@ResolvedByUserId", resolvedByUserId },
                            { "@ResolutionNotes", (object?)resolutionNotes ?? DBNull.Value }
                        });

                    rowsAffected += Convert.ToInt32(cmd.ExecuteScalar());
                }

                return rowsAffected > 0;
            }
            finally { con?.Close(); }
        }

        public bool ApplyDuplicateInvoiceDecision(
            IEnumerable<long> anomalyIds,
            IEnumerable<long> invoiceIds,
            long keepInvoiceId,
            long resolvedByUserId,
            string? resolutionNotes)
        {
            var normalizedAnomalyIds = anomalyIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var normalizedInvoiceIds = invoiceIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (normalizedAnomalyIds.Count == 0
                || normalizedInvoiceIds.Count <= 1
                || !normalizedInvoiceIds.Contains(keepInvoiceId))
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var invoiceIdsJson = System.Text.Json.JsonSerializer.Serialize(normalizedInvoiceIds);

                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_ApplyDuplicateDecision", con,
                    new Dictionary<string, object?>
                    {
                        { "@InvoiceIdsJson", invoiceIdsJson },
                        { "@KeepInvoiceId", keepInvoiceId },
                        { "@ResolvedByUserId", resolvedByUserId },
                        { "@ResolutionNotes", (object?)resolutionNotes ?? DBNull.Value }
                    });
                cmd.ExecuteNonQuery();
                return true;
            }
            finally { con?.Close(); }
        }

        public bool RestoreDuplicateInvoices(IEnumerable<long> invoiceIds)
        {
            var normalizedIds = invoiceIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (normalizedIds.Count == 0)
                return false;

            SqlConnection? con = null;
            try
            {
                con = Connect();
                var rowsAffected = 0;
                foreach (var invoiceId in normalizedIds)
                {
                    var cmd = CreateCommandWithStoredProcedure(
                        "FP26_sp_Invoices_RestoreDeleted", con,
                        new Dictionary<string, object?> { { "@InvoiceId", invoiceId } });
                    rowsAffected += Convert.ToInt32(cmd.ExecuteScalar());
                }

                return rowsAffected > 0;
            }
            finally { con?.Close(); }
        }

        public long? GetOpenDuplicateInvoiceAnomalyId(
            long companyId,
            string invoiceNumber,
            decimal totalAmount,
            DateTime invoiceDate)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetOpenDuplicateId", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@InvoiceNumber", invoiceNumber },
                        { "@TotalAmount", totalAmount },
                        { "@InvoiceDate", invoiceDate.Date }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value
                    ? Convert.ToInt64(result)
                    : null;
            }
            finally { con?.Close(); }
        }

        public virtual List<AnomalyRow> GetDuplicateInvoiceAnomaliesBySignature(
            long companyId,
            string invoiceNumber,
            decimal totalAmount,
            DateTime invoiceDate,
            string? status)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<AnomalyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetByDuplicateSignature", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@InvoiceNumber", invoiceNumber },
                        { "@TotalAmount", totalAmount },
                        { "@InvoiceDate", invoiceDate.Date },
                        { "@Status", (object?)status ?? DBNull.Value }
                    });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    rows.Add(MapAnomaly(reader));

                return rows;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public virtual List<InvoiceRow> GetDuplicateInvoicesBySignature(
            long companyId,
            string invoiceNumber,
            decimal totalAmount,
            DateTime invoiceDate,
            bool includeDeleted = true,
            DateTime? createdBefore = null)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<InvoiceRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_GetDuplicatesBySignature", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@InvoiceNumber", invoiceNumber },
                        { "@TotalAmount", totalAmount },
                        { "@InvoiceDate", invoiceDate.Date },
                        { "@IncludeDeleted", includeDeleted },
                        { "@CreatedBefore", (object?)createdBefore ?? DBNull.Value }
                    });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    rows.Add(MapInvoice(reader));

                return rows;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public void EnsureTransactionFileUploadsTable()
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = new SqlCommand(
                    @"IF OBJECT_ID('dbo.FP26_transaction_file_uploads', 'U') IS NULL
                      BEGIN
                          CREATE TABLE dbo.FP26_transaction_file_uploads
                          (
                              id BIGINT NOT NULL IDENTITY(1,1) PRIMARY KEY,
                              company_id BIGINT NOT NULL,
                              file_hash_sha256 VARCHAR(64) NOT NULL,
                              file_original_name VARCHAR(255) NULL,
                              file_path VARCHAR(500) NULL,
                              file_size BIGINT NULL,
                              uploaded_by_user_id BIGINT NULL,
                              anomaly_id BIGINT NULL,
                              created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
                              CONSTRAINT FK_FP26_tfu_company FOREIGN KEY (company_id) REFERENCES dbo.FP26_companies(id) ON DELETE CASCADE,
                              CONSTRAINT FK_FP26_tfu_user FOREIGN KEY (uploaded_by_user_id) REFERENCES dbo.FP26_users(id) ON DELETE SET NULL,
                              CONSTRAINT FK_FP26_tfu_anomaly FOREIGN KEY (anomaly_id) REFERENCES dbo.FP26_anomalies(id) ON DELETE SET NULL
                          );

                          CREATE INDEX IX_FP26_tfu_company_hash ON dbo.FP26_transaction_file_uploads(company_id, file_hash_sha256);
                          CREATE INDEX IX_FP26_tfu_anomaly ON dbo.FP26_transaction_file_uploads(anomaly_id);
                      END",
                    con);

                cmd.ExecuteNonQuery();
            }
            finally { con?.Close(); }
        }

        public long CreateTransactionFileUpload(
            long companyId,
            string fileHashSha256,
            string? fileOriginalName,
            string? filePath,
            long? fileSize,
            long? uploadedByUserId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@FileHash", fileHashSha256 },
                        { "@FileOriginalName", (object?)fileOriginalName ?? DBNull.Value },
                        { "@FilePath", (object?)filePath ?? DBNull.Value },
                        { "@FileSize", (object?)fileSize ?? DBNull.Value },
                        { "@UploadedByUserId", (object?)uploadedByUserId ?? DBNull.Value }
                    });
                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public int CountTransactionFileUploadsByHash(long companyId, string fileHashSha256)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_CountByHash", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@FileHash", fileHashSha256 }
                    });
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
            finally { con?.Close(); }
        }

        public long? GetOpenDuplicateFileAnomalyId(long companyId, string fileHashSha256)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetOpenDuplicateFileId", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@FileHash", fileHashSha256 }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value
                    ? Convert.ToInt64(result)
                    : null;
            }
            finally { con?.Close(); }
        }

        public bool AssignTransactionFileUploadAnomaly(long uploadId, long anomalyId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_SetAnomaly", con,
                    new Dictionary<string, object?>
                    {
                        { "@UploadId", uploadId },
                        { "@AnomalyId", anomalyId }
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public virtual List<TransactionFileUploadRow> GetTransactionFileUploadsByAnomalyId(long anomalyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<TransactionFileUploadRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_GetByAnomaly", con,
                    new Dictionary<string, object?> { { "@AnomalyId", anomalyId } });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    rows.Add(new TransactionFileUploadRow
                    {
                        Id = Convert.ToInt64(reader["id"]),
                        CompanyId = Convert.ToInt64(reader["company_id"]),
                        FileHashSha256 = reader["file_hash_sha256"]?.ToString() ?? string.Empty,
                        FileOriginalName = reader["file_original_name"] as string,
                        FilePath = reader["file_path"] as string,
                        FileSize = reader["file_size"] != DBNull.Value ? Convert.ToInt64(reader["file_size"]) : null,
                        UploadedByUserId = reader["uploaded_by_user_id"] != DBNull.Value ? Convert.ToInt64(reader["uploaded_by_user_id"]) : null,
                        CreatedAt = Convert.ToDateTime(reader["created_at"]),
                        AnomalyId = reader["anomaly_id"] != DBNull.Value ? Convert.ToInt64(reader["anomaly_id"]) : null,
                    });
                }

                return rows;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public virtual List<TransactionFileUploadRow> GetTransactionFileUploadsByHash(
            long companyId,
            string fileHashSha256,
            DateTime? createdBefore = null)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<TransactionFileUploadRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_GetByHash", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@FileHash", fileHashSha256 },
                        { "@CreatedBefore", (object?)createdBefore ?? DBNull.Value }
                    });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    rows.Add(new TransactionFileUploadRow
                    {
                        Id = Convert.ToInt64(reader["id"]),
                        CompanyId = Convert.ToInt64(reader["company_id"]),
                        FileHashSha256 = reader["file_hash_sha256"]?.ToString() ?? string.Empty,
                        FileOriginalName = reader["file_original_name"] as string,
                        FilePath = reader["file_path"] as string,
                        FileSize = reader["file_size"] != DBNull.Value ? Convert.ToInt64(reader["file_size"]) : null,
                        UploadedByUserId = reader["uploaded_by_user_id"] != DBNull.Value ? Convert.ToInt64(reader["uploaded_by_user_id"]) : null,
                        CreatedAt = Convert.ToDateTime(reader["created_at"]),
                        AnomalyId = reader["anomaly_id"] != DBNull.Value ? Convert.ToInt64(reader["anomaly_id"]) : null,
                    });
                }

                return rows;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public string? GetClosestTransactionFileHash(long companyId, DateTime anomalyCreatedAt)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_GetClosestHash", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@AnomalyCreatedAt", anomalyCreatedAt }
                    });
                var result = cmd.ExecuteScalar();
                return result == null || result == DBNull.Value ? null : result.ToString();
            }
            finally { con?.Close(); }
        }

        public bool AssignTransactionFileUploadsByHashAnomaly(
            long companyId,
            string fileHashSha256,
            long anomalyId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_AssignAnomalyByHash", con,
                    new Dictionary<string, object?>
                    {
                        { "@AnomalyId", anomalyId },
                        { "@CompanyId", companyId },
                        { "@FileHash", fileHashSha256 }
                    });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public TransactionFileUploadRow? GetTransactionFileUploadById(long uploadId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_GetById", con,
                    new Dictionary<string, object?> { { "@UploadId", uploadId } });
                reader = cmd.ExecuteReader();
                if (!reader.Read())
                    return null;

                return new TransactionFileUploadRow
                {
                    Id = Convert.ToInt64(reader["id"]),
                    CompanyId = Convert.ToInt64(reader["company_id"]),
                    FileHashSha256 = reader["file_hash_sha256"]?.ToString() ?? string.Empty,
                    FileOriginalName = reader["file_original_name"] as string,
                    FilePath = reader["file_path"] as string,
                    FileSize = reader["file_size"] != DBNull.Value ? Convert.ToInt64(reader["file_size"]) : null,
                    UploadedByUserId = reader["uploaded_by_user_id"] != DBNull.Value ? Convert.ToInt64(reader["uploaded_by_user_id"]) : null,
                    CreatedAt = Convert.ToDateTime(reader["created_at"]),
                    AnomalyId = reader["anomaly_id"] != DBNull.Value ? Convert.ToInt64(reader["anomaly_id"]) : null,
                };
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public bool DeleteTransactionFileUpload(long uploadId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_TransactionFileUploads_DeleteCascade", con,
                    new Dictionary<string, object?> { { "@UploadId", uploadId } });
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public List<AnomalyRow> GetDuplicateFileAnomaliesByHash(long companyId, string fileHashSha256, string? status)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<AnomalyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetDuplicateFileByHash", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@FileHash", fileHashSha256 },
                        { "@Status", (object?)status ?? DBNull.Value }
                    });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    rows.Add(MapAnomaly(reader));

                return rows;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public AnomalyStatsRow GetAnomalyStats(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var stats = new AnomalyStatsRow();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetStats", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();

                // First result set — by status
                while (reader.Read())
                    stats.ByStatus[reader["status"]?.ToString()!] = Convert.ToInt32(reader["count"]);

                // Second result set — by severity
                if (reader.NextResult())
                    while (reader.Read())
                        stats.BySeverity[reader["severity"]?.ToString()!] = Convert.ToInt32(reader["count"]);

                return stats;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static AnomalyRow MapAnomaly(SqlDataReader r) => new()
        {
            Id                   = Convert.ToInt64(r["id"]),
            CompanyId            = Convert.ToInt64(r["company_id"]),
            AnomalyType          = r["anomaly_type"]?.ToString()!,
            Title                = r["title"]?.ToString()!,
            Description          = r["description"]?.ToString()!,
            Severity             = r["severity"]?.ToString() ?? "warning",
            Status               = r["status"]?.ToString()   ?? "open",
            SuggestedAction      = r["suggested_action"]          as string,
            RelatedInvoiceId     = r["related_invoice_id"]     != DBNull.Value ? Convert.ToInt64(r["related_invoice_id"])     : null,
            RelatedTransactionId = r["related_transaction_id"] != DBNull.Value ? Convert.ToInt64(r["related_transaction_id"]) : null,
            RelatedMatchId       = r["related_match_id"]       != DBNull.Value ? Convert.ToInt64(r["related_match_id"])       : null,
            Amount               = r["amount"]                 != DBNull.Value ? Convert.ToDecimal(r["amount"])               : null,
            DetectionMethod      = r["detection_method"]?.ToString()   ?? "ai",
            DetectionConfidence  = r["detection_confidence"]   != DBNull.Value ? Convert.ToDecimal(r["detection_confidence"]) : null,
            ResolvedByUserId     = r["resolved_by_user_id"]    != DBNull.Value ? Convert.ToInt64(r["resolved_by_user_id"])    : null,
            ResolvedByName       = r.HasColumn("resolved_by_name") ? r["resolved_by_name"] as string : null,
            ResolutionNotes      = r["resolution_notes"]           as string,
            ResolvedAt           = r["resolved_at"]            != DBNull.Value ? Convert.ToDateTime(r["resolved_at"]) : null,
            CreatedAt            = Convert.ToDateTime(r["created_at"]),
            UpdatedAt            = Convert.ToDateTime(r["updated_at"]),
        };
    }
}
