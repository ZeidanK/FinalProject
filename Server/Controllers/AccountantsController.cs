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
    public class AccountantsController : ApiControllerBase
    {
        private readonly IAccountantService _svc;
        private readonly IRealtimeNotificationService _realtime;

        public AccountantsController(IAccountantService svc, IRealtimeNotificationService realtime)
        {
            _svc = svc;
            _realtime = realtime;
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

            if (success)
            {
                var payload = new
                {
                    accountantId,
                    companyId = request.CompanyId,
                    requestedByUserId,
                    message = "New accountant work request submitted."
                };

                _ = _realtime.NotifyUserEventAsync(accountantId, "accountant.request.sent", payload,
                    title: "New work request",
                    body: "A business has sent you a new work request.",
                    severity: "info",
                    companyId: request.CompanyId,
                    link: "/accountant-workspace");
                _ = _realtime.NotifyGroupEventAsync(RealtimeGroups.CompanyOwners(request.CompanyId), "accountant.request.sent", payload);
            }

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
            var requestRow = _svc.GetPendingRequests(accountantId).FirstOrDefault(r => r.Id == requestId);
            var ok = _svc.RespondToRequest(requestId, accountantId, request.Accept);

            if (ok && requestRow != null)
            {
                var eventType = request.Accept ? "accountant.request.accepted" : "accountant.request.declined";
                var payload = new
                {
                    requestId,
                    accountantId,
                    requestedByUserId = requestRow.RequestedByUserId,
                    requestRow.CompanyId,
                    requestRow.CompanyName,
                    accepted = request.Accept
                };

                var notifTitle = request.Accept ? "Accountant request accepted" : "Accountant request declined";
                var notifBody  = request.Accept
                    ? $"An accountant accepted your work request for company {requestRow.CompanyName}."
                    : $"An accountant declined your work request for company {requestRow.CompanyName}.";
                var notifSev   = request.Accept ? "success" : "warning";

                _ = _realtime.NotifyUserEventAsync(requestRow.RequestedByUserId, eventType, payload,
                    title: notifTitle, body: notifBody, severity: notifSev,
                    companyId: requestRow.CompanyId, link: "/find-accountant");
                _ = _realtime.NotifyCompanyEventAsync(requestRow.CompanyId, eventType, payload,
                    title: notifTitle, body: notifBody, severity: notifSev, link: "/find-accountant");
            }

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

            if (ok)
            {
                var payload = new
                {
                    accountantId,
                    companyId,
                    disconnectedByUserId = currentUserId,
                    disconnectedByRole = currentRole,
                    message = "Accountant-company connection revoked."
                };

                _ = _realtime.NotifyUserEventAsync(accountantId, "accountant.connection.disconnected", payload,
                    title: "Removed from company",
                    body: "You have been disconnected from a company.",
                    severity: "warning",
                    companyId: companyId);
                _ = _realtime.NotifyCompanyEventAsync(companyId, "accountant.connection.disconnected", payload,
                    title: "Accountant disconnected",
                    body: "An accountant has been removed from your company.",
                    severity: "warning");
            }

            return ok ? Ok(new { message = "Accountant disconnected successfully." }) : BadRequest(new { message = "Failed to disconnect accountant." });
        }
    }
}
