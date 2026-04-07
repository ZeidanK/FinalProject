using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Orchestrates invoice PDF upload, extraction, and creation workflows.
    /// Encapsulates the complex orchestration logic that was previously in the controller.
    /// </summary>
    public class InvoiceUploadService : IInvoiceUploadService
    {
        private readonly IInvoiceService _invoiceSvc;
        private readonly IPdfExtractionService _pdfSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly DBservices _db;

        public InvoiceUploadService(
            IInvoiceService invoiceSvc,
            IPdfExtractionService pdfSvc,
            IFileStorageService fileSvc,
            DBservices db)
        {
            _invoiceSvc = invoiceSvc;
            _pdfSvc = pdfSvc;
            _fileSvc = fileSvc;
            _db = db;
        }

        /// <summary>
        /// Uploads a PDF file, saves it to disk, and extracts data without creating an invoice record.
        /// </summary>
        public async Task<(bool Success, UploadInvoicePdfResponse? Response, string Error)> UploadPdfAsync(
            IFormFile file, long companyId, long userId)
        {
            try
            {
                // Validate inputs
                if (file == null || file.Length == 0)
                    return (false, null, "No file provided.");

                if (companyId <= 0)
                    return (false, null, "Company ID is required.");

                if (userId <= 0)
                    return (false, null, "User ID is required.");

                if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                    return (false, null, "You do not have access to the selected company.");

                // Save the file to disk
                var (relativePath, _) = await _fileSvc.SaveAsync(file, companyId);

                // Extract data from the PDF
                PdfExtractionResult extractedData;
                using (var stream = file.OpenReadStream())
                {
                    extractedData = await _pdfSvc.ExtractAsync(stream, file.FileName);
                }

                var response = new UploadInvoicePdfResponse
                {
                    FileOriginalName = file.FileName,
                    FileSize = file.Length,
                    FilePath = relativePath,
                    FileType = file.ContentType,
                    ExtractedData = extractedData
                };

                return (true, response, string.Empty);
            }
            catch (ArgumentException ex)
            {
                return (false, null, ex.Message);
            }
            catch (Exception ex)
            {
                return (false, null, $"Failed to process the uploaded file: {ex.Message}");
            }
        }

        /// <summary>
        /// Uploads a PDF file, extracts data, and creates the invoice record in one step.
        /// </summary>
        public async Task<(bool Success, long InvoiceId, PdfExtractionResult? ExtractedData, string Error)> 
            UploadAndCreateAsync(IFormFile file, long companyId, long userId)
        {
            try
            {
                // Validate inputs
                if (file == null || file.Length == 0)
                    return (false, 0, null, "No file provided.");

                if (companyId <= 0)
                    return (false, 0, null, "Company ID is required.");

                if (userId <= 0)
                    return (false, 0, null, "User ID is required.");

                if (!_db.UserHasActiveCompanyAccess(userId, companyId))
                    return (false, 0, null, "You do not have access to the selected company.");

                // Save the file
                var (relativePath, _) = await _fileSvc.SaveAsync(file, companyId);

                // Extract data
                PdfExtractionResult extracted;
                using (var stream = file.OpenReadStream())
                {
                    extracted = await _pdfSvc.ExtractAsync(stream, file.FileName);
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
                    ItemCount = extracted.ItemCount,
                    PaymentPlanTotalInstallments = extracted.PaymentPlan?.TotalInstallments,
                    PaymentPlanInstallmentAmount = extracted.PaymentPlan?.InstallmentAmount,
                    PaymentPlanFrequency = extracted.PaymentPlan?.Frequency,
                    PaymentPlanDescription = extracted.PaymentPlan?.Description,
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

                // Create the invoice record
                var (success, id, error) = _invoiceSvc.Create(request, userId,
                    file.FileName, relativePath, file.ContentType,
                    file.Length, extracted.ExtractionConfidence);

                if (!success)
                    return (false, 0, null, error);

                // Update status to "extracted" since AI processed it
                _invoiceSvc.UpdateStatus(id, "extracted");

                return (true, id, extracted, string.Empty);
            }
            catch (ArgumentException ex)
            {
                return (false, 0, null, ex.Message);
            }
            catch (Exception ex)
            {
                return (false, 0, null, $"Failed to process and create invoice from PDF: {ex.Message}");
            }
        }
    }
}
