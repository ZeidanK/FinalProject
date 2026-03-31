using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BankAccountsController : ControllerBase
    {
        private readonly IBankAccountService _svc;

        public BankAccountsController(IBankAccountService svc)
        {
            _svc = svc;
        }

        // GET api/bankaccounts/company/{companyId}
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(long companyId) =>
            Ok(_svc.GetByCompany(companyId));

        // GET api/bankaccounts/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var account = _svc.GetById(id);
            return account is null ? NotFound(new { message = "Bank account not found." }) : Ok(account);
        }

        // POST api/bankaccounts
        [HttpPost]
        public IActionResult Create([FromBody] CreateBankAccountRequest request)
        {
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
        public IActionResult Update(long id, [FromBody] UpdateBankAccountRequest request)
        {
            var ok = _svc.Update(id, request.BankName, request.AccountName,
                request.AccountNumberMasked, request.AccountType,
                request.Currency, request.IsActive, request.Balance,
                request.LastSyncAt);

            return ok ? Ok(new { message = "Bank account updated." }) : NotFound(new { message = "Bank account not found." });
        }

        // DELETE api/bankaccounts/{id}
        [HttpDelete("{id:long}")]
        public IActionResult Delete(long id)
        {
            var ok = _svc.Delete(id);
            return ok ? Ok(new { message = "Bank account deactivated." }) : NotFound(new { message = "Bank account not found." });
        }
    }
}
