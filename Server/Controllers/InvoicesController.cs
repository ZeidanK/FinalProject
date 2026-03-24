using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly InvoiceService _svc = new();

        // GET api/invoices/company/{companyId}?status=&startDate=&endDate=&isMatched=
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(
            long companyId,
            [FromQuery] string? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] bool? isMatched) =>
            Ok(_svc.GetByCompany(companyId, status, startDate, endDate, isMatched));

        // GET api/invoices/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var invoice = _svc.GetById(id);
            return invoice is null ? NotFound(new { message = "Invoice not found." }) : Ok(invoice);
        }

        // POST api/invoices
        [HttpPost]
        public IActionResult Create([FromBody] CreateInvoiceRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, id, error) = _svc.Create(request, userId);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Invoice created." })
                : BadRequest(new { message = error });
        }

        // PATCH api/invoices/{id}/status
        [HttpPatch("{id:long}/status")]
        public IActionResult UpdateStatus(long id, [FromBody] UpdateInvoiceStatusRequest request)
        {
            var ok = _svc.UpdateStatus(id, request.Status);
            return ok ? Ok(new { message = "Invoice status updated." }) : BadRequest(new { message = "Invalid status or invoice not found." });
        }

        private long GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }
    }
}
