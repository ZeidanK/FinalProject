namespace FinalProjectAuthAPI.Models
{
    /// <summary>
    /// Represents a public accountant shown in the directory.
    /// </summary>
    public class AccountantInfo
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? ProfilePicture { get; set; }
        /// <summary>
        /// The access status relative to the requesting company: null, "pending", or "active".
        /// </summary>
        public string? RequestStatus { get; set; }
        public string? Bio { get; set; }
        public int? YearsOfExperience { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? Location { get; set; }
        public string Specialties { get; set; } = string.Empty;
        public string Certifications { get; set; } = string.Empty;
        public decimal? AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }

    /// <summary>
    /// Paginated response wrapper for the accountant directory.
    /// </summary>
    public class PagedAccountantsResponse
    {
        public List<AccountantInfo> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
    }

    /// <summary>
    /// A pending work request sent by a business owner to an accountant.
    /// </summary>
    public class AccessRequestRow
    {
        public long Id { get; set; }
        public long CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public long RequestedByUserId { get; set; }
        public string RequestedByName { get; set; } = string.Empty;

        // Owner details
        public string? OwnerEmail { get; set; }
        public string? OwnerPhone { get; set; }
        public string? OwnerProfilePicture { get; set; }

        // Company details
        public string? CompanyEmail { get; set; }
        public string? CompanyPhone { get; set; }
        public string? CompanyStreet { get; set; }
        public string? CompanyCity { get; set; }
        public string? CompanyState { get; set; }
        public string? CompanyCountry { get; set; }
        public string? CompanyRegistrationNumber { get; set; }
        public string? CompanyTaxId { get; set; }

        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = "pending";
    }

    /// <summary>Request body for responding to a work request.</summary>
    public class RespondToRequestRequest
    {
        public bool Accept { get; set; }
    }

    /// <summary>Request body for sending a work request to an accountant.</summary>
    public class SendWorkRequestRequest
    {
        public long CompanyId { get; set; }
    }

    /// <summary>Request body for updating accountant visibility.</summary>
    public class UpdateVisibilityRequest
    {
        public bool IsPublic { get; set; }
    }

    /// <summary>Request body for adding/removing a specialty.</summary>
    public class SpecialtyRequest
    {
        public string Specialty { get; set; } = string.Empty;
    }

    /// <summary>Request body for adding/removing a certification.</summary>
    public class CertificationRequest
    {
        public string Certification { get; set; } = string.Empty;
    }

    /// <summary>Request body for submitting or updating a review.</summary>
    public class SubmitReviewRequest
    {
        public long CompanyId { get; set; }
        public byte Rating { get; set; }
        public string? Review { get; set; }
    }

    /// <summary>Review row returned by the API.</summary>
    public class ReviewRow
    {
        public long Id { get; set; }
        public long AccountantUserId { get; set; }
        public long CompanyId { get; set; }
        public byte Rating { get; set; }
        public string? Review { get; set; }
        public long CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
