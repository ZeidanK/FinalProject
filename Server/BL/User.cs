using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FinalProjectAuthAPI.DAL;
using Microsoft.IdentityModel.Tokens;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business Logic for a user – mirrors the NewsSitePro User.cs approach:
    /// SHA-512 password hashing, stored-procedure DB calls, JWT generation.
    /// </summary>
    public class User
    {
        public long    Id             { get; set; }
        public string  Email          { get; set; } = string.Empty;
        public string  PasswordHash   { get; set; } = string.Empty;
        public string  Name           { get; set; } = string.Empty;
        public string  Role           { get; set; } = "business_owner";
        public string? Phone          { get; set; }
        public string? ProfilePicture { get; set; }
        public bool    IsActive       { get; set; } = true;

        // ── Register ─────────────────────────────────────────────────────────

        /// <summary>
        /// Creates a new user in the DB. Returns false if email already exists.
        /// </summary>
        public bool Register(string name, string email, string password, string role = "business_owner")
        {
            var db = new DBservices();

            if (db.GetUserByEmail(email) != null)
                return false; // duplicate email

            Name         = name;
            Email        = email;
            PasswordHash = HashPassword(password);
            Role         = role;
            IsActive     = true;

            return db.CreateUser(this);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Validates credentials and returns a JWT string, or null on failure.
        /// </summary>
        public string? LogIn(string email, string password, IConfiguration config)
        {
            var db   = new DBservices();
            var user = db.GetUserByEmail(email);

            if (user == null || !user.IsActive)
                return null;

            if (user.PasswordHash != HashPassword(password))
                return null;

            // Populate this instance so the controller can read the user info
            Id           = user.Id;
            Email        = user.Email;
            Name         = user.Name;
            Role         = user.Role;
            IsActive     = user.IsActive;

            db.UpdateLastLogin(Id);

            return GenerateJwtToken(config);
        }

        // ── JWT ──────────────────────────────────────────────────────────────

        public string GenerateJwtToken(IConfiguration config)
        {
            var key       = config["Jwt:Key"]!;
            var issuer    = config["Jwt:Issuer"]!;
            var audience  = config["Jwt:Audience"]!;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, Email),
                new Claim("id",   Id.ToString()),
                new Claim("name", Name),
                // Custom "role" claim – read directly in JS via token.role
                new Claim("role", Role),
                // Standard .NET role claim – enables [Authorize(Roles="...")]
                new Claim(ClaimTypes.Role, Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer:            issuer,
                audience:          audience,
                claims:            claims,
                expires:           DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        /// <summary>SHA-512 hash – same algorithm used by NewsSitePro.</summary>
        public static string HashPassword(string password)
        {
            using var sha512 = SHA512.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash  = sha512.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
