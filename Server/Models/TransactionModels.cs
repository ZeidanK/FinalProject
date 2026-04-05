using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateTransactionRequest
    {
        [Required]
        public long CompanyId { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(50)]
        public string TransactionType { get; set; } = string.Empty;

        public long? CreatedByUserId { get; set; }

        public long? BankAccountId { get; set; }

        public DateTime? PostedDate { get; set; }

        public decimal? BalanceAfter { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        [StringLength(100)]
        public string? ReferenceNumber { get; set; }

        [StringLength(255)]
        public string? VendorName { get; set; }
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
        public DateTime TransactionDate { get; set; }
        public DateTime? PostedDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal? BalanceAfter { get; set; }
        public string TransactionType { get; set; } = "debit";
        public string? Category { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? VendorName { get; set; }
        public string SheetName { get; set; } = string.Empty;
        public int RowNumber { get; set; }
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
}
