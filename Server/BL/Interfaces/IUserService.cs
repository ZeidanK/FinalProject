using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IUserService
    {
        User? GetById(long id);
        List<User> GetAll();
        bool Update(long id, string? name, string? phone, string? profilePicture);
        bool ChangePassword(long id, string currentPassword, string newPassword);
        bool UpdateVisibility(long id, bool isPublic);
        bool VerifyPassword(long userId, string password);
        bool DeleteUserAccount(long userId);
    }
}
