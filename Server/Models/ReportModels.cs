using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class GetReportsQuery
    {
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 50;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? ReportType { get; set; }
    }

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
}
