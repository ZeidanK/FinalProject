using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ApiControllerBase
    {
        private readonly IUserService _svc;
        private readonly IFileStorageService _fileStorage;

        public UsersController(IUserService svc, IFileStorageService fileStorage)
        {
            _svc = svc;
            _fileStorage = fileStorage;
        }

        // GET api/users
        [HttpGet]
        [Authorize(Roles = "admin")]
        public IActionResult GetAll() =>
            Ok(_svc.GetAll());

        // GET api/users/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var user = _svc.GetById(id);
            return user is null ? NotFound(new { message = "User not found." }) : Ok(user);
        }

        // PUT api/users/{id}
        [HttpPut("{id:long}")]
        public IActionResult Update(long id, [FromBody] UpdateUserRequest request)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            var ok = _svc.Update(id, request.Name, request.Phone, request.ProfilePicture);
            return ok ? Ok(new { message = "User updated." }) : BadRequest(new { message = "Update failed or no valid fields provided." });
        }

        // PATCH api/users/{id}/password
        [HttpPatch("{id:long}/password")]
        public IActionResult ChangePassword(long id, [FromBody] ChangePasswordRequest request)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            var ok = _svc.ChangePassword(id, request.CurrentPassword, request.NewPassword);
            return ok
                ? Ok(new { message = "Password changed successfully." })
                : BadRequest(new { message = "Current password is incorrect or update failed." });
        }

        // POST api/users/{id}/profile-picture
        [HttpPost("{id:long}/profile-picture")]
        public async Task<IActionResult> UploadProfilePicture(long id, IFormFile file)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            try
            {
                var (relativePath, _) = await _fileStorage.SaveProfilePictureAsync(file, id);
                var ok = _svc.Update(id, null, null, relativePath);
                if (!ok)
                    return StatusCode(500, new { message = "File saved but profile update failed." });

                return Ok(new { message = "Profile picture updated.", profilePicture = relativePath });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
