using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionsController : ApiControllerBase
    {
        private readonly ITransactionService _svc;
        private readonly IExcelExtractionService _excelSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly IUploadJobService _jobSvc;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IDBservices _db;

        public TransactionsController(
            ITransactionService svc,
            IExcelExtractionService excelSvc,
            IFileStorageService fileSvc,
            IUploadJobService jobSvc,
            IBackgroundJobClient backgroundJobClient,
            IDBservices db)
        {
            _svc = svc;
            _excelSvc = excelSvc;
            _fileSvc = fileSvc;
            _jobSvc = jobSvc;
            _backgroundJobClient = backgroundJobClient;
            _db = db;
        }

        // GET api/transactions/company/{companyId}?type=&isMatched=&startDate=&endDate=&pageNumber=&pageSize=&sortBy=&sortDirection=&searchTerm=&requiresInvoice=&category=
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(
            long companyId,
            [FromQuery] TransactionFilterRequest filter) =>
            Ok(_svc.GetByCompany(companyId, filter ?? new TransactionFilterRequest()));

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

        // PATCH api/transactions/{id}/requires-invoice
        [HttpPatch("{id:long}/requires-invoice")]
        public IActionResult SetRequiresInvoice(long id, [FromBody] SetRequiresInvoiceRequest request)
        {
            var ok = _svc.SetRequiresInvoice(id, request.RequiresInvoice);
            return ok
                ? Ok(new { message = $"Transaction requires_invoice set to {request.RequiresInvoice}." })
                : NotFound(new { message = "Transaction not found." });
        }

        // DELETE api/transactions/{id}
        [HttpDelete("{id:long}")]
        public IActionResult Delete(long id)
        {
            var ok = _svc.Delete(id);
            return ok
                ? Ok(new { message = "Transaction deleted." })
                : NotFound(new { message = "Transaction not found." });
        }

        // DELETE api/transactions/bulk
        [HttpDelete("bulk")]
        public IActionResult BulkDelete([FromBody] BulkDeleteTransactionsRequest request)
        {
            if (request?.Ids == null || request.Ids.Count == 0)
                return BadRequest(new { message = "At least one transaction ID is required." });

            var (deletedIds, notFoundIds) = _svc.BulkDelete(request.Ids);
            var deletedCount = deletedIds.Count;
            var notFoundCount = notFoundIds.Count;

            return Ok(new
            {
                deletedCount,
                notFoundCount,
                deletedIds,
                notFoundIds,
                message = notFoundCount == 0
                    ? "Transactions deleted."
                    : "Bulk delete completed with partial success."
            });
        }

        // POST api/transactions/preview-excel
        [HttpPost("preview-excel")]
        public async Task<IActionResult> PreviewExcel(
            IFormFile file,
            [FromForm] long companyId)
        {
            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                return Forbid();

            var validationError = ValidateExcelFile(file);
            if (validationError != null)
                return validationError;

            try
            {
                // Save the file so it can be imported later by path
                var (relativePath, _) = await _fileSvc.SaveExcelAsync(file, companyId);

                var (extractionResult, extractionError) = TryExtractExcel(file);
                if (extractionError != null)
                    return extractionError;

                return Ok(new UploadExcelResponse
                {
                    FileOriginalName = file.FileName,
                    FileSize = file.Length,
                    FilePath = relativePath,
                    ExtractionResult = extractionResult!
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

        // POST api/transactions/import-excel
        [HttpPost("import-excel")]
        public IActionResult ImportExcel([FromBody] ImportExcelRequest request)
        {
            if (request == null || request.CompanyId <= 0)
                return BadRequest(new { message = "A valid companyId is required." });

            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, request.CompanyId))
                return Forbid();

            if (string.IsNullOrWhiteSpace(request.SavedFilePath))
                return BadRequest(new { message = "savedFilePath is required." });

            // If the user rejected the import, delete the saved file and return early.
            if (string.Equals(request.Status, "Deny", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var discardPath = _fileSvc.GetExcelFullPath(request.SavedFilePath);
                    System.IO.File.Delete(discardPath);
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(new { message = ex.Message });
                }
                catch (FileNotFoundException)
                {
                    // Already gone — treat as success.
                }

                return Ok(new { message = "Preview file discarded." });
            }

            string fullPath;
            try
            {
                fullPath = _fileSvc.GetExcelFullPath(request.SavedFilePath);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (FileNotFoundException)
            {
                return NotFound(new { message = "The uploaded file could not be found on the server." });
            }

            var fileName = request.FileOriginalName ?? Path.GetFileName(request.SavedFilePath);
            try
            {
                var payload = JsonSerializer.Serialize(new UploadJobPayload
                {
                    BankAccountId = request.BankAccountId,
                    Source = "import-excel"
                });

                var jobId = _jobSvc.Create(new CreateUploadJobRequest
                {
                    JobType = UploadJobTypes.TransactionImportExcel,
                    FilePath = request.SavedFilePath,
                    FileOriginalName = fileName,
                    FileType = Path.GetExtension(fileName),
                    FileSize = new FileInfo(fullPath).Length,
                    CompanyId = request.CompanyId,
                    UserId = userId,
                    BankAccountId = request.BankAccountId,
                    PayloadJson = payload
                });

                var hangfireJobId = _backgroundJobClient.Enqueue<IUploadJobWorker>(
                    w => w.ProcessTransactionJobAsync(jobId));
                _jobSvc.SetHangfireJobId(jobId, hangfireJobId);

                return Accepted(new QueueUploadJobResponse
                {
                    JobId = jobId,
                    Status = UploadJobStatuses.Queued,
                    HangfireJobId = hangfireJobId,
                    Message = "Transaction import accepted and queued for background processing."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to queue transaction import: {ex.Message}" });
            }
        }

        [HttpPost("upload-excel")]
        public async Task<IActionResult> UploadExcel(
            IFormFile file,
            [FromForm] long companyId,
            [FromForm] long? bankAccountId)
        {
            var userId = GetCurrentUserId();
            if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                return Forbid();

            var validationError = ValidateExcelFile(file);
            if (validationError != null)
                return validationError;

            try
            {
                // Save and enqueue so the upload continues even if the user leaves the page.
                var (relativePath, _) = await _fileSvc.SaveExcelAsync(file, companyId);

                var payload = JsonSerializer.Serialize(new UploadJobPayload
                {
                    BankAccountId = bankAccountId,
                    Source = "upload-excel"
                });

                var jobId = _jobSvc.Create(new CreateUploadJobRequest
                {
                    JobType = UploadJobTypes.TransactionUploadExcel,
                    FilePath = relativePath,
                    FileOriginalName = file.FileName,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    CompanyId = companyId,
                    UserId = userId,
                    BankAccountId = bankAccountId,
                    PayloadJson = payload
                });

                var hangfireJobId = _backgroundJobClient.Enqueue<IUploadJobWorker>(
                    w => w.ProcessTransactionJobAsync(jobId));
                _jobSvc.SetHangfireJobId(jobId, hangfireJobId);

                return Accepted(new QueueUploadJobResponse
                {
                    JobId = jobId,
                    Status = UploadJobStatuses.Queued,
                    HangfireJobId = hangfireJobId,
                    Message = "Excel upload accepted and queued for background processing."
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

        private IActionResult? ValidateExcelFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".xlsx" && extension != ".xls")
                return BadRequest(new { message = "Only Excel files (.xlsx, .xls) are accepted." });

            return null;
        }

        private (ExcelExtractionResult? Result, IActionResult? Error) TryExtractExcel(
            IFormFile file,
            string? filePath = null)
        {
            try
            {
                using var stream = file.OpenReadStream();
                var extractionResult = _excelSvc.Extract(stream, file.FileName);

                if (extractionResult.TotalExtracted == 0)
                    return (null, BuildNoTransactionsError(extractionResult, filePath));

                return (extractionResult, null);
            }
            catch (Exception ex)
            {
                return (null, BadRequest(new { message = $"Failed to process Excel file: {ex.Message}" }));
            }
        }

        private IActionResult BuildNoTransactionsError(ExcelExtractionResult extractionResult, string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return BadRequest(new
                {
                    message = "No transactions could be extracted from the file.",
                    sheets = extractionResult.Sheets
                });
            }

            return BadRequest(new
            {
                message = "No transactions could be extracted from the file.",
                filePath,
                sheets = extractionResult.Sheets
            });
        }

    }
}
