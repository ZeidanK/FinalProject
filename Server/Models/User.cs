using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FinalProjectAuthAPI.Models
{
    /// <summary>
    /// User model and auth helpers (JWT generation + password hashing).
    /// </summary>
    public class User
    {
        public long Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = "business_owner";
        public string? Phone { get; set; }
        public string? ProfilePicture { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsBanned { get; set; } = false;
        public bool IsPublic { get; set; } = false;

        // -- Accountant profile fields ----------------------------------------
        public string? Bio { get; set; }
        public int? YearsOfExperience { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? Location { get; set; }

        // -- JWT --------------------------------------------------------------

        public string GenerateJwtToken(IConfiguration config)
        {
            var key = config["Jwt:Key"]!;
            var issuer = config["Jwt:Issuer"]!;
            var audience = config["Jwt:Audience"]!;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, Email),
                new Claim("id", Id.ToString()),
                new Claim("name", Name),
                new Claim("role", Role),
                new Claim(ClaimTypes.Role, Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // -- Helpers ----------------------------------------------------------

        /// <summary>SHA-512 hash helper.</summary>
        public static string HashPassword(string password)
        {
            using var sha512 = SHA512.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha512.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
