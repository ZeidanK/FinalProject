using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IGeminiExtractionService
    {
        Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText);
        Task<List<string>> TranslateVendorNameAsync(string vendorName);
        Task<List<VendorComparisonResult>> CompareVendorNamesAsync(string invoiceVendorName, List<string> transactionDescriptions);
    }
}
