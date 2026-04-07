using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class CreateCompanyRequest
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

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

    // ── Company row ───────────────────────────────────────────────────────────
    public class CompanyRow
    {
        public long    Id                 { get; set; }
        public string  Name               { get; set; } = string.Empty;
        public string? RegistrationNumber { get; set; }
        public string? Street             { get; set; }
        public string? City               { get; set; }
        public string? State              { get; set; }
        public string? PostalCode         { get; set; }
        public string  Country            { get; set; } = "USA";
        public string? Email              { get; set; }
        public string? Phone              { get; set; }
        public string? Website            { get; set; }
        public string? TaxId              { get; set; }
        public string? VatNumber          { get; set; }
        public DateTime? FiscalYearStart  { get; set; }
        public string  Currency           { get; set; } = "USD";
        public bool    IsActive           { get; set; } = true;
        public long?   CreatedByUserId    { get; set; }
        public string? CreatedByName      { get; set; }
        public string? AccessLevel        { get; set; }
        public DateTime CreatedAt         { get; set; }
        public DateTime UpdatedAt         { get; set; }
    }
}
