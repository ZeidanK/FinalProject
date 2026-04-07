using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    /// <summary>
    /// Service for handling invoice PDF upload, extraction, and creation workflows.
    /// Separates orchestration logic from the controller layer.
    /// </summary>
    public interface IInvoiceUploadService
    {
        /// <summary>
        /// Uploads a PDF file, saves it to disk, and extracts data without creating an invoice record.
        /// </summary>
        /// <param name="file">The PDF file from the HTTP request.</param>
        /// <param name="companyId">Company ID for file organization.</param>
        /// <param name="userId">User ID performing the upload.</param>
        /// <returns>Response with file metadata and extracted data.</returns>
        Task<(bool Success, UploadInvoicePdfResponse? Response, string Error)> UploadPdfAsync(
            IFormFile file, long companyId, long userId);

        /// <summary>
        /// Uploads a PDF file, extracts data, and creates the invoice record in one step.
        /// </summary>
        /// <param name="file">The PDF file from the HTTP request.</param>
        /// <param name="companyId">Company ID for the invoice.</param>
        /// <param name="userId">User ID performing the upload.</param>
        /// <returns>Newly created invoice ID and extracted data on success.</returns>
        Task<(bool Success, long InvoiceId, PdfExtractionResult? ExtractedData, string Error)> UploadAndCreateAsync(
            IFormFile file, long companyId, long userId);
    }
}
