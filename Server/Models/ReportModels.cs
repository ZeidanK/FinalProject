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
        public int     TotalTransactions        { get; set; }
        public int     MatchedTransactions      { get; set; }
        public int     UnmatchedTransactions     { get; set; }
        public int     TransactionsWithoutInvoice { get; set; }
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

    public class ReconciliationReport
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string CompanyCurrency { get; set; } = "USD";
        public ReconciliationSummary Summary { get; set; } = new();
        public List<ReconciliationRow> Rows { get; set; } = new();
    }

    public class ReconciliationSummary
    {
        public int LedgerEntryCount { get; set; }
        public int BankTransactionCount { get; set; }
        public int FullyMatchedLedgerCount { get; set; }
        public int PartiallyMatchedLedgerCount { get; set; }
        public int UnmatchedLedgerCount { get; set; }
        public int MatchedBankTransactionCount { get; set; }
        public int UnmatchedBankTransactionCount { get; set; }
    }

    public class ReconciliationRow
    {
        public string ReconciliationStatus { get; set; } = string.Empty;
        public long? InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? VendorName { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal? InvoiceAmount { get; set; }
        public string? InvoiceCurrency { get; set; }
        public string? InvoiceStatus { get; set; }
        public decimal? InvoiceMatchedAmount { get; set; }
        public decimal? OutstandingAmount { get; set; }
        public long? MatchId { get; set; }
        public decimal? MatchedAmount { get; set; }
        public string? MatchMethod { get; set; }
        public decimal? MatchConfidence { get; set; }
        public long? TransactionId { get; set; }
        public DateTime? TransactionDate { get; set; }
        public string? TransactionDescription { get; set; }
        public decimal? TransactionAmount { get; set; }
        public string? TransactionCurrency { get; set; }
        public decimal? OriginalTransactionAmount { get; set; }
        public string? OriginalTransactionCurrency { get; set; }
        public string? TransactionType { get; set; }
    }

    public class PayablesAgingReport
    {
        public DateTime AsOfDate { get; set; }
        public int TotalInvoiceCount { get; set; }
        public List<CurrencyAmount> TotalsByCurrency { get; set; } = new();
        public List<AgingBucketSummary> Buckets { get; set; } = new();
        public List<PayablesAgingRow> Rows { get; set; } = new();
    }

    public class CurrencyAmount
    {
        public string Currency { get; set; } = "USD";
        public decimal Amount { get; set; }
    }

    public class AgingBucketSummary
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int InvoiceCount { get; set; }
        public List<CurrencyAmount> AmountsByCurrency { get; set; } = new();
    }

    public class PayablesAgingRow
    {
        public long InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime EffectiveDueDate { get; set; }
        public int DaysPastDue { get; set; }
        public string BucketKey { get; set; } = string.Empty;
        public string BucketLabel { get; set; } = string.Empty;
        public decimal OriginalAmount { get; set; }
        public decimal MatchedAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public string Currency { get; set; } = "USD";
        public string PaymentStatus { get; set; } = string.Empty;
    }
}
