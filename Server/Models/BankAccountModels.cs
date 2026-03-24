using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateBankAccountRequest
    {
        [Required]
        public long CompanyId { get; set; }

        [Required]
        [StringLength(255)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string AccountType { get; set; } = string.Empty;

        public long? CreatedByUserId { get; set; }

        [StringLength(255)]
        public string? AccountName { get; set; }

        [StringLength(50)]
        public string? AccountNumberMasked { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = "USD";

        public decimal Balance { get; set; } = 0;
    }

    public class UpdateBankAccountRequest
    {
        [StringLength(255)]
        public string? BankName { get; set; }

        [StringLength(255)]
        public string? AccountName { get; set; }

        [StringLength(50)]
        public string? AccountNumberMasked { get; set; }

        [StringLength(50)]
        public string? AccountType { get; set; }

        [StringLength(3)]
        public string? Currency { get; set; }

        public bool? IsActive { get; set; }

        public decimal? Balance { get; set; }

        public DateTime? LastSyncAt { get; set; }
    }
}
