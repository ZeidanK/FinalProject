using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IPdfExtractionService
    {
        Task<PdfExtractionOutcome> ExtractAsync(Stream pdfStream, string fileName);
    }
}
