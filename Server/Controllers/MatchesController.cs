using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MatchesController : ControllerBase
    {
        private readonly MatchService _svc = new();

        // GET api/matches/company/{companyId}
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(long companyId) =>
            Ok(_svc.GetByCompany(companyId));

        // GET api/matches/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var match = _svc.GetById(id);
            return match is null ? NotFound(new { message = "Match not found." }) : Ok(match);
        }

        // GET api/matches/suggestions/{invoiceId}
        [HttpGet("suggestions/{invoiceId:long}")]
        public IActionResult GetSuggestions(long invoiceId) =>
            Ok(_svc.GetSuggestions(invoiceId));

        // POST api/matches
        [HttpPost]
        public IActionResult Create([FromBody] CreateMatchRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, id, error) = _svc.Create(request, userId);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Match created." })
                : BadRequest(new { message = error });
        }

        // DELETE api/matches/{id}
        [HttpDelete("{id:long}")]
        public IActionResult Delete(long id)
        {
            var ok = _svc.Delete(id);
            return ok ? Ok(new { message = "Match deleted." }) : NotFound(new { message = "Match not found." });
        }

        private long GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }
    }
}
