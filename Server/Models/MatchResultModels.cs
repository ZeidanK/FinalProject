namespace FinalProjectAuthAPI.Models
{
    public class AutoMatchBatchResult
    {
        public int SuccessfulMatches { get; set; }
        public int SkippedInvoices { get; set; }
        public List<MatchDetail> MatchDetails { get; set; } = new();
        public List<MatchDetail> SuggestionsForReview { get; set; } = new();
    }

    public class MatchDetail
    {
        public long InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public bool Success { get; set; }
        public decimal? MatchScore { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal? InvoiceAmount { get; set; }
        public string? InvoiceDate { get; set; }
        public long? TransactionId { get; set; }
        public string? TransactionDescription { get; set; }
        public decimal? TransactionAmount { get; set; }
        public string? TransactionDate { get; set; }
        public decimal? MatchedAmount { get; set; }
        public long? MatchId { get; set; }
    }
}
