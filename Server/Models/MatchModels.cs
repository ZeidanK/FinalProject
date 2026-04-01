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
}
