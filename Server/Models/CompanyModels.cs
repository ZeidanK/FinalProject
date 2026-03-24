using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateCompanyRequest
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public long CreatedByUserId { get; set; }

        [StringLength(100)]
        public string? RegistrationNumber { get; set; }

        [StringLength(255)]
        public string? Street { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(100)]
        public string Country { get; set; } = "USA";

        [EmailAddress]
        [StringLength(255)]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Website { get; set; }

        [StringLength(100)]
        public string? TaxId { get; set; }

        [StringLength(100)]
        public string? VatNumber { get; set; }

        public DateTime? FiscalYearStart { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = "USD";
    }

    public class UpdateCompanyRequest
    {
        [StringLength(255)]
        public string? Name { get; set; }

        [StringLength(255)]
        public string? Street { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [EmailAddress]
        [StringLength(255)]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Website { get; set; }

        [StringLength(100)]
        public string? TaxId { get; set; }

        [StringLength(100)]
        public string? VatNumber { get; set; }

        public bool? IsActive { get; set; }
    }
}
