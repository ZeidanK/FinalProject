namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IAuthService
    {
        (string? Token, long Id, string Name, string Email, string Role) LogIn(string email, string password, IConfiguration config);
        (bool Success, long Id, string Error) Register(string name, string email, string password, string role = "business_owner");
    }
}
