using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.PdfExtraction;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class PdfExtractionService : IPdfExtractionService
    {
        private readonly IGeminiExtractionService _geminiService;
        private readonly ILogger<PdfExtractionService> _logger;
        private readonly PdfTextExtractor _textExtractor;
        private readonly OcrExtractor _ocrExtractor;
        private readonly RegexInvoiceParser _regexParser;
        private const int MinTextLength = 50;

        public PdfExtractionService(
            IWebHostEnvironment env,
            IGeminiExtractionService geminiService,
            ILogger<PdfExtractionService> logger)
        {
            _geminiService = geminiService;
            _logger = logger;
            _textExtractor = new PdfTextExtractor();
            var tessdataPath = Path.Combine(env.ContentRootPath, "tessdata");
            _ocrExtractor = new OcrExtractor(tessdataPath);
            _regexParser = new RegexInvoiceParser();
        }

        public async Task<PdfExtractionResult> ExtractAsync(Stream pdfStream, string fileName)
        {
            string extractedText = _textExtractor.ExtractText(pdfStream);
            string method = "text";

            if (extractedText.Trim().Length < MinTextLength)
            {
                pdfStream.Position = 0;
                var ocrText = _ocrExtractor.ExtractText(pdfStream);
                if (ocrText.Trim().Length > extractedText.Trim().Length)
                {
                    extractedText = ocrText;
                    method = "ocr";
                }
            }

            PdfExtractionResult? result = null;
            try
            {
                _logger.LogInformation("Starting PDF extraction for {FileName} using {ExtractionMethod}", fileName, method);
                result = await _geminiService.ParseInvoiceTextAsync(extractedText);

                if (result != null)
                {
                    _logger.LogInformation("Gemini extraction successful for {FileName}. Confidence: {Confidence}",
                        fileName, result.ExtractionConfidence);
                    result.ExtractionMethod = method;
                    result.RawText = extractedText;
                    return result;
                }
                else
                {
                    _logger.LogWarning("Gemini returned null result for {FileName}. Falling back to regex.", fileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini extraction failed for {FileName}. Falling back to regex: {Message}",
                    fileName, ex.Message);
            }

            _logger.LogInformation("Using regex fallback extraction for {FileName}", fileName);
            result = _regexParser.Parse(extractedText);
            result.ExtractionMethod = method;
            result.ExtractionSource = "regex";
            result.RawText = extractedText;

            return result;
        }
    }
}
