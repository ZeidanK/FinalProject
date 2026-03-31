using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CompaniesController : ControllerBase
    {
        private readonly ICompanyService _svc;

        public CompaniesController(ICompanyService svc)
        {
            _svc = svc;
        }

        // GET api/companies
        [HttpGet]
        [Authorize(Roles = "admin")]
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
        public IActionResult Create([FromBody] CreateCompanyRequest request)
        {
            var (success, id, error) = _svc.Create(
                request.Name, request.CreatedByUserId,
                request.RegistrationNumber, request.Street, request.City,
                request.State, request.PostalCode, request.Country,
                request.Email, request.Phone, request.Website,
                request.TaxId, request.VatNumber, request.FiscalYearStart,
                request.Currency);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Company created." })
                : BadRequest(new { message = error });
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
    }
}
