using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;

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
        private readonly IAnomalyService _anomalySvc;
        private readonly DBservices _db;

        public TransactionsController(
            ITransactionService svc,
            IExcelExtractionService excelSvc,
            IFileStorageService fileSvc,
            IAnomalyService anomalySvc,
            DBservices db)
        {
            _svc = svc;
            _excelSvc = excelSvc;
            _fileSvc = fileSvc;
            _anomalySvc = anomalySvc;
            _db = db;
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

            var fileHash = ComputeFileSha256(fullPath);
            var duplicateResult = _anomalySvc.RegisterTransactionFileUpload(
                request.CompanyId,
                fileName,
                request.SavedFilePath,
                new FileInfo(fullPath).Length,
                userId,
                fileHash);

            if (!duplicateResult.Success)
                return BadRequest(new { message = duplicateResult.Error });

            if (duplicateResult.IsDuplicate)
            {
                return Conflict(new
                {
                    message = "Duplicate Excel file detected. Import was skipped and grouped under an anomaly.",
                    anomalyId = duplicateResult.AnomalyId,
                    fileHash
                });
            }

            ExcelExtractionResult extractionResult;
            try
            {
                using var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                extractionResult = _excelSvc.Extract(stream, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Failed to process Excel file: {ex.Message}" });
            }

            if (extractionResult.TotalExtracted == 0)
                return BadRequest(new { message = "No transactions could be extracted from the file.", sheets = extractionResult.Sheets });

            var bulkRequest = new BulkCreateTransactionsRequest
            {
                CompanyId = request.CompanyId,
                CreatedByUserId = userId,
                Transactions = extractionResult.Transactions.Select(t => new CreateTransactionRequest
                {
                    CompanyId = request.CompanyId,
                    TransactionDate = t.TransactionDate,
                    PostedDate = t.PostedDate,
                    Description = t.Description,
                    Amount = t.Amount,
                    BalanceAfter = t.BalanceAfter,
                    TransactionType = t.TransactionType,
                    Category = t.Category,
                    ReferenceNumber = t.ReferenceNumber,
                    VendorName = t.VendorName,
                    CardLast4 = t.CardLast4,
                    ChargeAmount = t.ChargeAmount,
                    ChargeCurrency = t.ChargeCurrency,
                    OriginalCurrency = t.OriginalCurrency,
                    ExchangeRate = t.ExchangeRate,
                    BankAccountId = request.BankAccountId,
                    CreatedByUserId = userId
                }).ToList()
            };

            var (success, ids, error) = _svc.BulkCreate(bulkRequest, userId);

            if (!success)
                return BadRequest(new { message = error });

            return StatusCode(201, new
            {
                count = ids.Count,
                ids,
                message = $"Successfully imported {ids.Count} transaction(s)."
            });
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
                // 1. Save the file
                var (relativePath, _) = await _fileSvc.SaveExcelAsync(file, companyId);

                var fullPath = _fileSvc.GetExcelFullPath(relativePath);
                var fileHash = ComputeFileSha256(fullPath);

                var duplicateResult = _anomalySvc.RegisterTransactionFileUpload(
                    companyId,
                    file.FileName,
                    relativePath,
                    file.Length,
                    userId,
                    fileHash);

                if (!duplicateResult.Success)
                    return BadRequest(new { message = duplicateResult.Error, filePath = relativePath });

                if (duplicateResult.IsDuplicate)
                {
                    return Conflict(new
                    {
                        message = "Duplicate Excel file detected. Import was skipped and grouped under an anomaly.",
                        anomalyId = duplicateResult.AnomalyId,
                        fileHash,
                        filePath = relativePath,
                    });
                }

                // 2. Extract transactions from the Excel file
                var (extractionResult, extractionError) = TryExtractExcel(file, relativePath);
                if (extractionError != null)
                    return extractionError;

                // 3. Map extracted transactions to bulk create request
                var bulkRequest = new BulkCreateTransactionsRequest
                {
                    CompanyId = companyId,
                    CreatedByUserId = userId,
                    Transactions = extractionResult!.Transactions.Select(t => new CreateTransactionRequest
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
                        VendorName = t.VendorName,
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

        private static string ComputeFileSha256(string fullPath)
        {
            using var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(stream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
