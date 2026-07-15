using System.ComponentModel.DataAnnotations;

namespace FinalProjectAuthAPI.Models
{
    public class UpdateUserRequest
    {
        [StringLength(255)]
        public string? Name { get; set; }

        [StringLength(50)]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? ProfilePicture { get; set; }

        public string? Bio { get; set; }

        public int? YearsOfExperience { get; set; }

        public decimal? HourlyRate { get; set; }

        [StringLength(255)]
        public string? Location { get; set; }
    }

    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters.")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class VerifyPasswordRequest
    {
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
