using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── Report result rows ────────────────────────────────────────────────────
    public class DashboardStatsRow
    {
        // Invoices
        public int     TotalInvoices        { get; set; }
        public int     MatchedInvoices      { get; set; }
        public int     UnmatchedInvoices    { get; set; }
        public int     UploadedInvoices     { get; set; }
        public int     ProcessingInvoices   { get; set; }
        public decimal TotalInvoiceAmount   { get; set; }
        public decimal AvgInvoiceAmount     { get; set; }
        // Transactions
        public int     TotalTransactions    { get; set; }
        public int     MatchedTransactions  { get; set; }
        public int     UnmatchedTransactions { get; set; }
        public decimal TotalTransactionVolume { get; set; }
        public decimal TotalDebits          { get; set; }
        public decimal TotalCredits         { get; set; }
        // Anomalies
        public int     TotalAnomalies       { get; set; }
        public int     OpenAnomalies        { get; set; }
        public int     CriticalAnomalies    { get; set; }
        public int     ResolvedAnomalies    { get; set; }
        // Matches
        public int     TotalMatches         { get; set; }
        public decimal TotalMatchedAmount   { get; set; }
    }

    public class VatReportSummary
    {
        public decimal TotalSubtotal  { get; set; }
        public decimal TotalVat       { get; set; }
        public decimal TotalAmount    { get; set; }
        public int     InvoiceCount   { get; set; }
        public List<VatInvoiceRow> Invoices { get; set; } = new();
    }

    public class VatInvoiceRow
    {
        public long     Id            { get; set; }
        public string   InvoiceNumber { get; set; } = string.Empty;
        public string   VendorName    { get; set; } = string.Empty;
        public DateTime InvoiceDate   { get; set; }
        public decimal  Subtotal      { get; set; }
        public decimal? VatRate       { get; set; }
        public decimal? VatAmount     { get; set; }
        public decimal  TotalAmount   { get; set; }
        public string   Currency      { get; set; } = "USD";
        public string   Status        { get; set; } = string.Empty;
    }

    public class ReconciliationRow
    {
        public long     InvoiceId              { get; set; }
        public string   InvoiceNumber          { get; set; } = string.Empty;
        public string   VendorName             { get; set; } = string.Empty;
        public DateTime InvoiceDate            { get; set; }
        public decimal  InvoiceAmount          { get; set; }
        public string   InvoiceStatus          { get; set; } = string.Empty;
        public bool     IsMatched              { get; set; }
        public long?    MatchId                { get; set; }
        public decimal? MatchedAmount          { get; set; }
        public string?  MatchMethod            { get; set; }
        public decimal? MatchConfidence        { get; set; }
        public long?    TransactionId          { get; set; }
        public DateTime? TransactionDate       { get; set; }
        public string?  TransactionDescription { get; set; }
        public decimal? TransactionAmount      { get; set; }
        public string?  TransactionType        { get; set; }
    }

    public partial class DBservices
    {
        // ── Reports ───────────────────────────────────────────────────────────

        public DashboardStatsRow GetDashboardStats(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var stats = new DashboardStatsRow();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Reports_GetDashboardStats", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();

                // RS1 — invoice stats
                if (reader.Read())
                {
                    stats.TotalInvoices       = Convert.ToInt32(reader["total_invoices"]);
                    stats.MatchedInvoices     = Convert.ToInt32(reader["matched_invoices"]);
                    stats.UnmatchedInvoices   = Convert.ToInt32(reader["unmatched_invoices"]);
                    stats.UploadedInvoices    = Convert.ToInt32(reader["uploaded_invoices"]);
                    stats.ProcessingInvoices  = Convert.ToInt32(reader["processing_invoices"]);
                    stats.TotalInvoiceAmount  = Convert.ToDecimal(reader["total_invoice_amount"]);
                    stats.AvgInvoiceAmount    = Convert.ToDecimal(reader["avg_invoice_amount"]);
                }

                // RS2 — transaction stats
                if (reader.NextResult() && reader.Read())
                {
                    stats.TotalTransactions       = Convert.ToInt32(reader["total_transactions"]);
                    stats.MatchedTransactions     = Convert.ToInt32(reader["matched_transactions"]);
                    stats.UnmatchedTransactions   = Convert.ToInt32(reader["unmatched_transactions"]);
                    stats.TotalTransactionVolume  = Convert.ToDecimal(reader["total_transaction_volume"]);
                    stats.TotalDebits             = Convert.ToDecimal(reader["total_debits"]);
                    stats.TotalCredits            = Convert.ToDecimal(reader["total_credits"]);
                }

                // RS3 — anomaly stats
                if (reader.NextResult() && reader.Read())
                {
                    stats.TotalAnomalies     = Convert.ToInt32(reader["total_anomalies"]);
                    stats.OpenAnomalies      = Convert.ToInt32(reader["open_anomalies"]);
                    stats.CriticalAnomalies  = Convert.ToInt32(reader["critical_anomalies"]);
                    stats.ResolvedAnomalies  = Convert.ToInt32(reader["resolved_anomalies"]);
                }

                // RS4 — match stats
                if (reader.NextResult() && reader.Read())
                {
                    stats.TotalMatches       = Convert.ToInt32(reader["total_matches"]);
                    stats.TotalMatchedAmount = Convert.ToDecimal(reader["total_matched_amount"]);
                }

                return stats;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public VatReportSummary GetVatReport(
            long companyId, DateTime? startDate, DateTime? endDate)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var summary = new VatReportSummary();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Reports_GetVATReport", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@StartDate", startDate },
                        { "@EndDate",   endDate   }
                    });

                reader = cmd.ExecuteReader();

                // RS1 — summary row
                if (reader.Read())
                {
                    summary.TotalSubtotal = Convert.ToDecimal(reader["total_subtotal"]);
                    summary.TotalVat      = Convert.ToDecimal(reader["total_vat"]);
                    summary.TotalAmount   = Convert.ToDecimal(reader["total_amount"]);
                    summary.InvoiceCount  = Convert.ToInt32(reader["invoice_count"]);
                }

                // RS2 — invoice rows
                if (reader.NextResult())
                    while (reader.Read())
                        summary.Invoices.Add(new VatInvoiceRow
                        {
                            Id            = Convert.ToInt64(reader["id"]),
                            InvoiceNumber = reader["invoice_number"]?.ToString()!,
                            VendorName    = reader["vendor_name"]?.ToString()!,
                            InvoiceDate   = Convert.ToDateTime(reader["invoice_date"]),
                            Subtotal      = Convert.ToDecimal(reader["subtotal"]),
                            VatRate       = reader["vat_rate"]   != DBNull.Value ? Convert.ToDecimal(reader["vat_rate"])   : null,
                            VatAmount     = reader["vat_amount"] != DBNull.Value ? Convert.ToDecimal(reader["vat_amount"]) : null,
                            TotalAmount   = Convert.ToDecimal(reader["total_amount"]),
                            Currency      = reader["currency"]?.ToString() ?? "USD",
                            Status        = reader["status"]?.ToString()   ?? string.Empty,
                        });

                return summary;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public List<ReconciliationRow> GetReconciliationReport(
            long companyId, DateTime? startDate, DateTime? endDate)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<ReconciliationRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Reports_GetReconciliationReport", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@StartDate", startDate },
                        { "@EndDate",   endDate   }
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(new ReconciliationRow
                    {
                        InvoiceId              = Convert.ToInt64(reader["invoice_id"]),
                        InvoiceNumber          = reader["invoice_number"]?.ToString()!,
                        VendorName             = reader["vendor_name"]?.ToString()!,
                        InvoiceDate            = Convert.ToDateTime(reader["invoice_date"]),
                        InvoiceAmount          = Convert.ToDecimal(reader["invoice_amount"]),
                        InvoiceStatus          = reader["invoice_status"]?.ToString()!,
                        IsMatched              = reader["is_matched"] != DBNull.Value && Convert.ToBoolean(reader["is_matched"]),
                        MatchId                = reader["match_id"]           != DBNull.Value ? Convert.ToInt64(reader["match_id"])           : null,
                        MatchedAmount          = reader["matched_amount"]     != DBNull.Value ? Convert.ToDecimal(reader["matched_amount"])    : null,
                        MatchMethod            = reader["match_method"]       as string,
                        MatchConfidence        = reader["match_confidence"]   != DBNull.Value ? Convert.ToDecimal(reader["match_confidence"])  : null,
                        TransactionId          = reader["transaction_id"]     != DBNull.Value ? Convert.ToInt64(reader["transaction_id"])      : null,
                        TransactionDate        = reader["transaction_date"]   != DBNull.Value ? Convert.ToDateTime(reader["transaction_date"]) : null,
                        TransactionDescription = reader["transaction_description"] as string,
                        TransactionAmount      = reader["transaction_amount"] != DBNull.Value ? Convert.ToDecimal(reader["transaction_amount"]) : null,
                        TransactionType        = reader["transaction_type"]   as string,
                    });
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }
    }
}
