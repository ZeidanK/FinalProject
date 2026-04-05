using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IUserService
    {
        User? GetById(long id);
        List<User> GetAll();
        bool Update(long id, string? name, string? phone, string? profilePicture);
        bool ChangePassword(long id, string currentPassword, string newPassword);
    }
}
