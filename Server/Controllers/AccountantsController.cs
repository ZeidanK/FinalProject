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

        // GET api/accountants/paginated?companyId={id}&page=1&limit=20&search=&sortBy=name&sortDirection=ASC
        // Paginated directory with search, sort, and enriched profile data.
        [HttpGet("paginated")]
        public IActionResult GetPublicPaginated(
            [FromQuery] long? companyId,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "name",
            [FromQuery] string? sortDirection = "ASC")
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var result = _svc.GetPublicAccountantsPaginated(companyId, page, limit, search, sortBy, sortDirection);
            return Ok(result);
        }

        // POST api/accountants/{accountantId}/request
        // Business owner sends a work request to a public accountant.
        [HttpPost("{accountantId:long}/request")]
        [Authorize(Roles = "business_owner,accountant_business_owner,admin")]
        public async Task<IActionResult> SendRequest(long accountantId, [FromBody] SendWorkRequestRequest request)
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

                var requestRow = _svc.GetPendingRequests(accountantId)
                    .FirstOrDefault(r => r.CompanyId == request.CompanyId);
                var notificationOccurrence = DateTime.UtcNow.Ticks;
                await _realtime.CreateUserNotificationAsync(accountantId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AccountantRequestSent,
                    Title = "New work request",
                    Body = "A business has sent you a new work request.",
                    Severity = "info",
                    TargetType = NotificationTargetTypes.AccountantRequest,
                    TargetId = requestRow?.Id.ToString(),
                    DedupeKey = requestRow == null ? null : $"accountant-request:{requestRow.Id}:sent:{notificationOccurrence}",
                }, payload, request.CompanyId);
                await _realtime.NotifyGroupEventAsync(
                    RealtimeGroups.CompanyOwners(request.CompanyId),
                    NotificationEventTypes.AccountantRequestSent,
                    payload);
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
        public async Task<IActionResult> Respond(long requestId, [FromBody] RespondToRequestRequest request)
        {
            var accountantId = GetCurrentUserId();
            var requestRow = _svc.GetPendingRequests(accountantId).FirstOrDefault(r => r.Id == requestId);
            var ok = _svc.RespondToRequest(requestId, accountantId, request.Accept);

            if (ok && requestRow != null)
            {
                var eventType = request.Accept
                    ? NotificationEventTypes.AccountantRequestAccepted
                    : NotificationEventTypes.AccountantRequestDeclined;
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
                var notificationOccurrence = DateTime.UtcNow.Ticks;

                var notification = new NotificationMessage
                {
                    EventType = eventType,
                    Title = notifTitle,
                    Body = notifBody,
                    Severity = notifSev,
                    TargetType = NotificationTargetTypes.Accountant,
                    TargetId = accountantId.ToString(),
                    DedupeKey = $"accountant-request:{requestId}:{(request.Accept ? "accepted" : "declined")}:{notificationOccurrence}",
                };
                await _realtime.CreateUserNotificationAsync(
                    requestRow.RequestedByUserId, notification, payload, requestRow.CompanyId);
                await _realtime.CreateCompanyNotificationAsync(
                    requestRow.CompanyId, notification, payload, requestRow.RequestedByUserId, accountantId);
            }

            return ok
                ? Ok(new { message = request.Accept ? "Request accepted." : "Request declined." })
                : BadRequest(new { message = "Request not found or already responded to." });
        }

        // DELETE api/accountants/{accountantId}/request?companyId={companyId}
        // Business owner cancels a pending work request before the accountant responds.
        [HttpDelete("{accountantId:long}/request")]
        [Authorize(Roles = "business_owner,accountant_business_owner,admin")]
        public async Task<IActionResult> CancelRequest(long accountantId, [FromQuery] long companyId)
        {
            if (companyId <= 0)
                return BadRequest(new { message = "CompanyId is required." });

            var requestedByUserId = GetCurrentUserId();
            var (success, error) = _svc.CancelRequest(accountantId, companyId, requestedByUserId);

            if (success)
            {
                var payload = new
                {
                    accountantId,
                    companyId,
                    cancelledByUserId = requestedByUserId,
                    message = "Work request cancelled by the sender."
                };
                var notificationOccurrence = DateTime.UtcNow.Ticks;

                await _realtime.CreateUserNotificationAsync(accountantId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AccountantRequestCancelled,
                    Title = "Work request cancelled",
                    Body = "A business owner has cancelled their work request.",
                    Severity = "info",
                    TargetType = NotificationTargetTypes.AccountantRequest,
                    TargetId = companyId.ToString(),
                    DedupeKey = $"accountant-request:{accountantId}:{companyId}:cancelled:{notificationOccurrence}",
                }, payload, companyId);
            }

            return success
                ? Ok(new { message = "Request cancelled successfully." })
                : BadRequest(new { message = error });
        }

        // DELETE api/accountants/{accountantId}/connection?companyId={companyId}
        // Business owner/admin disconnects from an accountant, or accountant removes themselves.
        [HttpDelete("{accountantId:long}/connection")]
        [Authorize(Roles = "business_owner,accountant_business_owner,admin,accountant")]
        public async Task<IActionResult> Disconnect(long accountantId, [FromQuery] long companyId)
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
                var notificationOccurrence = DateTime.UtcNow.Ticks;

                await _realtime.RevokeCompanyAccessAsync(accountantId, companyId);
                await _realtime.CreateUserNotificationAsync(accountantId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AccountantDisconnected,
                    Title = "Removed from company",
                    Body = "You have been disconnected from a company.",
                    Severity = "warning",
                    TargetType = NotificationTargetTypes.Company,
                    TargetId = companyId.ToString(),
                    DedupeKey = $"accountant-company:{accountantId}:{companyId}:disconnected:{notificationOccurrence}",
                }, payload, companyId);
                await _realtime.CreateCompanyNotificationAsync(companyId, new NotificationMessage
                {
                    EventType = NotificationEventTypes.AccountantDisconnected,
                    Title = "Accountant disconnected",
                    Body = "An accountant has been removed from your company.",
                    Severity = "warning",
                    TargetType = NotificationTargetTypes.Accountant,
                    TargetId = accountantId.ToString(),
                    DedupeKey = $"company-accountant:{accountantId}:{companyId}:disconnected:{notificationOccurrence}",
                }, payload, accountantId);
            }

            return ok ? Ok(new { message = "Accountant disconnected successfully." }) : BadRequest(new { message = "Failed to disconnect accountant." });
        }

        // GET api/accountants/{id}/specialties
        // Fetch all specialties for an accountant.
        [HttpGet("{id:long}/specialties")]
        public IActionResult GetSpecialties(long id)
        {
            if (GetCurrentUserId() != id)
                return Forbid();
            return Ok(_svc.GetSpecialties(id));
        }

        // POST api/accountants/{id}/specialties
        // Add a specialty to an accountant's profile.
        [HttpPost("{id:long}/specialties")]
        public IActionResult AddSpecialty(long id, [FromBody] SpecialtyRequest request)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            var ok = _svc.AddSpecialty(id, request.Specialty);

            return ok
                ? Ok(new { message = "Specialty added." })
                : BadRequest(new { message = "Failed to add specialty." });
        }

        // DELETE api/accountants/{id}/specialties?specialty={specialty}
        // Remove a specialty from an accountant's profile.
        [HttpDelete("{id:long}/specialties")]
        public IActionResult RemoveSpecialty(long id, [FromQuery] string specialty)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            if (string.IsNullOrWhiteSpace(specialty))
                return BadRequest(new { message = "Specialty is required." });

            var ok = _svc.RemoveSpecialty(id, specialty);

            return ok
                ? Ok(new { message = "Specialty removed." })
                : BadRequest(new { message = "Failed to remove specialty." });
        }

        // GET api/accountants/{id}/certifications
        // Fetch all certifications for an accountant.
        [HttpGet("{id:long}/certifications")]
        public IActionResult GetCertifications(long id)
        {
            if (GetCurrentUserId() != id)
                return Forbid();
            return Ok(_svc.GetCertifications(id));
        }

        // POST api/accountants/{id}/certifications
        // Add a certification to an accountant's profile.
        [HttpPost("{id:long}/certifications")]
        public IActionResult AddCertification(long id, [FromBody] CertificationRequest request)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            var ok = _svc.AddCertification(id, request.Certification);

            return ok
                ? Ok(new { message = "Certification added." })
                : BadRequest(new { message = "Failed to add certification." });
        }

        // DELETE api/accountants/{id}/certifications?certification={certification}
        // Remove a certification from an accountant's profile.
        [HttpDelete("{id:long}/certifications")]
        public IActionResult RemoveCertification(long id, [FromQuery] string certification)
        {
            if (GetCurrentUserId() != id)
                return Forbid();

            if (string.IsNullOrWhiteSpace(certification))
                return BadRequest(new { message = "Certification is required." });

            var ok = _svc.RemoveCertification(id, certification);

            return ok
                ? Ok(new { message = "Certification removed." })
                : BadRequest(new { message = "Failed to remove certification." });
        }

        // GET api/accountants/{id}/reviews
        // Returns all reviews for a given accountant.
        [HttpGet("{id:long}/reviews")]
        public IActionResult GetReviews(long id) =>
            Ok(_svc.GetReviews(id));

        // POST api/accountants/{id}/reviews
        // Submit or update a review for an accountant (by a business owner).
        [HttpPost("{id:long}/reviews")]
        [Authorize(Roles = "business_owner,accountant_business_owner,admin")]
        public IActionResult SubmitReview(long id, [FromBody] SubmitReviewRequest request)
        {
            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5." });

            var currentUserId = GetCurrentUserId();
            var ok = _svc.SubmitReview(id, request.CompanyId, request.Rating, request.Review, currentUserId);

            return ok
                ? Ok(new { message = "Review submitted." })
                : BadRequest(new { message = "Failed to submit review." });
        }
    }
}
