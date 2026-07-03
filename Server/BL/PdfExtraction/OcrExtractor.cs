using System.Text;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using Tesseract;

namespace FinalProjectAuthAPI.BL.PdfExtraction
{
    public class OcrExtractor
    {
        private readonly string _tessdataPath;

        public OcrExtractor(string tessdataPath)
        {
            _tessdataPath = tessdataPath;
        }

        public string ExtractText(Stream pdfStream)
        {
            try
            {
                if (!Directory.Exists(_tessdataPath))
                    return string.Empty;

                using var engine = new TesseractEngine(_tessdataPath, "eng", EngineMode.Default);
                var sb = new StringBuilder();

                using var pdfReader = new PdfReader(pdfStream);
                using var pdfDoc = new PdfDocument(pdfReader);

                for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
                {
                    ExtractTextFromPageImages(pdfDoc.GetPage(i), engine, sb);
                }

                return sb.ToString();
            }
            catch
            {
                return string.Empty;
            }
        }

        private static void ExtractTextFromPageImages(PdfPage page, TesseractEngine engine, StringBuilder sb)
        {
            var resources = page.GetResources();
            var xObjects = resources?.GetResource(PdfName.XObject);

            if (xObjects == null) return;

            foreach (var name in xObjects.KeySet())
            {
                ProcessImageObject(xObjects.GetAsStream(name), engine, sb);
            }
        }

        private static void ProcessImageObject(PdfStream obj, TesseractEngine engine, StringBuilder sb)
        {
            if (obj == null) return;

            var subtype = obj.GetAsName(PdfName.Subtype);
            if (!PdfName.Image.Equals(subtype)) return;

            try
            {
                var imageBytes = obj.GetBytes();
                using var pix = Pix.LoadFromMemory(imageBytes);
                using var ocrPage = engine.Process(pix);
                sb.AppendLine(ocrPage.GetText());
            }
            catch
            {
            }
        }
    }
}
