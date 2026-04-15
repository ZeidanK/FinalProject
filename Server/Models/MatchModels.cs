using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateMatchRequest
    {
        [Required]
        public long InvoiceId { get; set; }

        [Required]
        public long TransactionId { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal MatchedAmount { get; set; }

        [Required]
        [StringLength(50)]
        public string MatchMethod { get; set; } = string.Empty;

        public long? MatchedByUserId { get; set; }

        [StringLength(50)]
        public string MatchType { get; set; } = "full";

        [Range(0, 1)]
        public decimal? MatchConfidence { get; set; }

        [StringLength(500)]
        public string? MatchReason { get; set; }
        
        public int? InstallmentNumber { get; set; }
        
        [StringLength(200)]
        public string? InstallmentNote { get; set; }
    }

    public class UpdateMatchRequest
    {
        /// <summary>Set to "cancelled" to cancel a match without deleting it.</summary>
        [StringLength(50)]
        public string? Status { get; set; }
    }

    public class VendorComparisonResult
    {
        public string TransactionDescription { get; set; } = string.Empty;
        public decimal SimilarityScore { get; set; }
    }

    // ── Match row ─────────────────────────────────────────────────────────────
    public class MatchRow
    {
        public long     Id                          { get; set; }
        public long     InvoiceId                   { get; set; }
        public string?  InvoiceNumber               { get; set; }
        public string?  VendorName                  { get; set; }
        public decimal? InvoiceAmount               { get; set; }
        public long     TransactionId               { get; set; }
        public string?  TransactionVendorName        { get; set; }
        public string?  TransactionDescription      { get; set; }
        public DateTime? TransactionDate            { get; set; }
        public decimal? TransactionAmount           { get; set; }
        public string?  TransactionType             { get; set; }
        public string   MatchType                   { get; set; } = "full";
        public decimal  MatchedAmount               { get; set; }
        public string   MatchMethod                 { get; set; } = string.Empty;
        public decimal? MatchConfidence             { get; set; }
        public string?  MatchReason                 { get; set; }
        public long?    MatchedByUserId             { get; set; }
        public string?  MatchedByName               { get; set; }
        public int?     InstallmentNumber           { get; set; }
        public string?  InstallmentNote             { get; set; }
        public DateTime CreatedAt                   { get; set; }
        public DateTime UpdatedAt                   { get; set; }
    }

    public class TransactionMatchBase
    {
        public long     Id              { get; set; }
        public DateTime TransactionDate { get; set; }
        public string   Description     { get; set; } = string.Empty;
        public decimal  Amount          { get; set; }
        public string   TransactionType { get; set; } = string.Empty;
        public string?  ReferenceNumber { get; set; }
    }

    public class MatchSuggestionRow : TransactionMatchBase
    {
        public decimal  AmountDifference { get; set; }
        public decimal  MatchScore       { get; set; }
        public int      DaysDifference   { get; set; }
        public List<string> MatchReasons { get; set; } = new();
    }

    public class TransactionCandidate : TransactionMatchBase
    {
        public string?   VendorName    { get; set; }
        public decimal?  ChargeAmount  { get; set; }
        public DateTime? PostedDate    { get; set; }
    }

    public class VendorAlias
    {
        public long    Id                     { get; set; }
        public long    CompanyId              { get; set; }
        public string  VendorName             { get; set; } = string.Empty;
        public string  TransactionPattern     { get; set; } = string.Empty;
        public int     ConfirmationCount       { get; set; }
        public int     RejectionCount          { get; set; }
        public bool    IsActive               { get; set; } = true;
        public DateTime CreatedAt             { get; set; }
    }

    // ── Simple date+amount match suggestion ──────────────────────────────────
    public class SimpleMatchSuggestion
    {
        public long     InvoiceId               { get; set; }
        public string   InvoiceNumber           { get; set; } = string.Empty;
        public string   VendorName              { get; set; } = string.Empty;
        public decimal  InvoiceAmount           { get; set; }
        public DateTime InvoiceDate             { get; set; }
        public long     TransactionId           { get; set; }
        public string   TransactionDescription  { get; set; } = string.Empty;
        public decimal  TransactionAmount       { get; set; }
        public DateTime TransactionDate         { get; set; }
        public string   TransactionType         { get; set; } = string.Empty;
    }

    // ── Installment group suggestion ──────────────────────────────────────────
    public class InstallmentGroupSuggestion
    {
        public long     InvoiceId               { get; set; }
        public string   InvoiceNumber           { get; set; } = string.Empty;
        public string   VendorName              { get; set; } = string.Empty;
        public decimal  TotalAmount             { get; set; }
        public DateTime InvoiceDate             { get; set; }
        public decimal  AlreadyMatchedAmount    { get; set; }
        public decimal  RemainingAmount         { get; set; }
        public int?     ExpectedInstallments    { get; set; }
        public int?     DetectedInstallmentCount { get; set; }
        public int      AlreadyMatchedCount     { get; set; }
        public decimal  InstallmentAmount       { get; set; }
        public List<SuggestedInstallmentTransaction> SuggestedTransactions { get; set; } = new();
        public List<MatchRow>                        ExistingMatches       { get; set; } = new();
    }

    public class SuggestedInstallmentTransaction
    {
        public long      TransactionId    { get; set; }
        public DateTime  TransactionDate  { get; set; }
        public DateTime? PostedDate       { get; set; }
        public string    Description      { get; set; } = string.Empty;
        public decimal   Amount           { get; set; }
        public decimal?  ChargeAmount     { get; set; }
        public string?   VendorName       { get; set; }
    }
}
