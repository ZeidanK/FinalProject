using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IPdfExtractionService
    {
        PdfExtractionResult Extract(Stream pdfStream, string fileName);
    }
}
