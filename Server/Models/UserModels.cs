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
    }
}
