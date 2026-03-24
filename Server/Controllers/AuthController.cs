using System.IdentityModel.Tokens.Jwt;
using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        // POST api/auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user  = new User();
            var token = user.LogIn(request.Email, request.Password, _config);

            if (token == null)
                return Unauthorized(new { message = "Invalid credentials or account is inactive." });

            return Ok(new
            {
                token,
                user = new { id = user.Id, name = user.Name, email = user.Email, role = user.Role }
            });
        }

        private static readonly HashSet<string> ValidRoles = new()
        {
            "business_owner",
            "accountant",
            "admin",
            "accountant_business_owner"
        };

        // POST api/auth/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (!ValidRoles.Contains(request.Role))
                return BadRequest(new { message = $"Invalid role '{request.Role}'. Valid roles: {string.Join(", ", ValidRoles)}" });

            try
            {
                var user    = new User();
                bool success = user.Register(request.Name, request.Email, request.Password, request.Role);

                if (!success)
                    return BadRequest(new { message = "Registration failed. A user with this email may already exist." });

                return Ok(new { message = "Registration successful.", userId = user.Id });
            }
            catch (System.Data.SqlClient.SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                // Unique constraint violation
                return BadRequest(new { message = "A user with this email already exists." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Registration failed due to a server error." });
            }
        }

        // POST api/auth/validate
        // Reads the JWT from the Authorization header and returns the decoded claims.
        // Does NOT re-validate the signature – use the [Authorize] attribute for that.
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

                return Ok(new { message = "Token is valid.", id, name, email, role });
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = $"Token validation failed: {ex.Message}" });
            }
        }
    }
}
