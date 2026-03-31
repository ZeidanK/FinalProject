using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// User management operations (profile reads/updates).
    /// Authentication operations remain in User.cs.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly DBservices _db = new();

        public User? GetById(long id) => _db.GetUserById(id);

        public List<User> GetAll() => _db.GetAllUsers();

        public bool Update(long id, string? name, string? phone, string? profilePicture)
        {
            if (name != null && string.IsNullOrWhiteSpace(name))
                return false;

            return _db.UpdateUser(id, name?.Trim(), phone?.Trim(), profilePicture);
        }
    }
}
