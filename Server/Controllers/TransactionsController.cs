using FinalProjectAuthAPI.BL.Interfaces;
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
        private readonly ITransactionService _svc;
        private readonly IExcelExtractionService _excelSvc;
        private readonly IFileStorageService _fileSvc;

        public TransactionsController(
            ITransactionService svc,
            IExcelExtractionService excelSvc,
            IFileStorageService fileSvc)
        {
            _svc = svc;
            _excelSvc = excelSvc;
            _fileSvc = fileSvc;
        }

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
                ? StatusCode(201, new { count = ids.Count, ids, message = "Transactions created." })
                : BadRequest(new { message = error });
        }

        // POST api/transactions/preview-excel
        [HttpPost("preview-excel")]
        public IActionResult PreviewExcel(
            IFormFile file,
            [FromForm] long companyId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".xlsx" && extension != ".xls")
                return BadRequest(new { message = "Only Excel files (.xlsx, .xls) are accepted." });

            try
            {
                using var stream = file.OpenReadStream();
                var extractionResult = _excelSvc.Extract(stream, file.FileName);

                if (extractionResult.TotalExtracted == 0)
                    return BadRequest(new
                    {
                        message = "No transactions could be extracted from the file.",
                        sheets = extractionResult.Sheets
                    });

                return Ok(new UploadExcelResponse
                {
                    FileOriginalName = file.FileName,
                    FileSize = file.Length,
                    ExtractionResult = extractionResult
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to process Excel file: {ex.Message}" });
            }
        }

        // POST api/transactions/upload-excel
        [HttpPost("upload-excel")]
        public async Task<IActionResult> UploadExcel(
            IFormFile file,
            [FromForm] long companyId,
            [FromForm] long? bankAccountId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".xlsx" && extension != ".xls")
                return BadRequest(new { message = "Only Excel files (.xlsx, .xls) are accepted." });

            try
            {
                // 1. Save the file
                var (relativePath, _) = await _fileSvc.SaveExcelAsync(file, companyId);

                // 2. Extract transactions from the Excel file
                using var stream = file.OpenReadStream();
                var extractionResult = _excelSvc.Extract(stream, file.FileName);

                if (extractionResult.TotalExtracted == 0)
                    return BadRequest(new
                    {
                        message = "No transactions could be extracted from the file.",
                        filePath = relativePath,
                        sheets = extractionResult.Sheets
                    });

                // 3. Map extracted transactions to bulk create request
                var userId = GetCurrentUserId();
                var bulkRequest = new BulkCreateTransactionsRequest
                {
                    CompanyId = companyId,
                    CreatedByUserId = userId,
                    Transactions = extractionResult.Transactions.Select(t => new CreateTransactionRequest
                    {
                        CompanyId = companyId,
                        TransactionDate = t.TransactionDate,
                        PostedDate = t.PostedDate,
                        Description = t.Description,
                        Amount = t.Amount,
                        BalanceAfter = t.BalanceAfter,
                        TransactionType = t.TransactionType,
                        Category = t.Category,
                        ReferenceNumber = t.ReferenceNumber,
                        BankAccountId = bankAccountId,
                        CreatedByUserId = userId
                    }).ToList()
                };

                // 4. Bulk insert
                var (success, ids, error) = _svc.BulkCreate(bulkRequest, userId);

                if (!success)
                    return BadRequest(new { message = error, filePath = relativePath });

                return StatusCode(201, new UploadExcelResponse
                {
                    FileOriginalName = file.FileName,
                    FileSize = file.Length,
                    FilePath = relativePath,
                    ExtractionResult = extractionResult,
                    CreatedTransactionIds = ids
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to process Excel file: {ex.Message}" });
            }
        }

        private long GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }
    }
}
