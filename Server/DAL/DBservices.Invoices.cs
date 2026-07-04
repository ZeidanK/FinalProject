using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Invoices ──────────────────────────────────────────────────────────

        public virtual List<InvoiceRow> GetInvoicesByCompany(
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

        public virtual InvoiceRow? GetInvoiceById(long id)
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

    public virtual long CreateInvoice(
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
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_GetIdByNumber", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@InvoiceNumber", invoiceNumber }
                    });
                var result = cmd.ExecuteScalar();
                return result != null && result != DBNull.Value ? Convert.ToInt64(result) : null;
            }
            finally { con?.Close(); }
        }

        public virtual long CreateLineItem(
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

        public virtual bool UpdateInvoiceStatus(long id, string status)
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

        public virtual bool MarkInvoiceVerified(long id, long verifiedByUserId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_MarkVerified", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", id },
                        { "@VerifiedByUserId", verifiedByUserId }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally
            {
                con?.Close();
            }
        }

        public virtual bool UpdateInvoiceFileInfo(long id, string? fileOriginalName, string? filePath,
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

        public virtual bool UpdateInvoice(
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
            try
            {
                con = Connect();
                var lineItemsJson = System.Text.Json.JsonSerializer.Serialize(
                    lineItems.Select(li => new
                    {
                        li.LineNumber,
                        li.Description,
                        li.Category,
                        li.Quantity,
                        li.UnitPrice,
                        li.VatRate,
                        li.TotalAmount,
                        li.AiConfidenceScore
                    }));

                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_UpdateWithLineItems", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", id },
                        { "@CompanyId", companyId },
                        { "@InvoiceNumber", invoiceNumber },
                        { "@VendorName", vendorName },
                        { "@InvoiceDate", invoiceDate },
                        { "@TotalAmount", totalAmount },
                        { "@VendorTaxId", (object?)vendorTaxId ?? DBNull.Value },
                        { "@DueDate", (object?)dueDate ?? DBNull.Value },
                        { "@PaymentDate", (object?)paymentDate ?? DBNull.Value },
                        { "@Subtotal", subtotal },
                        { "@VatRate", (object?)vatRate ?? DBNull.Value },
                        { "@VatAmount", (object?)vatAmount ?? DBNull.Value },
                        { "@Currency", currency },
                        { "@FileOriginalName", (object?)fileOriginalName ?? DBNull.Value },
                        { "@FilePath", (object?)filePath ?? DBNull.Value },
                        { "@FileType", (object?)fileType ?? DBNull.Value },
                        { "@FileSize", (object?)fileSize ?? DBNull.Value },
                        { "@AiExtractionConfidence", (object?)aiConfidence ?? DBNull.Value },
                        { "@LastFourDigitsCard", (object?)lastFourDigitsCard ?? DBNull.Value },
                        { "@ItemCount", (object?)itemCount ?? lineItems.Count },
                        { "@PaymentPlanTotalInstallments", (object?)paymentPlanTotalInstallments ?? DBNull.Value },
                        { "@PaymentPlanInstallmentAmount", (object?)paymentPlanInstallmentAmount ?? DBNull.Value },
                        { "@PaymentPlanFrequency", (object?)paymentPlanFrequency ?? DBNull.Value },
                        { "@PaymentPlanDescription", (object?)paymentPlanDescription ?? DBNull.Value },
                        { "@PaymentPlanCurrentInstallment", (object?)paymentPlanCurrentInstallment ?? DBNull.Value },
                        { "@VerifiedByUserId", (object?)verifiedByUserId ?? DBNull.Value },
                        { "@LineItemsJson", lineItemsJson }
                    });

                var result = cmd.ExecuteScalar();
                return result != null && Convert.ToInt32(result) > 0;
            }
            finally { con?.Close(); }
        }

        /// <summary>
        /// Get all unmatched invoices for a company (for batch auto-matching).
        /// </summary>
        public List<InvoiceRow> GetUnmatchedInvoicesByCompany(long companyId)
        {
            return GetInvoicesByCompany(companyId, null, null, null, isMatched: false);
        }

        public virtual bool DeleteInvoice(long id)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Invoices_DeleteCascade", con,
                    new Dictionary<string, object?> { { "@InvoiceId", id } });
                var deletedRows = Convert.ToInt32(cmd.ExecuteScalar());
                return deletedRows > 0;
            }
            finally { con?.Close(); }
        }

        public virtual (List<long> DeletedIds, List<long> NotFoundIds) BulkDeleteInvoices(IEnumerable<long> ids)
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
