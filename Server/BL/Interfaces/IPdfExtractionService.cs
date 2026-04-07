using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IPdfExtractionService
    {
        Task<PdfExtractionResult> ExtractAsync(Stream pdfStream, string fileName);
    }
}
