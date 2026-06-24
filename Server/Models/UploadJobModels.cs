using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public static class UploadJobTypes
    {
        public const string InvoiceUploadPdf = "invoice_upload_pdf";
        public const string InvoiceUploadAndCreate = "invoice_upload_and_create";
        public const string TransactionUploadExcel = "transaction_upload_excel";
        public const string TransactionImportExcel = "transaction_import_excel";
    }

    public static class UploadJobStatuses
    {
        public const string Queued = "queued";
        public const string Processing = "processing";
        public const string Completed = "completed";
        public const string Failed = "failed";
        public const string Canceled = "canceled";
        public const string Verified = "verified"; // user confirmed the extracted data
    }

    public class UploadJobPayload
    {
        public long? BankAccountId { get; set; }
        public string? Source { get; set; }
    }

    public class UploadJobRow
    {
        public long Id { get; set; }
        public string JobType { get; set; } = string.Empty;
        public string Status { get; set; } = UploadJobStatuses.Queued;
        public string FilePath { get; set; } = string.Empty;
        public string? FileOriginalName { get; set; }
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public long CompanyId { get; set; }
        public long UserId { get; set; }
        public long? BankAccountId { get; set; }
        public int ProgressPercent { get; set; }
        public string? PayloadJson { get; set; }
        public string? ResultJson { get; set; }
        public string? ErrorMessage { get; set; }
        public string? HangfireJobId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class CreateUploadJobRequest
    {
        [Required]
        [StringLength(100)]
        public string JobType { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string FilePath { get; set; } = string.Empty;

        [StringLength(255)]
        public string? FileOriginalName { get; set; }

        [StringLength(100)]
        public string? FileType { get; set; }

        public long? FileSize { get; set; }

        [Required]
        public long CompanyId { get; set; }

        [Required]
        public long UserId { get; set; }

        public long? BankAccountId { get; set; }

        public string? PayloadJson { get; set; }
    }

    public class QueueUploadJobResponse
    {
        public long JobId { get; set; }
        public string Status { get; set; } = UploadJobStatuses.Queued;
        public string? HangfireJobId { get; set; }
        public string Message { get; set; } = "Upload job queued.";
    }
}
