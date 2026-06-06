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
}
