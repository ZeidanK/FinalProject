using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class AuthService : IAuthService
    {
        private readonly DBservices _db;
        private readonly IConfiguration _config;

        public AuthService(DBservices db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public (string? Token, long Id, string Name, string Email, string Role) LogIn(
            string email, string password)
        {
            var user = _db.GetUserByEmail(email);
            if (user == null)
                return (null, 0, string.Empty, string.Empty, string.Empty);

            // Important: never reactivate before verifying password.
            if (user.PasswordHash != User.HashPassword(password))
                return (null, 0, string.Empty, string.Empty, string.Empty);

            if (!user.IsActive)
            {
                _db.ReactivateUserAccount(user.Id);
                // Re-read to ensure token claims reflect latest data (optional but safe).
                user = _db.GetUserById(user.Id) ?? user;
            }

            _db.UpdateLastLogin(user.Id);
            var token = user.GenerateJwtToken(_config);
            return (token, user.Id, user.Name, user.Email, user.Role);
        }


        public (bool Success, long Id, string Error) Register(
            string name, string email, string password, string role = "business_owner")
        {
            if (_db.GetUserByEmail(email) != null)
                return (false, 0, "Registration failed. A user with this email may already exist.");

            var user = new User
            {
                Name = name,
                Email = email,
                PasswordHash = User.HashPassword(password),
                Role = role,
                IsActive = true
            };

            var success = _db.CreateUser(user);

            if (!success)
                return (false, 0, "Registration failed. A user with this email may already exist.");

            return (true, user.Id, string.Empty);
        }
    }
}
