using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Anomalies ─────────────────────────────────────────────────────────

        public List<AnomalyRow> GetAnomaliesByCompany(
            long companyId, string? status, string? severity, string? type)
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
                        { "@CompanyId", companyId },
                        { "@Status",    status    },
                        { "@Severity",  severity  },
                        { "@Type",      type      }
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
            SqlTransaction? tx = null;
            try
            {
                con = Connect();
                tx = con.BeginTransaction();

                var rowsAffected = 0;
                foreach (var id in normalizedIds)
                {
                    var cmd = new SqlCommand(
                        @"UPDATE dbo.FP26_anomalies
                          SET status = @Status,
                              resolved_by_user_id = CASE WHEN @Status = 'open' THEN NULL ELSE @ResolvedByUserId END,
                              resolution_notes = CASE WHEN @Status = 'open' THEN NULL ELSE @ResolutionNotes END,
                              resolved_at = CASE WHEN @Status = 'open' THEN NULL ELSE GETDATE() END,
                              updated_at = GETDATE()
                          WHERE id = @Id",
                        con,
                        tx);

                    cmd.Parameters.AddWithValue("@Status", status);
                    cmd.Parameters.AddWithValue("@ResolvedByUserId", resolvedByUserId);
                    cmd.Parameters.AddWithValue("@ResolutionNotes", (object?)resolutionNotes ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Id", id);

                    rowsAffected += cmd.ExecuteNonQuery();
                }

                tx.Commit();
                return rowsAffected > 0;
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
            SqlTransaction? tx = null;
            try
            {
                con = Connect();
                tx = con.BeginTransaction();

                foreach (var invoiceId in normalizedInvoiceIds.Where(id => id != keepInvoiceId))
                {
                    var softDeleteCmd = new SqlCommand(@"
                        DECLARE @AffectedTransactions TABLE (transaction_id BIGINT PRIMARY KEY);

                        INSERT INTO @AffectedTransactions(transaction_id)
                        SELECT DISTINCT transaction_id
                        FROM dbo.FP26_invoice_transaction_matches
                        WHERE invoice_id = @InvoiceId;

                        DELETE FROM dbo.FP26_invoice_transaction_matches
                        WHERE invoice_id = @InvoiceId;

                        UPDATE t
                        SET
                            is_matched = CASE
                                WHEN EXISTS (
                                    SELECT 1
                                    FROM dbo.FP26_invoice_transaction_matches m
                                    WHERE m.transaction_id = t.id
                                ) THEN 1 ELSE 0 END,
                            updated_at = GETDATE()
                        FROM dbo.FP26_transactions t
                        INNER JOIN @AffectedTransactions a ON a.transaction_id = t.id;

                        UPDATE dbo.FP26_invoices
                        SET
                            status = 'deleted',
                            is_duplicate = 1,
                            is_matched = 0,
                            matched_amount = 0,
                            updated_at = GETDATE()
                        WHERE id = @InvoiceId;",
                        con,
                        tx);

                    softDeleteCmd.Parameters.AddWithValue("@InvoiceId", invoiceId);
                    softDeleteCmd.ExecuteNonQuery();
                }

                var keepCmd = new SqlCommand(@"
                    UPDATE dbo.FP26_invoices
                    SET
                        status = CASE WHEN status = 'deleted' THEN 'uploaded' ELSE status END,
                        is_duplicate = 0,
                        updated_at = GETDATE()
                    WHERE id = @KeepInvoiceId;",
                    con,
                    tx);

                keepCmd.Parameters.AddWithValue("@KeepInvoiceId", keepInvoiceId);
                if (keepCmd.ExecuteNonQuery() <= 0)
                {
                    tx.Rollback();
                    return false;
                }

                var resolvedRows = 0;
                foreach (var anomalyId in normalizedAnomalyIds)
                {
                    var anomalyCmd = new SqlCommand(@"
                        UPDATE dbo.FP26_anomalies
                        SET
                            status = 'resolved',
                            resolved_by_user_id = @ResolvedByUserId,
                            resolution_notes = @ResolutionNotes,
                            resolved_at = GETDATE(),
                            updated_at = GETDATE()
                        WHERE id = @AnomalyId;",
                        con,
                        tx);

                    anomalyCmd.Parameters.AddWithValue("@ResolvedByUserId", resolvedByUserId);
                    anomalyCmd.Parameters.AddWithValue("@ResolutionNotes", (object?)resolutionNotes ?? DBNull.Value);
                    anomalyCmd.Parameters.AddWithValue("@AnomalyId", anomalyId);
                    resolvedRows += anomalyCmd.ExecuteNonQuery();
                }

                tx.Commit();
                return resolvedRows > 0;
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
                    var cmd = new SqlCommand(@"
                        UPDATE dbo.FP26_invoices
                        SET
                            status = CASE WHEN status = 'deleted' THEN 'uploaded' ELSE status END,
                            updated_at = GETDATE()
                        WHERE id = @InvoiceId;",
                        con);

                    cmd.Parameters.AddWithValue("@InvoiceId", invoiceId);
                    rowsAffected += cmd.ExecuteNonQuery();
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
                var cmd = new SqlCommand(
                    @"SELECT TOP 1 a.id
                      FROM dbo.FP26_anomalies a
                      INNER JOIN dbo.FP26_invoices i ON i.id = a.related_invoice_id
                      WHERE a.company_id = @CompanyId
                        AND a.anomaly_type = 'duplicate'
                        AND a.status = 'open'
                        AND i.invoice_number = @InvoiceNumber
                        AND i.total_amount = @TotalAmount
                        AND CONVERT(date, i.invoice_date) = CONVERT(date, @InvoiceDate)
                      ORDER BY a.created_at ASC",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@InvoiceNumber", invoiceNumber);
                cmd.Parameters.AddWithValue("@TotalAmount", totalAmount);
                cmd.Parameters.AddWithValue("@InvoiceDate", invoiceDate.Date);

                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value
                    ? Convert.ToInt64(result)
                    : null;
            }
            finally { con?.Close(); }
        }

        public List<AnomalyRow> GetDuplicateInvoiceAnomaliesBySignature(
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
                var cmd = new SqlCommand(
                    @"SELECT
                          a.id,
                          a.company_id,
                          a.anomaly_type,
                          a.title,
                          a.description,
                          a.severity,
                          a.status,
                          a.suggested_action,
                          a.related_invoice_id,
                          a.related_transaction_id,
                          a.related_match_id,
                          a.amount,
                          a.detection_method,
                          a.detection_confidence,
                          a.resolved_by_user_id,
                          u.name AS resolved_by_name,
                          a.resolution_notes,
                          a.resolved_at,
                          a.created_at,
                          a.updated_at
                      FROM dbo.FP26_anomalies a
                      INNER JOIN dbo.FP26_invoices i ON i.id = a.related_invoice_id
                      LEFT JOIN dbo.FP26_users u ON u.id = a.resolved_by_user_id
                      WHERE a.company_id = @CompanyId
                        AND a.anomaly_type = 'duplicate'
                        AND i.invoice_number = @InvoiceNumber
                        AND i.total_amount = @TotalAmount
                        AND CONVERT(date, i.invoice_date) = CONVERT(date, @InvoiceDate)
                        AND (@Status IS NULL OR a.status = @Status)
                      ORDER BY a.created_at ASC",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@InvoiceNumber", invoiceNumber);
                cmd.Parameters.AddWithValue("@TotalAmount", totalAmount);
                cmd.Parameters.AddWithValue("@InvoiceDate", invoiceDate.Date);
                cmd.Parameters.AddWithValue("@Status", (object?)status ?? DBNull.Value);

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

        public List<InvoiceRow> GetDuplicateInvoicesBySignature(
            long companyId,
            string invoiceNumber,
            decimal totalAmount,
            DateTime invoiceDate)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<InvoiceRow>();
            try
            {
                con = Connect();
                var cmd = new SqlCommand(
                    @"SELECT
                          i.id,
                          i.company_id,
                          i.invoice_number,
                          i.vendor_name,
                          i.vendor_tax_id,
                          i.invoice_date,
                          i.due_date,
                          i.payment_date,
                          i.subtotal,
                          i.vat_rate,
                          i.vat_amount,
                          i.total_amount,
                          i.currency,
                          i.file_original_name,
                          i.file_path,
                          i.file_type,
                          i.file_size,
                          i.status,
                          i.ai_extraction_confidence,
                          i.ai_processed,
                          i.is_verified,
                          i.is_matched,
                          i.matched_amount,
                          i.last_four_digits_card,
                          i.payment_plan_total_installments,
                          i.payment_plan_installment_amount,
                          i.payment_plan_frequency,
                          i.payment_plan_description,
                          i.uploaded_by_user_id,
                          u.name AS uploaded_by_name,
                          i.verified_by_user_id,
                          i.is_duplicate,
                          i.created_at,
                          i.updated_at
                      FROM dbo.FP26_invoices i
                      LEFT JOIN dbo.FP26_users u ON u.id = i.uploaded_by_user_id
                      WHERE i.company_id = @CompanyId
                        AND i.invoice_number = @InvoiceNumber
                        AND i.total_amount = @TotalAmount
                        AND CONVERT(date, i.invoice_date) = CONVERT(date, @InvoiceDate)
                      ORDER BY
                          CASE WHEN i.status = 'deleted' THEN 1 ELSE 0 END,
                          i.created_at ASC",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@InvoiceNumber", invoiceNumber);
                cmd.Parameters.AddWithValue("@TotalAmount", totalAmount);
                cmd.Parameters.AddWithValue("@InvoiceDate", invoiceDate.Date);

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
                var cmd = new SqlCommand(
                    @"INSERT INTO dbo.FP26_transaction_file_uploads
                        (company_id, file_hash_sha256, file_original_name, file_path, file_size, uploaded_by_user_id, created_at)
                      VALUES
                        (@CompanyId, @FileHash, @FileOriginalName, @FilePath, @FileSize, @UploadedByUserId, GETDATE());
                      SELECT SCOPE_IDENTITY();",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@FileHash", fileHashSha256);
                cmd.Parameters.AddWithValue("@FileOriginalName", (object?)fileOriginalName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FilePath", (object?)filePath ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FileSize", (object?)fileSize ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@UploadedByUserId", (object?)uploadedByUserId ?? DBNull.Value);

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
                var cmd = new SqlCommand(
                    @"SELECT COUNT(1)
                      FROM dbo.FP26_transaction_file_uploads
                      WHERE company_id = @CompanyId AND file_hash_sha256 = @FileHash",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@FileHash", fileHashSha256);

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
                var cmd = new SqlCommand(
                    @"SELECT TOP 1 a.id
                      FROM dbo.FP26_transaction_file_uploads tfu
                      INNER JOIN dbo.FP26_anomalies a ON a.id = tfu.anomaly_id
                      WHERE tfu.company_id = @CompanyId
                        AND tfu.file_hash_sha256 = @FileHash
                        AND a.anomaly_type = 'duplicate_transaction_file'
                        AND a.status = 'open'
                      ORDER BY a.created_at ASC",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@FileHash", fileHashSha256);

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
                var cmd = new SqlCommand(
                    @"UPDATE dbo.FP26_transaction_file_uploads
                      SET anomaly_id = @AnomalyId
                      WHERE id = @UploadId",
                    con);

                cmd.Parameters.AddWithValue("@AnomalyId", anomalyId);
                cmd.Parameters.AddWithValue("@UploadId", uploadId);
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public List<TransactionFileUploadRow> GetTransactionFileUploadsByAnomalyId(long anomalyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<TransactionFileUploadRow>();
            try
            {
                con = Connect();
                var cmd = new SqlCommand(
                    @"SELECT id, company_id, file_hash_sha256, file_original_name, file_path, file_size, uploaded_by_user_id, created_at, anomaly_id
                      FROM dbo.FP26_transaction_file_uploads
                      WHERE anomaly_id = @AnomalyId
                      ORDER BY created_at ASC",
                    con);

                cmd.Parameters.AddWithValue("@AnomalyId", anomalyId);

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

        public TransactionFileUploadRow? GetTransactionFileUploadById(long uploadId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = new SqlCommand(
                    @"SELECT id, company_id, file_hash_sha256, file_original_name, file_path, file_size, uploaded_by_user_id, created_at, anomaly_id
                      FROM dbo.FP26_transaction_file_uploads
                      WHERE id = @UploadId",
                    con);

                cmd.Parameters.AddWithValue("@UploadId", uploadId);

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
                var cmd = new SqlCommand(
                    @"DELETE FROM dbo.FP26_transaction_file_uploads
                      WHERE id = @UploadId",
                    con);

                cmd.Parameters.AddWithValue("@UploadId", uploadId);
                return cmd.ExecuteNonQuery() > 0;
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
                var cmd = new SqlCommand(
                    @"SELECT DISTINCT
                          a.id,
                          a.company_id,
                          a.anomaly_type,
                          a.title,
                          a.description,
                          a.severity,
                          a.status,
                          a.suggested_action,
                          a.related_invoice_id,
                          a.related_transaction_id,
                          a.related_match_id,
                          a.amount,
                          a.detection_method,
                          a.detection_confidence,
                          a.resolved_by_user_id,
                          u.name AS resolved_by_name,
                          a.resolution_notes,
                          a.resolved_at,
                          a.created_at,
                          a.updated_at
                      FROM dbo.FP26_anomalies a
                      INNER JOIN dbo.FP26_transaction_file_uploads tfu ON tfu.anomaly_id = a.id
                      LEFT JOIN dbo.FP26_users u ON u.id = a.resolved_by_user_id
                      WHERE a.company_id = @CompanyId
                        AND a.anomaly_type = 'duplicate_transaction_file'
                        AND tfu.file_hash_sha256 = @FileHash
                        AND (@Status IS NULL OR a.status = @Status)
                      ORDER BY a.created_at ASC",
                    con);

                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@FileHash", fileHashSha256);
                cmd.Parameters.AddWithValue("@Status", (object?)status ?? DBNull.Value);

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
