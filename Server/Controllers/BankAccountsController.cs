using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BankAccountsController : ApiControllerBase
    {
        private readonly IBankAccountService _svc;
        private readonly IDBservices _db;

        public BankAccountsController(IBankAccountService svc, IDBservices db)
        {
            _svc = svc;
            _db = db;
        }

        // GET api/bankaccounts/company/{companyId}
        [HttpGet("company/{companyId:long}")]
        [ProducesResponseType(typeof(IEnumerable<BankAccountRow>), StatusCodes.Status200OK)]
        public IActionResult GetByCompany(long companyId)
        {
            if (!CanAccessCompany(companyId, _db))
                return Forbid();
            return Ok(_svc.GetByCompany(companyId));
        }

        // GET api/bankaccounts/{id}
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(BankAccountRow), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetById(long id)
        {
            var account = _svc.GetById(id);
            if (account is null)
                return NotFound(new { message = "Bank account not found." });
            if (!CanAccessCompany(account.CompanyId, _db))
                return Forbid();
            return Ok(account);
        }

        // POST api/bankaccounts
        [HttpPost]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public IActionResult Create([FromBody] CreateBankAccountRequest request)
        {
            if (!CanAccessCompany(request.CompanyId, _db))
                return Forbid();

            var (success, id, error) = _svc.Create(
                request.CompanyId, request.BankName, request.AccountType,
                request.CreatedByUserId, request.AccountName,
                request.AccountNumberMasked, request.Currency, request.Balance);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Bank account created." })
                : BadRequest(new { message = error });
        }

        // PUT api/bankaccounts/{id}
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult Update(long id, [FromBody] UpdateBankAccountRequest request)
        {
            var account = _svc.GetById(id);
            if (account is null)
                return NotFound(new { message = "Bank account not found." });
            if (!CanAccessCompany(account.CompanyId, _db))
                return Forbid();

            var ok = _svc.Update(id, request.BankName, request.AccountName,
                request.AccountNumberMasked, request.AccountType,
                request.Currency, request.IsActive, request.Balance,
                request.LastSyncAt);

            return ok ? Ok(new { message = "Bank account updated." }) : NotFound(new { message = "Bank account not found." });
        }

        // DELETE api/bankaccounts/{id}
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult Delete(long id)
        {
            var account = _svc.GetById(id);
            if (account is null)
                return NotFound(new { message = "Bank account not found." });
            if (!CanAccessCompany(account.CompanyId, _db))
                return Forbid();

            var ok = _svc.Delete(id);
            return ok ? Ok(new { message = "Bank account deactivated." }) : NotFound(new { message = "Bank account not found." });
        }
    }
}
