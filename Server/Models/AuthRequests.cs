using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters.")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Valid values:
        ///   business_owner          – can manage their own company
        ///   accountant              – manages client businesses
        ///   admin                   – full system access
        /// </summary>
        public string Role { get; set; } = "business_owner";
    }
}
