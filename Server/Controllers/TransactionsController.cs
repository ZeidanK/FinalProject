using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly TransactionService _svc = new();

        // GET api/transactions/company/{companyId}?type=&isMatched=&startDate=&endDate=
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(
            long companyId,
            [FromQuery] string? type,
            [FromQuery] bool? isMatched,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate) =>
            Ok(_svc.GetByCompany(companyId, type, isMatched, startDate, endDate));

        // GET api/transactions/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var txn = _svc.GetById(id);
            return txn is null ? NotFound(new { message = "Transaction not found." }) : Ok(txn);
        }

        // POST api/transactions
        [HttpPost]
        public IActionResult Create([FromBody] CreateTransactionRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, id, error) = _svc.Create(request, userId);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Transaction created." })
                : BadRequest(new { message = error });
        }

        // POST api/transactions/bulk
        [HttpPost("bulk")]
        public IActionResult BulkCreate([FromBody] BulkCreateTransactionsRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, ids, error) = _svc.BulkCreate(request, userId);

            return success
                ? Ok(new { count = ids.Count, ids, message = "Transactions created." })
                : BadRequest(new { message = error });
        }

        private long GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }
    }
}
