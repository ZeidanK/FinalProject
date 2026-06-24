using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccountantsController : ApiControllerBase
    {
        private readonly IAccountantService _svc;

        public AccountantsController(IAccountantService svc)
        {
            _svc = svc;
        }

        // GET api/accountants?companyId={id}
        // Returns all public accountants. Passes optional companyId to embed requestStatus.
        [HttpGet]
        public IActionResult GetPublic([FromQuery] long? companyId) =>
            Ok(_svc.GetPublicAccountants(companyId));

        // POST api/accountants/{accountantId}/request
        // Business owner sends a work request to a public accountant.
        [HttpPost("{accountantId:long}/request")]
        [Authorize(Roles = "business_owner,accountant_business_owner,admin")]
        public IActionResult SendRequest(long accountantId, [FromBody] SendWorkRequestRequest request)
        {
            var requestedByUserId = GetCurrentUserId();
            var (success, error) = _svc.SendRequest(accountantId, request.CompanyId, requestedByUserId);
            return success
                ? Ok(new { message = "Request sent successfully." })
                : BadRequest(new { message = error });
        }

        // GET api/accountants/{id}/requests
        // Accountant retrieves their pending work requests.
        [HttpGet("{id:long}/requests")]
        public IActionResult GetRequests(long id)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            return Ok(_svc.GetPendingRequests(id));
        }

        // GET api/accountants/{id}/companies
        // Accountant retrieves the companies they are actively working with.
        [HttpGet("{id:long}/companies")]
        public IActionResult GetCompanies(long id)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            return Ok(_svc.GetActiveCompanies(id));
        }

        // PATCH api/accountants/requests/{requestId}/respond
        // Accountant accepts or declines a pending work request.
        [HttpPatch("requests/{requestId:long}/respond")]
        public IActionResult Respond(long requestId, [FromBody] RespondToRequestRequest request)
        {
            var accountantId = GetCurrentUserId();
            var ok = _svc.RespondToRequest(requestId, accountantId, request.Accept);
            return ok
                ? Ok(new { message = request.Accept ? "Request accepted." : "Request declined." })
                : BadRequest(new { message = "Request not found or already responded to." });
        }

        // DELETE api/accountants/{accountantId}/connection?companyId={companyId}
        // Business owner/admin disconnects from an accountant, or accountant removes themselves.
        [HttpDelete("{accountantId:long}/connection")]
        [Authorize(Roles = "business_owner,accountant_business_owner,admin,accountant")]
        public IActionResult Disconnect(long accountantId, [FromQuery] long companyId)
        {
            if (companyId <= 0)
                return BadRequest(new { message = "CompanyId is required." });

            var currentUserId = GetCurrentUserId();
            var currentRole = GetCurrentUserRole();

            // Accountants can only remove themselves; others (business_owner, admin) can remove any accountant
            if (currentRole == "accountant" && accountantId != currentUserId)
                return Forbid();

            var ok = _svc.DisconnectAccountant(accountantId, companyId, currentUserId);
            return ok ? Ok(new { message = "Accountant disconnected successfully." }) : BadRequest(new { message = "Failed to disconnect accountant." });
        }
    }
}
