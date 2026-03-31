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

    // ── PDF Upload & Extraction Models ────────────────────────────────────

    public class ExtractedLineItem
    {
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? VatRate { get; set; }
        public string? Category { get; set; }
        public decimal? AiConfidenceScore { get; set; }
    }

    public class PdfExtractionResult
    {
        public string? VendorName { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? Subtotal { get; set; }
        public decimal? VatRate { get; set; }
        public decimal? VatAmount { get; set; }
        public string? Currency { get; set; }
        public string? VendorTaxId { get; set; }
        public string? LastFourDigitsCard { get; set; }
        public List<ExtractedLineItem> LineItems { get; set; } = new();
        public decimal ExtractionConfidence { get; set; }
        public string ExtractionMethod { get; set; } = "text"; // "text" or "ocr"
        public string? RawText { get; set; }
    }

    public class UploadInvoicePdfResponse
    {
        public string FileOriginalName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = "application/pdf";
        public PdfExtractionResult ExtractedData { get; set; } = new();
    }
}
