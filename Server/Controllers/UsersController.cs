using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using FinalProjectAuthAPI.Realtime;
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
        private readonly IRealtimeNotificationService _realtime;
        private readonly IAccountantService _accountantSvc;

        public UsersController(
            IUserService svc,
            IFileStorageService fileStorage,
            IRealtimeNotificationService realtime,
            IAccountantService accountantSvc)
        {
            _svc = svc;
            _fileStorage = fileStorage;
            _realtime = realtime;
            _accountantSvc = accountantSvc;
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

            var ok = _svc.Update(id, request.Name, request.Phone, request.ProfilePicture,
                request.Bio, request.YearsOfExperience, request.HourlyRate, request.Location);
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

        // PATCH api/users/{id}/visibility
        [HttpPatch("{id:long}/visibility")]
        public async Task<IActionResult> UpdateVisibility(long id, [FromBody] UpdateVisibilityRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var currentRole = GetCurrentUserRole();
            if (currentUserId != id && !string.Equals(currentRole, "admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var ok = _svc.UpdateVisibility(id, request.IsPublic);
            if (!ok)
                return BadRequest(new { message = "Update failed." });

            var payload = new
            {
                userId = id,
                isPublic = request.IsPublic,
                message = $"Accountant visibility changed to {(request.IsPublic ? "public" : "private")}."
            };

            await _realtime.NotifyUserEventAsync(id,
                NotificationEventTypes.AccountantVisibilityChanged, payload);

            var activeCompanies = _accountantSvc.GetActiveCompanies(id);
            foreach (var company in activeCompanies)
            {
                await _realtime.NotifyCompanyEventAsync(company.Id,
                    NotificationEventTypes.AccountantVisibilityChanged, payload);
            }

            return Ok(new { message = "Visibility updated." });
        }

        // POST api/users/verify-password
        // Verify user's password (for account deletion confirmation)
        [HttpPost("verify-password")]
        public IActionResult VerifyPassword([FromBody] VerifyPasswordRequest request)
        {
            var userId = GetCurrentUserId();
            var ok = _svc.VerifyPassword(userId, request.Password);
            return ok
                ? Ok(new { message = "Password verified." })
                : Unauthorized(new { message = "Password is incorrect." });
        }

        // DELETE api/users/{id}
        // Soft-delete user account by disabling it while preserving data
        [HttpDelete("{id:long}")]
        public IActionResult DeleteAccount(long id)
        {
            var currentUserId = GetCurrentUserId();
            var currentRole = GetCurrentUserRole();

            // Users can only delete their own account; admins can delete any account
            if (currentUserId != id && !string.Equals(currentRole, "admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var ok = _svc.DeleteUserAccount(id);
            return ok
                ? Ok(new { message = "Account deleted successfully." })
                : BadRequest(new { message = "Failed to delete account." });
        }
    }
}
