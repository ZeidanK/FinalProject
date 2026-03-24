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
}
