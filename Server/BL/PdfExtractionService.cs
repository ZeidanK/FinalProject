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
        private readonly ILogger<PdfExtractionService> _logger;
        private readonly PdfTextExtractor _textExtractor;
        private readonly OcrExtractor _ocrExtractor;
        private readonly RegexInvoiceParser _regexParser;
        private readonly HybridExtractionSettings _hybridSettings;
        private readonly HybridExtractionMerger _hybridMerger;
        private const int MinTextLength = 50;

        public PdfExtractionService(
            IWebHostEnvironment env,
            IGeminiExtractionService geminiService,
            IServiceProvider serviceProvider,
            ILogger<PdfExtractionService> logger,
            HybridExtractionSettings hybridSettings)
        {
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
            _hybridSettings = hybridSettings;
            _hybridMerger = new HybridExtractionMerger(hybridSettings);
            _textExtractor = new PdfTextExtractor();
            _ocrExtractor = new OcrExtractor(Path.Combine(env.ContentRootPath, "tessdata"));
            _regexParser = new RegexInvoiceParser();
        }

        public async Task<PdfExtractionOutcome> ExtractAsync(Stream pdfStream, string fileName)
        {
            Console.WriteLine("\n================ INVOICE UPLOAD PIPELINE ================");
            Console.WriteLine($"File: {fileName}");

            Console.WriteLine("\n[STEP 1] Extracting text from PDF...");
            var extractedText = _textExtractor.ExtractText(pdfStream);
            var method = "text";
            Console.WriteLine($"         Method : text  |  Characters extracted: {extractedText.Trim().Length}");

            if (extractedText.Trim().Length < MinTextLength)
            {
                Console.WriteLine("         Text too short; trying OCR fallback...");
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
                    Console.WriteLine("         OCR produced no improvement; using original text.");
                }
            }

            Console.WriteLine($"         Final text method: {method.ToUpper()}  |  Length: {extractedText.Trim().Length} chars");

            PdfExtractionResult? result;
            HybridExtractionAudit? hybridAudit = null;

            if (ShouldUseHybrid())
            {
                Console.WriteLine("\n[STEP 2] Running local-first extraction...");
                var hybridResult = await RunHybridExtractionAsync(extractedText, fileName);
                result = hybridResult.Result;
                hybridAudit = hybridResult.Audit;
            }
            else
            {
                Console.WriteLine("\n[STEP 2] Running primary AI extraction...");
                result = await TryExtractAsync(_geminiService, extractedText, fileName, "Primary AI");
            }

            if (!HasNoCoreFields(result))
            {
                FinalizeResult(result!, method, extractedText);
                Console.WriteLine($"\n         Source     : {result!.ExtractionSource?.ToUpper()}");
                Console.WriteLine($"         Confidence : {result.ExtractionConfidence:P0}");
                Console.WriteLine($"         Vendor     : {result.VendorName ?? "(not found)"}");
                Console.WriteLine($"         Invoice #  : {result.InvoiceNumber ?? "(not found)"}");
                Console.WriteLine($"         Date       : {result.InvoiceDate?.ToString("yyyy-MM-dd") ?? "(not found)"}");
                Console.WriteLine($"         Total      : {result.TotalAmount?.ToString("0.00") ?? "(not found)"} {result.Currency}");

                Console.WriteLine("\n[DONE] AI extraction successful; skipping regex fallback.");
                Console.WriteLine("========================================================\n");
                return new PdfExtractionOutcome
                {
                    ExtractedData = result,
                    HybridAudit = hybridAudit,
                    UsedRegexFallback = false
                };
            }

            Console.WriteLine("\n[STEP 3] Running regex fallback extraction...");
            result = _regexParser.Parse(extractedText);
            result.ExtractionSource = "regex";
            FinalizeResult(result, method, extractedText);
            Console.WriteLine($"         Vendor  : {result.VendorName ?? "(not found)"}");
            Console.WriteLine($"         Invoice#: {result.InvoiceNumber ?? "(not found)"}");
            Console.WriteLine($"         Total   : {result.TotalAmount?.ToString("0.00") ?? "(not found)"}");

            Console.WriteLine("\n[DONE] Regex fallback complete.");
            Console.WriteLine("========================================================\n");
            return new PdfExtractionOutcome
            {
                ExtractedData = result,
                HybridAudit = hybridAudit,
                UsedRegexFallback = true
            };
        }

        private bool ShouldUseHybrid() =>
            _hybridSettings.Enabled
            && _geminiFallback != null;

        private async Task<(PdfExtractionResult? Result, HybridExtractionAudit? Audit)> RunHybridExtractionAsync(
            string rawText,
            string fileName)
        {
            var localResult = await TryExtractAsync(_geminiService, rawText, fileName, "Local model");

            if (!_hybridSettings.AlwaysCallGemini && !HasNoCoreFields(localResult))
            {
                Console.WriteLine("         Local model found core fields; skipping Gemini for fast-path extraction.");
                return (localResult, null);
            }

            if (_hybridSettings.AlwaysCallGemini)
            {
                Console.WriteLine("         Hybrid always-call mode enabled; requesting Gemini too.");
            }
            else
            {
                Console.WriteLine("         Local model missed core fields; requesting Gemini fallback.");
            }

            var geminiResult = await TryExtractAsync(
                _geminiFallback!,
                rawText,
                fileName,
                "Gemini",
                TimeSpan.FromSeconds(Math.Max(1, _hybridSettings.GeminiTimeoutSeconds)));

            var merged = _hybridMerger.Merge(localResult, geminiResult);

            Console.WriteLine($"         Local core fields found : {!HasNoCoreFields(localResult)}");
            Console.WriteLine($"         Gemini core fields found: {!HasNoCoreFields(geminiResult)}");
            Console.WriteLine($"         Hybrid field sources    : {merged.FieldSources.Count}");

            return (
                merged.Result,
                new HybridExtractionAudit
                {
                    LocalResult = WithoutRawText(localResult),
                    GeminiResult = WithoutRawText(geminiResult),
                    MergedResult = WithoutRawText(merged.Result),
                    FieldSources = new Dictionary<string, string>(merged.FieldSources)
                });
        }

        private async Task<PdfExtractionResult?> TryExtractAsync(
            IGeminiExtractionService service,
            string rawText,
            string fileName,
            string providerName,
            TimeSpan? timeout = null)
        {
            try
            {
                var task = service.ParseInvoiceTextAsync(rawText);
                return timeout.HasValue
                    ? await task.WaitAsync(timeout.Value)
                    : await task;
            }
            catch (TimeoutException ex)
            {
                Console.WriteLine($"         {providerName} timed out: {ex.Message}");
                _logger.LogWarning(ex, "{ProviderName} timed out for {FileName}: {Message}", providerName, fileName, ex.Message);
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"         {providerName} failed: {ex.Message}");
                _logger.LogWarning(ex, "{ProviderName} failed for {FileName}: {Message}", providerName, fileName, ex.Message);
                return null;
            }
        }

        private static void FinalizeResult(PdfExtractionResult result, string extractionMethod, string rawText)
        {
            result.ExtractionMethod = extractionMethod;
            result.RawText = rawText;
        }

        private static bool HasNoCoreFields(PdfExtractionResult? result) =>
            result == null ||
            (string.IsNullOrWhiteSpace(result.VendorName) &&
             string.IsNullOrWhiteSpace(result.InvoiceNumber) &&
             !result.InvoiceDate.HasValue &&
             !result.TotalAmount.HasValue);

        private static PdfExtractionResult? WithoutRawText(PdfExtractionResult? result)
        {
            if (result == null)
                return null;

            return new PdfExtractionResult
            {
                VendorName = result.VendorName,
                InvoiceNumber = result.InvoiceNumber,
                InvoiceDate = result.InvoiceDate,
                DueDate = result.DueDate,
                TotalAmount = result.TotalAmount,
                Subtotal = result.Subtotal,
                VatRate = result.VatRate,
                VatAmount = result.VatAmount,
                Currency = result.Currency,
                VendorTaxId = result.VendorTaxId,
                LastFourDigitsCard = result.LastFourDigitsCard,
                ItemCount = result.ItemCount,
                PaymentPlan = result.PaymentPlan == null
                    ? null
                    : new PaymentPlanInfo
                    {
                        TotalInstallments = result.PaymentPlan.TotalInstallments,
                        InstallmentAmount = result.PaymentPlan.InstallmentAmount,
                        Frequency = result.PaymentPlan.Frequency,
                        CurrentInstallment = result.PaymentPlan.CurrentInstallment,
                        Description = result.PaymentPlan.Description
                    },
                LineItems = result.LineItems.Select(item => new ExtractedLineItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount,
                    VatRate = item.VatRate,
                    Category = item.Category,
                    AiConfidenceScore = item.AiConfidenceScore
                }).ToList(),
                ExtractionConfidence = result.ExtractionConfidence,
                ExtractionMethod = result.ExtractionMethod,
                ExtractionSource = result.ExtractionSource
            };
        }
    }
}
