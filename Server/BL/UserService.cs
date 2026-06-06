using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// User management operations (profile reads/updates).
    /// Authentication operations remain in AuthService.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly DBservices _db;

        public UserService(DBservices db)
        {
            _db = db;
        }

        public User? GetById(long id) => _db.GetUserById(id);

        public List<User> GetAll() => _db.GetAllUsers();

        public bool Update(long id, string? name, string? phone, string? profilePicture)
        {
            if (name != null && string.IsNullOrWhiteSpace(name))
                return false;

            return _db.UpdateUser(id, name?.Trim(), phone?.Trim(), profilePicture);
        }

        public bool ChangePassword(long id, string currentPassword, string newPassword)
        {
            var storedHash = _db.GetPasswordHash(id);
            if (storedHash == null)
                return false;

            if (storedHash != User.HashPassword(currentPassword))
                return false;

            return _db.ChangePassword(id, User.HashPassword(newPassword));
        }

        public bool UpdateVisibility(long id, bool isPublic) =>
            _db.UpdateUserVisibility(id, isPublic);
    }
}
