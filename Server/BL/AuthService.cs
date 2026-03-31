using FinalProjectAuthAPI.BL.Interfaces;

namespace FinalProjectAuthAPI.BL
{
    public class AuthService : IAuthService
    {
        public (string? Token, long Id, string Name, string Email, string Role) LogIn(
            string email, string password, IConfiguration config)
        {
            var user = new User();
            var token = user.LogIn(email, password, config);

            if (token == null)
                return (null, 0, string.Empty, string.Empty, string.Empty);

            return (token, user.Id, user.Name, user.Email, user.Role);
        }

        public (bool Success, long Id, string Error) Register(
            string name, string email, string password, string role = "business_owner")
        {
            var user = new User();
            bool success = user.Register(name, email, password, role);

            if (!success)
                return (false, 0, "Registration failed. A user with this email may already exist.");

            return (true, user.Id, string.Empty);
        }
    }
}
