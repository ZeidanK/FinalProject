using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Invoices ──────────────────────────────────────────────────────────

        public List<InvoiceRow> GetInvoicesByCompany(
            long companyId, string? status, DateTime? startDate,
            DateTime? endDate, bool? isMatched)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<InvoiceRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_GetByCompany", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",  companyId  },
                        { "@Status",     status     },
                        { "@StartDate",  startDate  },
                        { "@EndDate",    endDate    },
                        { "@IsMatched",  isMatched  }
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapInvoice(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public InvoiceRow? GetInvoiceById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                if (!reader.Read()) return null;

                var invoice = MapInvoice(reader);

                // Second result set — line items
                if (reader.NextResult())
                    while (reader.Read())
                        invoice.LineItems.Add(MapLineItem(reader));

                return invoice;
            }
            finally { reader?.Close(); con?.Close(); }
        }

    public long CreateInvoice(
        long companyId, string invoiceNumber, string vendorName,
        DateTime invoiceDate, decimal totalAmount, long? uploadedByUserId,
        string? vendorTaxId, DateTime? dueDate, DateTime? paymentDate,
        decimal subtotal, decimal? vatRate, decimal? vatAmount,
        string currency, string? fileOriginalName, string? filePath,
        string? fileType, long? fileSize, decimal? aiConfidence,
        string? lastFourDigitsCard, int? itemCount = null,
        int? paymentPlanTotalInstallments = null,
        decimal? paymentPlanInstallmentAmount = null,
        string? paymentPlanFrequency = null,
        string? paymentPlanDescription = null,
        int? paymentPlanCurrentInstallment = null,
        bool isDuplicate = false)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",               companyId          },
                        { "@InvoiceNumber",            invoiceNumber      },
                        { "@VendorName",               vendorName         },
                        { "@InvoiceDate",              invoiceDate        },
                        { "@TotalAmount",              totalAmount        },
                        { "@UploadedByUserId",         uploadedByUserId   },
                        { "@VendorTaxId",              vendorTaxId        },
                        { "@DueDate",                  dueDate            },
                        { "@PaymentDate",              paymentDate        },
                        { "@Subtotal",                 subtotal           },
                        { "@VatRate",                  vatRate            },
                        { "@VatAmount",                vatAmount          },
                        { "@Currency",                 currency           },
                        { "@FileOriginalName",         fileOriginalName   },
                        { "@FilePath",                 filePath           },
                        { "@FileType",                 fileType           },
                        { "@FileSize",                 fileSize           },
                        { "@AiExtractionConfidence",   aiConfidence       },
                        { "@LastFourDigitsCard",       lastFourDigitsCard },
                        { "@ItemCount",                itemCount          },
                        { "@PaymentPlanTotalInstallments",  paymentPlanTotalInstallments  },
                        { "@PaymentPlanInstallmentAmount", paymentPlanInstallmentAmount },
                        { "@PaymentPlanFrequency",          paymentPlanFrequency         },
                        { "@PaymentPlanDescription",        paymentPlanDescription       },
                        { "@PaymentPlanCurrentInstallment", paymentPlanCurrentInstallment },
                        { "@IsDuplicate",                   isDuplicate                  }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        /// <summary>
        /// Returns the ID of the original (non-duplicate) invoice for a given
        /// company + invoice number, or null if none exists.
        /// </summary>
        public long? GetInvoiceIdByNumber(long companyId, string invoiceNumber)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = new SqlCommand(
                    "SELECT TOP 1 id FROM dbo.FP26_invoices " +
                    "WHERE company_id = @CompanyId AND invoice_number = @InvoiceNumber AND is_duplicate = 0",
                    con);
                cmd.Parameters.AddWithValue("@CompanyId", companyId);
                cmd.Parameters.AddWithValue("@InvoiceNumber", invoiceNumber);
                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value ? Convert.ToInt64(result) : null;
            }
            finally { con?.Close(); }
        }

        public long CreateLineItem(
            long invoiceId, string description, decimal unitPrice,
            decimal totalAmount, int? lineNumber, string? category,
            decimal quantity, decimal? vatRate, decimal? aiConfidenceScore)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_InvoiceLineItems_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@InvoiceId",         invoiceId         },
                        { "@Description",       description       },
                        { "@UnitPrice",         unitPrice         },
                        { "@TotalAmount",       totalAmount       },
                        { "@LineNumber",        lineNumber        },
                        { "@Category",          category          },
                        { "@Quantity",          quantity          },
                        { "@VatRate",           vatRate           },
                        { "@AiConfidenceScore", aiConfidenceScore }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public bool UpdateInvoiceStatus(long id, string status)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_UpdateStatus", con,
                    new Dictionary<string, object?> { { "@Id", id }, { "@Status", status } });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public bool UpdateInvoiceFileInfo(long id, string? fileOriginalName, string? filePath,
            string? fileType, long? fileSize, decimal? aiConfidence)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_UpdateFileInfo", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",                     id               },
                        { "@FileOriginalName",       fileOriginalName },
                        { "@FilePath",               filePath         },
                        { "@FileType",               fileType         },
                        { "@FileSize",               fileSize         },
                        { "@AiExtractionConfidence", aiConfidence     }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public bool UpdateInvoice(
            long id,
            long companyId,
            string invoiceNumber,
            string vendorName,
            DateTime invoiceDate,
            decimal totalAmount,
            string? vendorTaxId,
            DateTime? dueDate,
            DateTime? paymentDate,
            decimal subtotal,
            decimal? vatRate,
            decimal? vatAmount,
            string currency,
            string? fileOriginalName,
            string? filePath,
            string? fileType,
            long? fileSize,
            decimal? aiConfidence,
            string? lastFourDigitsCard,
            int? itemCount,
            int? paymentPlanTotalInstallments,
            decimal? paymentPlanInstallmentAmount,
            string? paymentPlanFrequency,
            string? paymentPlanDescription,
            int? paymentPlanCurrentInstallment,
            long? verifiedByUserId,
            List<CreateLineItemRequest> lineItems)
        {
            SqlConnection? con = null;
            SqlTransaction? tx = null;
            try
            {
                con = Connect();
                tx = con.BeginTransaction();

                var updateCmd = new SqlCommand(@"
                    UPDATE dbo.FP26_invoices
                    SET
                        company_id = @CompanyId,
                        invoice_number = @InvoiceNumber,
                        vendor_name = @VendorName,
                        invoice_date = @InvoiceDate,
                        total_amount = @TotalAmount,
                        vendor_tax_id = @VendorTaxId,
                        due_date = @DueDate,
                        payment_date = @PaymentDate,
                        subtotal = @Subtotal,
                        vat_rate = @VatRate,
                        vat_amount = @VatAmount,
                        currency = @Currency,
                        file_original_name = @FileOriginalName,
                        file_path = @FilePath,
                        file_type = @FileType,
                        file_size = @FileSize,
                        ai_extraction_confidence = @AiExtractionConfidence,
                        ai_processed = CASE WHEN @AiExtractionConfidence IS NULL THEN ai_processed ELSE 1 END,
                        last_four_digits_card = @LastFourDigitsCard,
                        item_count = @ItemCount,
                        payment_plan_total_installments = @PaymentPlanTotalInstallments,
                        payment_plan_installment_amount = @PaymentPlanInstallmentAmount,
                        payment_plan_frequency = @PaymentPlanFrequency,
                        payment_plan_description = @PaymentPlanDescription,
                        payment_plan_current_installment = @PaymentPlanCurrentInstallment,
                        verified_by_user_id = COALESCE(@VerifiedByUserId, verified_by_user_id),
                        is_verified = 1,
                        status = CASE WHEN status = 'matched' THEN status ELSE 'verified' END,
                        updated_at = GETDATE()
                    WHERE id = @Id", con, tx);

                updateCmd.Parameters.AddWithValue("@Id", id);
                updateCmd.Parameters.AddWithValue("@CompanyId", companyId);
                updateCmd.Parameters.AddWithValue("@InvoiceNumber", invoiceNumber);
                updateCmd.Parameters.AddWithValue("@VendorName", vendorName);
                updateCmd.Parameters.AddWithValue("@InvoiceDate", invoiceDate);
                updateCmd.Parameters.AddWithValue("@TotalAmount", totalAmount);
                updateCmd.Parameters.AddWithValue("@VendorTaxId", (object?)vendorTaxId ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@DueDate", (object?)dueDate ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@PaymentDate", (object?)paymentDate ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@Subtotal", subtotal);
                updateCmd.Parameters.AddWithValue("@VatRate", (object?)vatRate ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@VatAmount", (object?)vatAmount ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@Currency", currency);
                updateCmd.Parameters.AddWithValue("@FileOriginalName", (object?)fileOriginalName ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@FilePath", (object?)filePath ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@FileType", (object?)fileType ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@FileSize", (object?)fileSize ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@AiExtractionConfidence", (object?)aiConfidence ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@LastFourDigitsCard", (object?)lastFourDigitsCard ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@ItemCount", (object?)itemCount ?? lineItems.Count);
                updateCmd.Parameters.AddWithValue("@PaymentPlanTotalInstallments", (object?)paymentPlanTotalInstallments ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@PaymentPlanInstallmentAmount", (object?)paymentPlanInstallmentAmount ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@PaymentPlanFrequency", (object?)paymentPlanFrequency ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@PaymentPlanDescription", (object?)paymentPlanDescription ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@PaymentPlanCurrentInstallment", (object?)paymentPlanCurrentInstallment ?? DBNull.Value);
                updateCmd.Parameters.AddWithValue("@VerifiedByUserId", (object?)verifiedByUserId ?? DBNull.Value);

                var rows = updateCmd.ExecuteNonQuery();
                if (rows <= 0)
                {
                    tx.Rollback();
                    return false;
                }

                var deleteItemsCmd = new SqlCommand(
                    "DELETE FROM dbo.FP26_invoice_line_items WHERE invoice_id = @InvoiceId",
                    con,
                    tx);
                deleteItemsCmd.Parameters.AddWithValue("@InvoiceId", id);
                deleteItemsCmd.ExecuteNonQuery();

                foreach (var li in lineItems)
                {
                    var insertItemCmd = new SqlCommand(@"
                        INSERT INTO dbo.FP26_invoice_line_items
                            (invoice_id, line_number, description, category, quantity, unit_price, vat_rate, total_amount, ai_confidence_score)
                        VALUES
                            (@InvoiceId, @LineNumber, @Description, @Category, @Quantity, @UnitPrice, @VatRate, @TotalAmount, @AiConfidenceScore)", con, tx);

                    insertItemCmd.Parameters.AddWithValue("@InvoiceId", id);
                    insertItemCmd.Parameters.AddWithValue("@LineNumber", (object?)li.LineNumber ?? DBNull.Value);
                    insertItemCmd.Parameters.AddWithValue("@Description", li.Description);
                    insertItemCmd.Parameters.AddWithValue("@Category", (object?)li.Category ?? DBNull.Value);
                    insertItemCmd.Parameters.AddWithValue("@Quantity", li.Quantity);
                    insertItemCmd.Parameters.AddWithValue("@UnitPrice", li.UnitPrice);
                    insertItemCmd.Parameters.AddWithValue("@VatRate", (object?)li.VatRate ?? DBNull.Value);
                    insertItemCmd.Parameters.AddWithValue("@TotalAmount", li.TotalAmount);
                    insertItemCmd.Parameters.AddWithValue("@AiConfidenceScore", (object?)li.AiConfidenceScore ?? DBNull.Value);
                    insertItemCmd.ExecuteNonQuery();
                }

                tx.Commit();
                return true;
            }
            catch
            {
                tx?.Rollback();
                return false;
            }
            finally
            {
                tx?.Dispose();
                con?.Close();
            }
        }

        /// <summary>
        /// Get all unmatched invoices for a company (for batch auto-matching).
        /// </summary>
        public List<InvoiceRow> GetUnmatchedInvoicesByCompany(long companyId)
        {
            return GetInvoicesByCompany(companyId, null, null, null, isMatched: false);
        }

        public bool DeleteInvoice(long id)
        {
            SqlConnection? con = null;
            SqlTransaction? tx = null;
            try
            {
                con = Connect();
                tx = con.BeginTransaction();

                var cleanupCmd = new SqlCommand(@"
                    DECLARE @CompanyId BIGINT;
                    DECLARE @InvoiceNumber NVARCHAR(255);
                    DECLARE @TotalAmount DECIMAL(18, 2);
                    DECLARE @InvoiceDate DATE;
                    DECLARE @ReplacementInvoiceId BIGINT;
                    DECLARE @ActiveGroupCount INT;
                    DECLARE @DeletedRows INT = 0;
                    DECLARE @AffectedMatches TABLE (match_id BIGINT PRIMARY KEY);
                    DECLARE @AffectedTransactions TABLE (transaction_id BIGINT PRIMARY KEY);
                    DECLARE @AffectedDuplicateAnomalies TABLE (anomaly_id BIGINT PRIMARY KEY);

                    SELECT
                        @CompanyId = company_id,
                        @InvoiceNumber = invoice_number,
                        @TotalAmount = total_amount,
                        @InvoiceDate = CONVERT(date, invoice_date)
                    FROM dbo.FP26_invoices
                    WHERE id = @InvoiceId;

                    IF @CompanyId IS NULL
                    BEGIN
                        SELECT @DeletedRows;
                        RETURN;
                    END

                    INSERT INTO @AffectedMatches(match_id)
                    SELECT id
                    FROM dbo.FP26_invoice_transaction_matches
                    WHERE invoice_id = @InvoiceId;

                    INSERT INTO @AffectedTransactions(transaction_id)
                    SELECT DISTINCT transaction_id
                    FROM dbo.FP26_invoice_transaction_matches
                    WHERE invoice_id = @InvoiceId;

                    INSERT INTO @AffectedDuplicateAnomalies(anomaly_id)
                    SELECT a.id
                    FROM dbo.FP26_anomalies a
                    INNER JOIN dbo.FP26_invoices i ON i.id = a.related_invoice_id
                    WHERE a.company_id = @CompanyId
                      AND a.anomaly_type = 'duplicate'
                      AND i.invoice_number = @InvoiceNumber
                      AND i.total_amount = @TotalAmount
                      AND CONVERT(date, i.invoice_date) = @InvoiceDate;

                    SELECT TOP 1 @ReplacementInvoiceId = id
                    FROM dbo.FP26_invoices
                    WHERE company_id = @CompanyId
                      AND invoice_number = @InvoiceNumber
                      AND total_amount = @TotalAmount
                      AND CONVERT(date, invoice_date) = @InvoiceDate
                      AND id <> @InvoiceId
                    ORDER BY
                        CASE WHEN status = 'deleted' THEN 1 ELSE 0 END,
                        created_at ASC,
                        id ASC;

                    UPDATE dbo.FP26_anomalies
                    SET
                        related_invoice_id = @ReplacementInvoiceId,
                        updated_at = GETDATE()
                    WHERE anomaly_type = 'duplicate'
                      AND related_invoice_id = @InvoiceId;

                    DELETE FROM dbo.FP26_anomalies
                    WHERE (related_invoice_id = @InvoiceId AND anomaly_type <> 'duplicate')
                       OR related_match_id IN (SELECT match_id FROM @AffectedMatches);

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

                    DELETE FROM dbo.FP26_invoices
                    WHERE id = @InvoiceId;
                    SET @DeletedRows = @@ROWCOUNT;

                    -- Keep exactly one active invoice as the canonical record. This is
                    -- required by the filtered unique index and by duplicate detection.
                    UPDATE dbo.FP26_invoices
                    SET is_duplicate = 1, updated_at = GETDATE()
                    WHERE company_id = @CompanyId
                      AND invoice_number = @InvoiceNumber
                      AND total_amount = @TotalAmount
                      AND CONVERT(date, invoice_date) = @InvoiceDate
                      AND status <> 'deleted';

                    SET @ReplacementInvoiceId = NULL;
                    SELECT TOP 1 @ReplacementInvoiceId = id
                    FROM dbo.FP26_invoices
                    WHERE company_id = @CompanyId
                      AND invoice_number = @InvoiceNumber
                      AND total_amount = @TotalAmount
                      AND CONVERT(date, invoice_date) = @InvoiceDate
                      AND status <> 'deleted'
                    ORDER BY created_at ASC, id ASC;

                    IF @ReplacementInvoiceId IS NOT NULL
                    BEGIN
                        UPDATE dbo.FP26_invoices
                        SET is_duplicate = 0, updated_at = GETDATE()
                        WHERE id = @ReplacementInvoiceId;
                    END

                    SELECT @ActiveGroupCount = COUNT(1)
                    FROM dbo.FP26_invoices
                    WHERE company_id = @CompanyId
                      AND invoice_number = @InvoiceNumber
                      AND total_amount = @TotalAmount
                      AND CONVERT(date, invoice_date) = @InvoiceDate
                      AND status <> 'deleted';

                    IF @ActiveGroupCount < 2
                    BEGIN
                        DELETE a
                        FROM dbo.FP26_anomalies a
                        INNER JOIN @AffectedDuplicateAnomalies affected ON affected.anomaly_id = a.id
                        WHERE a.anomaly_type = 'duplicate'
                          AND a.status = 'open'
                          AND a.company_id = @CompanyId;
                    END
                    ELSE
                    BEGIN
                        UPDATE a
                        SET
                            related_invoice_id = @ReplacementInvoiceId,
                            updated_at = GETDATE()
                        FROM dbo.FP26_anomalies a
                        INNER JOIN @AffectedDuplicateAnomalies affected ON affected.anomaly_id = a.id
                        WHERE a.anomaly_type = 'duplicate'
                          AND a.status = 'open'
                          AND a.company_id = @CompanyId;
                    END

                    SELECT @DeletedRows;
                ", con, tx);
                cleanupCmd.Parameters.AddWithValue("@InvoiceId", id);
                var deletedRows = Convert.ToInt32(cleanupCmd.ExecuteScalar());

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

        public (List<long> DeletedIds, List<long> NotFoundIds) BulkDeleteInvoices(IEnumerable<long> ids)
        {
            var deletedIds = new List<long>();
            var notFoundIds = new List<long>();

            foreach (var id in ids)
            {
                if (DeleteInvoice(id))
                    deletedIds.Add(id);
                else
                    notFoundIds.Add(id);
            }

            return (deletedIds, notFoundIds);
        }

        // ── Mapping helpers ───────────────────────────────────────────────────

        private static InvoiceRow MapInvoice(SqlDataReader r) => new()
        {
            Id                     = Convert.ToInt64(r["id"]),
            CompanyId              = Convert.ToInt64(r["company_id"]),
            InvoiceNumber          = r["invoice_number"]?.ToString()!,
            VendorName             = r["vendor_name"]?.ToString()!,
            VendorTaxId            = r["vendor_tax_id"]           as string,
            InvoiceDate            = Convert.ToDateTime(r["invoice_date"]),
            DueDate                = r["due_date"]      != DBNull.Value ? Convert.ToDateTime(r["due_date"])      : null,
            PaymentDate            = r["payment_date"]  != DBNull.Value ? Convert.ToDateTime(r["payment_date"])  : null,
            Subtotal               = r["subtotal"]      != DBNull.Value ? Convert.ToDecimal(r["subtotal"])       : 0,
            VatRate                = r["vat_rate"]      != DBNull.Value ? Convert.ToDecimal(r["vat_rate"])       : null,
            VatAmount              = r["vat_amount"]    != DBNull.Value ? Convert.ToDecimal(r["vat_amount"])     : null,
            TotalAmount            = Convert.ToDecimal(r["total_amount"]),
            Currency               = r["currency"]?.ToString() ?? "USD",
            FileOriginalName       = r["file_original_name"] as string,
            FilePath               = r["file_path"]          as string,
            FileType               = r["file_type"]          as string,
            FileSize               = r.HasColumn("file_size") && r["file_size"] != DBNull.Value ? Convert.ToInt64(r["file_size"]) : null,
            Status                 = r["status"]?.ToString() ?? "uploaded",
            AiExtractionConfidence = r.HasColumn("ai_extraction_confidence") && r["ai_extraction_confidence"] != DBNull.Value ? Convert.ToDecimal(r["ai_extraction_confidence"]) : null,
            AiProcessed            = r.HasColumn("ai_processed") && r["ai_processed"] != DBNull.Value && Convert.ToBoolean(r["ai_processed"]),
            IsVerified             = r.HasColumn("is_verified")  && r["is_verified"]  != DBNull.Value && Convert.ToBoolean(r["is_verified"]),
            IsMatched              = r["is_matched"] != DBNull.Value && Convert.ToBoolean(r["is_matched"]),
            MatchedAmount          = r["matched_amount"] != DBNull.Value ? Convert.ToDecimal(r["matched_amount"]) : 0,
            LastFourDigitsCard     = r.HasColumn("last_four_digits_card") ? r["last_four_digits_card"] as string : null,
            PaymentPlanTotalInstallments = r.HasColumn("payment_plan_total_installments") && r["payment_plan_total_installments"] != DBNull.Value
                                        ? Convert.ToInt32(r["payment_plan_total_installments"]) : null,
            PaymentPlanInstallmentAmount = r.HasColumn("payment_plan_installment_amount") && r["payment_plan_installment_amount"] != DBNull.Value
                                        ? Convert.ToDecimal(r["payment_plan_installment_amount"]) : null,
            PaymentPlanFrequency     = r.HasColumn("payment_plan_frequency") ? r["payment_plan_frequency"] as string : null,
            PaymentPlanDescription   = r.HasColumn("payment_plan_description") ? r["payment_plan_description"] as string : null,
            PaymentPlanCurrentInstallment = r.HasColumn("payment_plan_current_installment") && r["payment_plan_current_installment"] != DBNull.Value
                                        ? Convert.ToInt32(r["payment_plan_current_installment"]) : null,
            UploadedByUserId       = r["uploaded_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["uploaded_by_user_id"]) : null,
            UploadedByName         = r.HasColumn("uploaded_by_name") ? r["uploaded_by_name"] as string : null,
            VerifiedByUserId       = r.HasColumn("verified_by_user_id") && r["verified_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["verified_by_user_id"]) : null,
            IsDuplicate            = r.HasColumn("is_duplicate") && r["is_duplicate"] != DBNull.Value && Convert.ToBoolean(r["is_duplicate"]),
            CreatedAt              = Convert.ToDateTime(r["created_at"]),
            UpdatedAt              = Convert.ToDateTime(r["updated_at"]),
        };

        private static LineItemRow MapLineItem(SqlDataReader r) => new()
        {
            Id               = Convert.ToInt64(r["id"]),
            InvoiceId        = Convert.ToInt64(r["invoice_id"]),
            LineNumber       = r["line_number"]        != DBNull.Value ? Convert.ToInt32(r["line_number"])          : null,
            Description      = r["description"]?.ToString()!,
            Category         = r["category"]           as string,
            Quantity         = r["quantity"]           != DBNull.Value ? Convert.ToDecimal(r["quantity"])           : 1,
            UnitPrice        = Convert.ToDecimal(r["unit_price"]),
            VatRate          = r["vat_rate"]           != DBNull.Value ? Convert.ToDecimal(r["vat_rate"])           : null,
            TotalAmount      = Convert.ToDecimal(r["total_amount"]),
            AiConfidenceScore = r["ai_confidence_score"] != DBNull.Value ? Convert.ToDecimal(r["ai_confidence_score"]) : null,
        };
    }
}
