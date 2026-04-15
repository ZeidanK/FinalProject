using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CompaniesController : ApiControllerBase
    {
        private readonly ICompanyService _svc;

        public CompaniesController(ICompanyService svc)
        {
            _svc = svc;
        }

        // GET api/companies
        [HttpGet]
        [Authorize(Roles = "admin,accountant,accountant_business_owner")]
        public IActionResult GetAll() =>
            Ok(_svc.GetAll());

        // GET api/companies/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var company = _svc.GetById(id);
            return company is null ? NotFound(new { message = "Company not found." }) : Ok(company);
        }

        // GET api/companies/user/{userId}
        [HttpGet("user/{userId:long}")]
        public IActionResult GetByUser(long userId) =>
            Ok(_svc.GetByUserId(userId));

        // POST api/companies
        [HttpPost]
        [Authorize(Roles = "admin,business_owner,accountant_business_owner")]
        public IActionResult Create([FromBody] CreateCompanyRequest request)
        {
            var currentUserId = GetCurrentUserId();
            var (success, id, error) = _svc.Create(
                request.Name, currentUserId,
                request.RegistrationNumber, request.Street, request.City,
                request.State, request.PostalCode, request.Country,
                request.Email, request.Phone, request.Website,
                request.TaxId, request.VatNumber, request.FiscalYearStart,
                request.Currency);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Company created." })
                : BadRequest(new { message = error });
        }

        // POST api/companies/{companyId}/access
        [HttpPost("{companyId:long}/access")]
        public IActionResult GrantAccess(long companyId)
        {
            var userId = GetCurrentUserId();
            var success = _svc.EnsureUserHasFullCompanyAccess(userId, companyId);
            return success
                ? Ok(new { message = "Company access granted." })
                : BadRequest(new { message = "Failed to grant company access." });
        }

        // PUT api/companies/{id}
        [HttpPut("{id:long}")]
        public IActionResult Update(long id, [FromBody] UpdateCompanyRequest request)
        {
            var ok = _svc.Update(id, request.Name, request.Street, request.City,
                request.State, request.PostalCode, request.Country,
                request.Email, request.Phone, request.Website,
                request.TaxId, request.VatNumber, request.IsActive);

            return ok ? Ok(new { message = "Company updated." }) : NotFound(new { message = "Company not found." });
        }

        // DELETE api/companies/{id}
        [HttpDelete("{id:long}")]
        public IActionResult Delete(long id)
        {
            var role = GetCurrentUserRole();
            var currentUserId = GetCurrentUserId();

            if (!string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
            {
                var canAccess = _svc.GetByUserId(currentUserId).Any(c => c.Id == id);
                if (!canAccess)
                    return Forbid();
            }

            var ok = _svc.Delete(id);
            return ok ? Ok(new { message = "Company deleted." }) : NotFound(new { message = "Company not found." });
        }
    }
}
