using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateInvoiceRequest
    {
        [Required]
        public long CompanyId { get; set; }

        [Required]
        [StringLength(100)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string VendorName { get; set; } = string.Empty;

        [Required]
        public DateTime InvoiceDate { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalAmount { get; set; }

        public long? UploadedByUserId { get; set; }

        [StringLength(100)]
        public string? VendorTaxId { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime? PaymentDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Subtotal { get; set; } = 0;

        [Range(0, 100)]
        public decimal? VatRate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? VatAmount { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        [StringLength(4)]
        public string? LastFourDigitsCard { get; set; }

        public List<CreateLineItemRequest> LineItems { get; set; } = new();
    }

    public class CreateLineItemRequest
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal UnitPrice { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalAmount { get; set; }

        public int? LineNumber { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Quantity { get; set; } = 1;

        [Range(0, 100)]
        public decimal? VatRate { get; set; }

        [Range(0, 1)]
        public decimal? AiConfidenceScore { get; set; }
    }

    public class UpdateInvoiceStatusRequest
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;
    }
}
