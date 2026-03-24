using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── Invoice row ───────────────────────────────────────────────────────────
    public class InvoiceRow
    {
        public long      Id                       { get; set; }
        public long      CompanyId                { get; set; }
        public string    InvoiceNumber            { get; set; } = string.Empty;
        public string    VendorName               { get; set; } = string.Empty;
        public string?   VendorTaxId              { get; set; }
        public DateTime  InvoiceDate              { get; set; }
        public DateTime? DueDate                  { get; set; }
        public DateTime? PaymentDate              { get; set; }
        public decimal   Subtotal                 { get; set; }
        public decimal?  VatRate                  { get; set; }
        public decimal?  VatAmount                { get; set; }
        public decimal   TotalAmount              { get; set; }
        public string    Currency                 { get; set; } = "USD";
        public string?   FileOriginalName         { get; set; }
        public string?   FilePath                 { get; set; }
        public string?   FileType                 { get; set; }
        public long?     FileSize                 { get; set; }
        public string    Status                   { get; set; } = "uploaded";
        public decimal?  AiExtractionConfidence   { get; set; }
        public bool      AiProcessed              { get; set; }
        public bool      IsVerified               { get; set; }
        public bool      IsMatched                { get; set; }
        public decimal   MatchedAmount            { get; set; }
        public string?   LastFourDigitsCard       { get; set; }
        public long?     UploadedByUserId         { get; set; }
        public string?   UploadedByName           { get; set; }
        public long?     VerifiedByUserId         { get; set; }
        public DateTime  CreatedAt                { get; set; }
        public DateTime  UpdatedAt                { get; set; }
        public List<LineItemRow> LineItems        { get; set; } = new();
    }

    public class LineItemRow
    {
        public long     Id                 { get; set; }
        public long     InvoiceId          { get; set; }
        public int?     LineNumber         { get; set; }
        public string   Description        { get; set; } = string.Empty;
        public string?  Category           { get; set; }
        public decimal  Quantity           { get; set; } = 1;
        public decimal  UnitPrice          { get; set; }
        public decimal? VatRate            { get; set; }
        public decimal  TotalAmount        { get; set; }
        public decimal? AiConfidenceScore  { get; set; }
    }

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
            string? lastFourDigitsCard)
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
                        { "@LastFourDigitsCard",       lastFourDigitsCard }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
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
            UploadedByUserId       = r["uploaded_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["uploaded_by_user_id"]) : null,
            UploadedByName         = r.HasColumn("uploaded_by_name") ? r["uploaded_by_name"] as string : null,
            VerifiedByUserId       = r.HasColumn("verified_by_user_id") && r["verified_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["verified_by_user_id"]) : null,
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
