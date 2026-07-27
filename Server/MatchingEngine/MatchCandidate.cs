namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Represents a successfully matched pair with metadata about which rule matched it.
    /// </summary>
    public class MatchResult
    {
        public long InvoiceId { get; set; }
        public long TransactionId { get; set; }
        public decimal MatchedAmount { get; set; }
        public string RuleLayer { get; set; } = string.Empty;
        public string RuleName { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string MatchReason { get; set; } = string.Empty;
        public int? InstallmentNumber { get; set; }
        public string? InstallmentNote { get; set; }
    }

    /// <summary>
    /// A suggested match that didn't clear any rule but has a fuzzy_score > 0.60
    /// and amount variance < 15%, returned for manual UI review.
    /// </summary>
    public class SuggestedMatch
    {
        public long InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public decimal InvoiceAmount { get; set; }
        public DateTime InvoiceDate { get; set; }
        public long TransactionId { get; set; }
        public string TransactionDescription { get; set; } = string.Empty;
        public decimal TransactionAmount { get; set; }
        public DateTime TransactionDate { get; set; }
        public double FuzzyScore { get; set; }
        public decimal AmountVariancePercent { get; set; }
    }

    /// <summary>
    /// The final result of running the entire pipeline.
    /// </summary>
    public class PipelineResult
    {
        public List<MatchResult> AutoMatches { get; set; } = new();
        public List<SuggestedMatch> SuggestedMatches { get; set; } = new();
        public int InvoicesProcessed { get; set; }
        public int TransactionsProcessed { get; set; }
        public int InvoicesRemaining { get; set; }
        public int TransactionsRemaining { get; set; }
    }

    /// <summary>
    /// Lightweight wrapper for invoice subset combination logic (Rule 5.1).
    /// </summary>
    public class InvoiceSubset
    {
        public List<Models.InvoiceRow> Invoices { get; set; } = new();
        public decimal TotalAmount => Invoices.Sum(i => i.TotalAmount);
    }

    /// <summary>
    /// Result of a single rule evaluation.
    /// </summary>
    public class RuleEvalResult
    {
        public bool Matched { get; set; }
        public decimal MatchedAmount { get; set; }
        public string MatchReason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Accumulates transactions for installment detection (Rule 5.2).
    /// </summary>
    public class InstallmentAccumulator
    {
        public long InvoiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public List<long> TransactionIds { get; set; } = new();
        public decimal CumulativeAmount { get; set; }
    }
}