using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ApiControllerBase
    {
        private readonly IAuthService _authSvc;
        private readonly IActivityLogService _activityLog;

        public AuthController(IAuthService authSvc, IActivityLogService activityLog)
        {
            _authSvc = authSvc;
            _activityLog = activityLog;
        }

        // POST api/auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var (token, id, name, email, role) = _authSvc.LogIn(request.Email, request.Password);

            if (token == null)
                return Unauthorized(new { message = "Invalid credentials or account is inactive." });

            var payload = new
            {
                token,
                user = new { id, name, email, role }
            };

            _activityLog.LogAudit(new CreateAuditLogRequest
            {
                UserId = id,
                Action = "auth.login",
                EntityType = "User",
                EntityId = id,
                NewValue = JsonSerializer.Serialize(new { email, role }),
                IpAddress = GetIpAddress()
            });

            return SuccessWithLegacy(payload, payload, "Login successful.");
        }

        private static readonly HashSet<string> ValidRoles = new()
        {
            "business_owner",
            "accountant"
        };

        // POST api/auth/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (!ValidRoles.Contains(request.Role))
                return BadRequest(new { message = $"Invalid role '{request.Role}'. Valid roles: {string.Join(", ", ValidRoles)}" });

            try
            {
                var (success, userId, error) = _authSvc.Register(request.Name, request.Email, request.Password, request.Role);

                if (!success)
                    return BadRequest(new { message = error });

                _activityLog.LogAudit(new CreateAuditLogRequest
                {
                    UserId = userId,
                    Action = "auth.register",
                    EntityType = "User",
                    EntityId = userId,
                    NewValue = JsonSerializer.Serialize(new { request.Email, request.Role }),
                    IpAddress = GetIpAddress()
                });

                var payload = new { userId };
                return StatusCode(201, new
                {
                    success = true,
                    code = 201,
                    message = "Registration successful.",
                    data = payload,
                    userId
                });
            }
            catch (System.Data.SqlClient.SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                // Unique constraint violation
                return BadRequest(new { message = "A user with this email already exists." });
            }
            catch (Exception ex)
            {
                _activityLog.LogSystem(new CreateSystemLogRequest
                {
                    Level = "ERROR",
                    Category = "security",
                    Message = "Registration failed because of a server error",
                    Details = JsonSerializer.Serialize(new
                    {
                        request.Email,
                        request.Role,
                        error = ex.Message
                    }),
                    IpAddress = GetIpAddress()
                });
                return StatusCode(500, new { message = "Registration failed due to a server error." });
            }
        }

        private string? GetIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedFor))
                return forwardedFor.Split(',')[0].Trim();

            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        // POST api/auth/validate
        // Reads the JWT from the Authorization header and returns the decoded claims.
        // Does NOT re-validate the signature – use the [Authorize] attribute for that.
        [Authorize]
        [HttpPost("validate")]
        public IActionResult Validate([FromHeader(Name = "Authorization")] string? authHeader)
        {
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { message = "Missing or invalid Authorization header." });

            var jwt = authHeader["Bearer ".Length..].Trim();

            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (!handler.CanReadToken(jwt))
                    return Unauthorized(new { message = "Invalid token format." });

                var token = handler.ReadJwtToken(jwt);

                if (token.ValidTo < DateTime.UtcNow)
                    return Unauthorized(new { message = "Token has expired." });

                var id    = token.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
                var name  = token.Claims.FirstOrDefault(c => c.Type == "name")?.Value;
                var email = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
                var role  = token.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

                var payload = new { id, name, email, role };
                return SuccessWithLegacy(payload, payload, "Token is valid.");
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = $"Token validation failed: {ex.Message}" });
            }
        }
    }
}
