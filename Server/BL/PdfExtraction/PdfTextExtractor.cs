using System.Text;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using PdfTextExtractorUtil = iText.Kernel.Pdf.Canvas.Parser.PdfTextExtractor;

namespace FinalProjectAuthAPI.BL.PdfExtraction
{
    public class PdfTextExtractor
    {
        public string ExtractText(Stream pdfStream)
        {
            var sb = new StringBuilder();
            try
            {
                using var pdfReader = new PdfReader(pdfStream);
                using var pdfDoc = new PdfDocument(pdfReader);

                for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
                {
                    var page = pdfDoc.GetPage(i);
                    var strategy = new SimpleTextExtractionStrategy();
                    var text = PdfTextExtractorUtil.GetTextFromPage(page, strategy);
                    sb.AppendLine(text);
                }
            }
            catch
            {
            }
            return sb.ToString();
        }
    }
}
