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
        public decimal TotalAmount { get; set; }

        public long? UploadedByUserId { get; set; }

        [StringLength(100)]
        public string? VendorTaxId { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime? PaymentDate { get; set; }

        public decimal Subtotal { get; set; } = 0;

        [Range(0, 100)]
        public decimal? VatRate { get; set; }

        public decimal? VatAmount { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        [StringLength(255)]
        public string? FileOriginalName { get; set; }

        [StringLength(1000)]
        public string? FilePath { get; set; }

        [StringLength(100)]
        public string? FileType { get; set; }

        public long? FileSize { get; set; }

        [Range(0, 1)]
        public decimal? AiExtractionConfidence { get; set; }

        [StringLength(4)]
        public string? LastFourDigitsCard { get; set; }

        public int? ItemCount { get; set; }
        
        public int? PaymentPlanTotalInstallments { get; set; }
        
        public decimal? PaymentPlanInstallmentAmount { get; set; }
        
        [StringLength(50)]
        public string? PaymentPlanFrequency { get; set; }
        
        [StringLength(500)]
        public string? PaymentPlanDescription { get; set; }

        public List<CreateLineItemRequest> LineItems { get; set; } = new();
    }

    public class CreateLineItemRequest
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        public int? LineNumber { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

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

    public class BulkDeleteInvoicesRequest
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one invoice ID is required.")]
        public List<long> Ids { get; set; } = new();
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
        public DateTime? DueDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? Subtotal { get; set; }
        public decimal? VatRate { get; set; }
        public decimal? VatAmount { get; set; }
        public string? Currency { get; set; }
        public string? VendorTaxId { get; set; }
        public string? LastFourDigitsCard { get; set; }
        public int? ItemCount { get; set; }
        public PaymentPlanInfo? PaymentPlan { get; set; }
        public List<ExtractedLineItem> LineItems { get; set; } = new();
        public decimal ExtractionConfidence { get; set; }
        public string ExtractionMethod { get; set; } = "text"; // "text" or "ocr"
        public string ExtractionSource { get; set; } = "regex"; // "gemini" or "regex"
        public string? RawText { get; set; }
    }
    public class PaymentPlanInfo
    {
        public int? TotalInstallments { get; set; }
        public decimal? InstallmentAmount { get; set; }
        [StringLength(50)]
        public string? Frequency { get; set; }
        public int? CurrentInstallment { get; set; }
        [StringLength(500)]
        public string? Description { get; set; }
    }
    public class UploadInvoicePdfResponse
    {
        public string FileOriginalName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = "application/pdf";
        public PdfExtractionResult ExtractedData { get; set; } = new();
    }

    // ── Invoice row ───────────────────────────────────────────────────────────
    public class InvoiceRow
    {
        public long      Id                       { get; set; }
        public long      CompanyId                { get; set; }
        public string    InvoiceNumber            { get; set; } = string.Empty;
        public string    VendorName               { get; set; } = string.Empty;
        public string?   VendorTaxId              { get; set; }
        public DateTime  InvoiceDate              { get; set; }
        public DateTime? DueDate                  { get; set; }
        public DateTime? PaymentDate              { get; set; }
        public decimal   Subtotal                 { get; set; }
        public decimal?  VatRate                  { get; set; }
        public decimal?  VatAmount                { get; set; }
        public decimal   TotalAmount              { get; set; }
        public string    Currency                 { get; set; } = "USD";
        public string?   FileOriginalName         { get; set; }
        public string?   FilePath                 { get; set; }
        public string?   FileType                 { get; set; }
        public long?     FileSize                 { get; set; }
        public string    Status                   { get; set; } = "uploaded";
        public decimal?  AiExtractionConfidence   { get; set; }
        public bool      AiProcessed              { get; set; }
        public bool      IsVerified               { get; set; }
        public bool      IsMatched                { get; set; }
        public decimal   MatchedAmount            { get; set; }
        public string?   LastFourDigitsCard       { get; set; }
        public int?      ItemCount                { get; set; }
        public int?      PaymentPlanTotalInstallments { get; set; }
        public decimal?  PaymentPlanInstallmentAmount { get; set; }
        public string?   PaymentPlanFrequency     { get; set; }
        public string?   PaymentPlanDescription   { get; set; }
        public long?     UploadedByUserId         { get; set; }
        public string?   UploadedByName           { get; set; }
        public long?     VerifiedByUserId         { get; set; }
        public DateTime  CreatedAt                { get; set; }
        public DateTime  UpdatedAt                { get; set; }
        public List<LineItemRow> LineItems        { get; set; } = new();
    }

    public class LineItemRow
    {
        public long     Id                 { get; set; }
        public long     InvoiceId          { get; set; }
        public int?     LineNumber         { get; set; }
        public string   Description        { get; set; } = string.Empty;
        public string?  Category           { get; set; }
        public decimal  Quantity           { get; set; } = 1;
        public decimal  UnitPrice          { get; set; }
        public decimal? VatRate            { get; set; }
        public decimal  TotalAmount        { get; set; }
        public decimal? AiConfidenceScore  { get; set; }
    }
}
