using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IGeminiExtractionService
    {
        Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText);
    }
}
