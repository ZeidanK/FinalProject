using System.Globalization;
using System.Text.Json;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.PdfExtraction;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.DependencyInjection;

namespace FinalProjectAuthAPI.BL
{
    public class PdfExtractionService : IPdfExtractionService
    {
        private readonly IGeminiExtractionService _geminiService;
        private readonly IGeminiExtractionService? _geminiFallback;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<PdfExtractionService> _logger;
        private readonly PdfTextExtractor _textExtractor;
        private readonly OcrExtractor _ocrExtractor;
        private readonly RegexInvoiceParser _regexParser;
        private const int MinTextLength = 50;

        public PdfExtractionService(
            IWebHostEnvironment env,
            IGeminiExtractionService geminiService,
            IServiceProvider serviceProvider,
            ILogger<PdfExtractionService> logger)
        {
            _env = env;
            _geminiService = geminiService;
            try
            {
                _geminiFallback = serviceProvider.GetKeyedService<IGeminiExtractionService>("gemini-fallback");
            }
            catch (InvalidOperationException)
            {
                _geminiFallback = null;
            }
            _logger = logger;
            _textExtractor = new PdfTextExtractor();
            var tessdataPath = Path.Combine(env.ContentRootPath, "tessdata");
            _ocrExtractor = new OcrExtractor(tessdataPath);
            _regexParser = new RegexInvoiceParser();
        }

        public async Task<PdfExtractionResult> ExtractAsync(Stream pdfStream, string fileName)
        {
            Console.WriteLine("\n╔══════════════════════════════════════════════════════╗");
            Console.WriteLine($"║  INVOICE UPLOAD PIPELINE  —  {fileName}");
            Console.WriteLine("╚══════════════════════════════════════════════════════╝");

            // ── Step 1: Text extraction ───────────────────────────────────
            Console.WriteLine("\n[STEP 1] Extracting text from PDF...");
            string extractedText = _textExtractor.ExtractText(pdfStream);
            string method = "text";
            Console.WriteLine($"         Method : text  |  Characters extracted: {extractedText.Trim().Length}");

            if (extractedText.Trim().Length < MinTextLength)
            {
                Console.WriteLine("         Text too short — trying OCR fallback...");
                pdfStream.Position = 0;
                var ocrText = _ocrExtractor.ExtractText(pdfStream);
                if (ocrText.Trim().Length > extractedText.Trim().Length)
                {
                    extractedText = ocrText;
                    method = "ocr";
                    Console.WriteLine($"         OCR succeeded  |  Characters: {extractedText.Trim().Length}");
                }
                else
                {
                    Console.WriteLine("         OCR produced no improvement — using original text.");
                }
            }

            Console.WriteLine($"         Final text method: {method.ToUpper()}  |  Length: {extractedText.Trim().Length} chars");

            // ── Step 2: Primary AI extraction ─────────────────────────────
            Console.WriteLine("\n[STEP 2] Running primary AI extraction...");
            PdfExtractionResult? result = null;
            try
            {
                result = await _geminiService.ParseInvoiceTextAsync(extractedText);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"         Primary AI failed: {ex.Message}");
                _logger.LogWarning(ex, "Primary AI failed for {FileName}: {Message}", fileName, ex.Message);
            }

            // ── Step 2b: Gemini fallback when primary returned empty ───────
            if (IsEmptyResult(result) && _geminiFallback != null)
            {
                Console.WriteLine("\n[STEP 2b] Local model returned no data — calling Gemini fallback...");
                try
                {
                    var geminiResult = await _geminiFallback.ParseInvoiceTextAsync(extractedText);
                    if (!IsEmptyResult(geminiResult))
                    {
                        Console.WriteLine("         Gemini succeeded — saving as training data for future fine-tuning...");
                        await SaveTrainingDataAsync(extractedText, geminiResult!);
                        result = geminiResult;
                        Console.WriteLine("         Appended to LocalModel/gemini_extractions.jsonl");
                    }
                    else
                    {
                        Console.WriteLine("         Gemini fallback also returned empty.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"         Gemini fallback failed: {ex.Message}");
                    _logger.LogWarning(ex, "Gemini fallback failed for {FileName}: {Message}", fileName, ex.Message);
                }
            }

            if (!IsEmptyResult(result))
            {
                Console.WriteLine($"\n         Source     : {result!.ExtractionSource?.ToUpper()}");
                Console.WriteLine($"         Confidence : {result.ExtractionConfidence:P0}");
                Console.WriteLine($"         Vendor     : {result.VendorName ?? "(not found)"}");
                Console.WriteLine($"         Invoice #  : {result.InvoiceNumber ?? "(not found)"}");
                Console.WriteLine($"         Date       : {result.InvoiceDate?.ToString("yyyy-MM-dd") ?? "(not found)"}");
                Console.WriteLine($"         Total      : {result.TotalAmount?.ToString("0.00") ?? "(not found)"} {result.Currency}");
                result.ExtractionMethod = method;
                result.RawText = extractedText;

                Console.WriteLine("\n[DONE] AI extraction successful — skipping regex fallback.");
                Console.WriteLine("═══════════════════════════════════════════════════════\n");
                return result;
            }

            // ── Step 3: Regex fallback ────────────────────────────────────
            Console.WriteLine("\n[STEP 3] Running regex fallback extraction...");
            result = _regexParser.Parse(extractedText);
            result.ExtractionMethod = method;
            result.ExtractionSource = "regex";
            result.RawText = extractedText;
            Console.WriteLine($"         Vendor  : {result.VendorName ?? "(not found)"}");
            Console.WriteLine($"         Invoice#: {result.InvoiceNumber ?? "(not found)"}");
            Console.WriteLine($"         Total   : {result.TotalAmount?.ToString("0.00") ?? "(not found)"}");

            Console.WriteLine("\n[DONE] Regex fallback complete.");
            Console.WriteLine("═══════════════════════════════════════════════════════\n");
            return result;
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private static bool IsEmptyResult(PdfExtractionResult? r) =>
            r == null ||
            (r.ExtractionConfidence == 0 &&
             r.VendorName == null &&
             r.InvoiceNumber == null &&
             r.TotalAmount == null);

        private async Task SaveTrainingDataAsync(string rawText, PdfExtractionResult result)
        {
            try
            {
                var filePath = Path.Combine(_env.ContentRootPath, "LocalModel", "gemini_extractions.jsonl");
                var record = new
                {
                    text           = rawText,
                    vendor_name    = result.VendorName,
                    invoice_number = result.InvoiceNumber,
                    invoice_date   = result.InvoiceDate?.ToString("yyyy-MM-dd"),
                    due_date       = result.DueDate?.ToString("yyyy-MM-dd"),
                    total_amount   = result.TotalAmount?.ToString(CultureInfo.InvariantCulture),
                    subtotal       = result.Subtotal?.ToString(CultureInfo.InvariantCulture),
                    vat_amount     = result.VatAmount?.ToString(CultureInfo.InvariantCulture),
                    vat_rate       = result.VatRate?.ToString(CultureInfo.InvariantCulture),
                    vendor_tax_id  = result.VendorTaxId,
                    currency       = result.Currency,
                };
                var line = JsonSerializer.Serialize(record) + "\n";
                await File.AppendAllTextAsync(filePath, line);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not save training data: {Message}", ex.Message);
            }
        }
    }
}
