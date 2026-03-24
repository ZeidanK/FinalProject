using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserService _svc = new();

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
            var ok = _svc.Update(id, request.Name, request.Phone, request.ProfilePicture);
            return ok ? Ok(new { message = "User updated." }) : BadRequest(new { message = "Update failed or no valid fields provided." });
        }
    }
}
