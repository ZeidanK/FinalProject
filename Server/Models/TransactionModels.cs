using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateTransactionRequest
    {
        [Required]
        public long CompanyId { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; }

        /// <summary>Date of billing</summary>
        public DateTime? PostedDate { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;

        [StringLength(255)]
        public string? VendorName { get; set; }

        [StringLength(4)]
        public string? CardLast4 { get; set; }

        [Required]
        public decimal Amount { get; set; }   // value of transaction

        [Required]
        [StringLength(50)]
        public string TransactionType { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Category { get; set; }

        [StringLength(100)]
        public string? ReferenceNumber { get; set; }

        public decimal? ChargeAmount { get; set; }   // amount of charge

        [StringLength(3)]
        public string? ChargeCurrency { get; set; }   // currency of charge (ISO 4217)

        [StringLength(3)]
        public string? OriginalCurrency { get; set; }

        public decimal? ExchangeRate { get; set; }

        public decimal? BalanceAfter { get; set; }

        public long? BankAccountId { get; set; }

        public long? CreatedByUserId { get; set; }
    }

    public class BulkCreateTransactionsRequest
    {
        [Required]
        public long CompanyId { get; set; }

        public long? CreatedByUserId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one transaction is required.")]
        public List<CreateTransactionRequest> Transactions { get; set; } = new();
    }

    public class BulkDeleteTransactionsRequest
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one transaction ID is required.")]
        public List<long> Ids { get; set; } = new();
    }

    // ── Excel Upload Models ──────────────────────────────────────────────

    public class ExtractedTransaction
    {
        public DateTime  TransactionDate   { get; set; }
        public DateTime? PostedDate        { get; set; }   // date of billing
        public string    Description       { get; set; } = string.Empty;
        public string?   VendorName        { get; set; }
        public string?   CardLast4         { get; set; }
        public decimal   Amount            { get; set; }   // value of transaction
        public string    TransactionType   { get; set; } = "debit";
        public string?   Category          { get; set; }
        public string?   ReferenceNumber   { get; set; }
        public decimal?  ChargeAmount      { get; set; }   // amount of charge
        public string?   ChargeCurrency    { get; set; }   // currency of charge
        public string?   OriginalCurrency  { get; set; }
        public decimal?  ExchangeRate      { get; set; }
        public decimal?  BalanceAfter      { get; set; }
        public string    SheetName         { get; set; } = string.Empty;
        public int       RowNumber         { get; set; }
    }

    public class SheetResult
    {
        public string SheetName { get; set; } = string.Empty;
        public int RowsExtracted { get; set; }
        public int RowsSkipped { get; set; }
        public List<string> Errors { get; set; } = new();
    }

    public class ExcelExtractionResult
    {
        public string FileName { get; set; } = string.Empty;
        public int TotalExtracted { get; set; }
        public int TotalSkipped { get; set; }
        public List<ExtractedTransaction> Transactions { get; set; } = new();
        public List<SheetResult> Sheets { get; set; } = new();
    }

    public class UploadExcelResponse
    {
        public string FileOriginalName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public ExcelExtractionResult ExtractionResult { get; set; } = new();
        public List<long>? CreatedTransactionIds { get; set; }
    }

    public class ImportExcelRequest
    {
        [Required]
        public long CompanyId { get; set; }

        [Required]
        public string SavedFilePath { get; set; } = string.Empty;

        public string? FileOriginalName { get; set; }

        public long? BankAccountId { get; set; }

        /// <summary>Pass "Deny" to discard the preview file without importing.</summary>
        public string? Status { get; set; }
    }

    // ── Insert DTO used by DAL to keep parameter count low ─────────────────────
    public class TransactionInsertData
    {
        public DateTime  TransactionDate  { get; init; }
        public DateTime? PostedDate       { get; init; }
        public string    Description      { get; init; } = string.Empty;
        public string?   VendorName       { get; init; }
        public string?   CardLast4        { get; init; }
        public decimal   Amount           { get; init; }
        public string    TransactionType  { get; init; } = string.Empty;
        public string?   Category         { get; init; }
        public string?   ReferenceNumber  { get; init; }
        public decimal?  ChargeAmount     { get; init; }
        public string?   ChargeCurrency   { get; init; }
        public string?   OriginalCurrency { get; init; }
        public decimal?  ExchangeRate     { get; init; }
    }

    // ── Transaction row ───────────────────────────────────────────────────────
    public class TransactionRow
    {
        public long      Id                  { get; set; }
        public long      CompanyId           { get; set; }   // uploaded-to company
        public DateTime  TransactionDate     { get; set; }
        public DateTime? PostedDate          { get; set; }   // date of billing
        public string    Description         { get; set; } = string.Empty;
        public string?   VendorName          { get; set; }
        public string?   CardLast4           { get; set; }
        public decimal   Amount              { get; set; }   // value of transaction
        public string    TransactionType     { get; set; } = string.Empty;
        public string?   Category            { get; set; }
        public decimal?  CategoryConfidence  { get; set; }
        public string?   ReferenceNumber     { get; set; }
        public decimal?  ChargeAmount        { get; set; }   // amount of charge
        public string?   ChargeCurrency      { get; set; }   // currency of charge
        public string?   OriginalCurrency    { get; set; }
        public decimal?  ExchangeRate        { get; set; }
        public bool      IsMatched           { get; set; }
        public bool      IsAnomaly           { get; set; }
        public bool      IsDuplicate         { get; set; }
        public string    Status              { get; set; } = "confirmed";
        public long?     CreatedByUserId     { get; set; }   // uploader user id
        public DateTime  CreatedAt           { get; set; }
        public DateTime  UpdatedAt           { get; set; }
    }
}
