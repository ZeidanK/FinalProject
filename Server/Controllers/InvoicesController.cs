using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _svc;
        private readonly IPdfExtractionService _pdfSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly IWebHostEnvironment _env;

        public InvoicesController(IInvoiceService svc, IPdfExtractionService pdfSvc, IFileStorageService fileSvc, IWebHostEnvironment env)
        {
            _svc = svc;
            _pdfSvc = pdfSvc;
            _fileSvc = fileSvc;
            _env = env;
        }

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
        public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request, [FromQuery] bool autoMatch = false)
        {
            var userId = GetCurrentUserId();
            var (success, id, error) = _svc.Create(
                request,
                userId,
                request.FileOriginalName,
                request.FilePath,
                request.FileType,
                request.FileSize,
                request.AiExtractionConfidence);

            if (!success)
                return BadRequest(new { message = error });

            // Optionally attempt automatic matching
            if (autoMatch)
            {
                var matchResult = await _svc.AutoMatchAfterCreateAsync(id, userId, 70m);
                return CreatedAtAction(nameof(GetById), new { id }, new { 
                    id, 
                    message = "Invoice created.",
                    autoMatchResult = new {
                        matched = matchResult.Success,
                        matchId = matchResult.MatchId,
                        matchScore = matchResult.MatchScore,
                        matchMessage = matchResult.Message
                    }
                });
            }

            return CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Invoice created." });
        }

        // PATCH api/invoices/{id}/status
        [HttpPatch("{id:long}/status")]
        public IActionResult UpdateStatus(long id, [FromBody] UpdateInvoiceStatusRequest request)
        {
            var ok = _svc.UpdateStatus(id, request.Status);
            return ok ? Ok(new { message = "Invoice status updated." }) : BadRequest(new { message = "Invalid status or invoice not found." });
        }

        // GET api/invoices/{id}/download
        // Returns the stored invoice file content for viewing/downloading.
        [HttpGet("{id:long}/download")]
        public IActionResult Download(long id)
        {
            var invoice = _svc.GetById(id);
            if (invoice is null)
                return NotFound(new { message = "Invoice not found." });

            if (string.IsNullOrWhiteSpace(invoice.FilePath))
                return NotFound(new { message = "No saved file was found for this invoice." });

            var normalizedRelativePath = invoice.FilePath
                .Replace('\\', '/')
                .TrimStart('/');

            if (normalizedRelativePath.Contains("..") || !normalizedRelativePath.StartsWith("uploads/invoices/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Invalid file path." });

            var expectedCompanyPrefix = $"uploads/invoices/{invoice.CompanyId}/";
            if (!normalizedRelativePath.StartsWith(expectedCompanyPrefix, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Invoice file path does not match the invoice company." });

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var fullPath = Path.Combine(webRoot, normalizedRelativePath.Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(fullPath))
                return NotFound(new { message = "Invoice file could not be found on disk." });

            var contentType = string.IsNullOrWhiteSpace(invoice.FileType) ? "application/pdf" : invoice.FileType;
            var fileName = string.IsNullOrWhiteSpace(invoice.FileOriginalName)
                ? Path.GetFileName(fullPath)
                : invoice.FileOriginalName;

            return PhysicalFile(fullPath, contentType, fileName);
        }

        // POST api/invoices/upload-pdf
        // Uploads a PDF, saves the file, extracts data, and returns extracted fields for review.
        [HttpPost("upload-pdf")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadPdf(IFormFile file, [FromForm] long companyId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            if (companyId <= 0)
                return BadRequest(new { message = "Company ID is required." });

            try
            {
                // Save the file to disk
                var (relativePath, fullPath) = await _fileSvc.SaveAsync(file, companyId);

                // Extract data from the PDF
                PdfExtractionResult extractedData;
                using (var stream = file.OpenReadStream())
                {
                    extractedData = _pdfSvc.Extract(stream, file.FileName);
                }

                var response = new UploadInvoicePdfResponse
                {
                    FileOriginalName = file.FileName,
                    FileSize = file.Length,
                    FilePath = relativePath,
                    FileType = file.ContentType,
                    ExtractedData = extractedData
                };

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Failed to process the uploaded file." });
            }
        }

        // POST api/invoices/upload-and-create
        // Uploads a PDF, extracts data, and creates the invoice record in one step.
        [HttpPost("upload-and-create")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadAndCreate(IFormFile file, [FromForm] long companyId)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            if (companyId <= 0)
                return BadRequest(new { message = "Company ID is required." });

            try
            {
                // Save the file
                var (relativePath, _) = await _fileSvc.SaveAsync(file, companyId);

                // Extract data
                PdfExtractionResult extracted;
                using (var stream = file.OpenReadStream())
                {
                    extracted = _pdfSvc.Extract(stream, file.FileName);
                }

                // Build a CreateInvoiceRequest from extracted data
                var request = new CreateInvoiceRequest
                {
                    CompanyId = companyId,
                    InvoiceNumber = extracted.InvoiceNumber ?? $"PDF-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    VendorName = extracted.VendorName ?? "Unknown Vendor",
                    InvoiceDate = extracted.InvoiceDate ?? DateTime.UtcNow,
                    TotalAmount = extracted.TotalAmount ?? 0,
                    Subtotal = extracted.Subtotal ?? 0,
                    VatRate = extracted.VatRate,
                    VatAmount = extracted.VatAmount,
                    Currency = extracted.Currency ?? "USD",
                    VendorTaxId = extracted.VendorTaxId,
                    LastFourDigitsCard = extracted.LastFourDigitsCard,
                    LineItems = extracted.LineItems.Select((li, idx) => new CreateLineItemRequest
                    {
                        Description = li.Description,
                        Quantity = li.Quantity,
                        UnitPrice = li.UnitPrice,
                        TotalAmount = li.TotalAmount,
                        VatRate = li.VatRate,
                        Category = li.Category,
                        LineNumber = idx + 1,
                        AiConfidenceScore = li.AiConfidenceScore
                    }).ToList()
                };

                var userId = GetCurrentUserId();
                var (success, id, error) = _svc.Create(request, userId,
                    file.FileName, relativePath, file.ContentType,
                    file.Length, extracted.ExtractionConfidence);

                if (!success)
                    return BadRequest(new { message = error });

                // Update status to "extracted" since AI processed it
                _svc.UpdateStatus(id, "extracted");

                return CreatedAtAction(nameof(GetById), new { id }, new
                {
                    id,
                    message = "Invoice created from PDF.",
                    extractedData = extracted
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Failed to process and create invoice from PDF." });
            }
        }

        private long GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            return long.TryParse(claim, out var id) ? id : 0;
        }
    }
}
