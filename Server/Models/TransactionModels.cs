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
}
