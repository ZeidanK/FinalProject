using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateAnomalyRequest
    {
        [Required]
        public long CompanyId { get; set; }

        [Required]
        [StringLength(100)]
        public string AnomalyType { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [StringLength(50)]
        public string Severity { get; set; } = "warning";

        public string? SuggestedAction { get; set; }

        public long? RelatedInvoiceId { get; set; }

        public long? RelatedTransactionId { get; set; }

        public long? RelatedMatchId { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Amount { get; set; }

        [StringLength(50)]
        public string DetectionMethod { get; set; } = "ai";

        [Range(0, 1)]
        public decimal? DetectionConfidence { get; set; }
    }

    public class ResolveAnomalyRequest
    {
        [Required]
        public long ResolvedByUserId { get; set; }

        public string? ResolutionNotes { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "resolved";
    }

    public class KeepDuplicateInvoiceRequest
    {
        [Required]
        public long KeepInvoiceId { get; set; }

        public string? ResolutionNotes { get; set; }
    }

    // ── Anomaly row ───────────────────────────────────────────────────────────
    public class AnomalyRow
    {
        public long      Id                    { get; set; }
        public long      CompanyId             { get; set; }
        public string    AnomalyType           { get; set; } = string.Empty;
        public string    Title                 { get; set; } = string.Empty;
        public string    Description           { get; set; } = string.Empty;
        public string    Severity              { get; set; } = "warning";
        public string    Status                { get; set; } = "open";
        public string?   SuggestedAction       { get; set; }
        public long?     RelatedInvoiceId      { get; set; }
        public long?     RelatedTransactionId  { get; set; }
        public long?     RelatedMatchId        { get; set; }
        public decimal?  Amount                { get; set; }
        public string    DetectionMethod       { get; set; } = "ai";
        public decimal?  DetectionConfidence   { get; set; }
        public long?     ResolvedByUserId      { get; set; }
        public string?   ResolvedByName        { get; set; }
        public string?   ResolutionNotes       { get; set; }
        public DateTime? ResolvedAt            { get; set; }
        public DateTime  CreatedAt             { get; set; }
        public DateTime  UpdatedAt             { get; set; }

        // Grouping metadata so one anomaly can represent multiple related records.
        public string? GroupKey { get; set; }
        public int RelatedItemsCount { get; set; }
        public List<AnomalyRelatedItem> RelatedItems { get; set; } = new();
    }

    public class AnomalyRelatedItem
    {
        public string ItemType { get; set; } = string.Empty;
        public long? EntityId { get; set; }
        public string? Label { get; set; }
        public decimal? Amount { get; set; }
        public DateTime? Date { get; set; }
        public string? Status { get; set; }
        public string? FileName { get; set; }
        public string? FilePath { get; set; }
        public string? FileHash { get; set; }
        public long? FileSize { get; set; }
        public DateTime? UploadedAt { get; set; }
    }

    public class TransactionFileUploadRow
    {
        public long Id { get; set; }
        public long CompanyId { get; set; }
        public string FileHashSha256 { get; set; } = string.Empty;
        public string? FileOriginalName { get; set; }
        public string? FilePath { get; set; }
        public long? FileSize { get; set; }
        public long? UploadedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public long? AnomalyId { get; set; }
    }

    public class AnomalyStatsRow
    {
        public Dictionary<string, int> ByStatus   { get; set; } = new();
        public Dictionary<string, int> BySeverity { get; set; } = new();
    }
}
