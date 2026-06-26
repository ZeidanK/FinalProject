using System.Globalization;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using Tesseract;
namespace FinalProjectAuthAPI.BL
{
    public class PdfExtractionService : IPdfExtractionService
    {
        private static readonly string[] PythonExecutables = new[] { "py", "python", "python3" };

        private readonly string _tessdataPath;
        private readonly string _contentRootPath;
        private readonly string _pythonScriptPath;
        private readonly string _modelPath;
        private readonly string _vectorizerPath;
        private readonly IGeminiExtractionService _geminiService;
        private readonly ILogger<PdfExtractionService> _logger;
        private const int MinTextLength = 50;

        public PdfExtractionService(
            IWebHostEnvironment env, 
            IGeminiExtractionService geminiService,
            ILogger<PdfExtractionService> logger)
        {
            _contentRootPath = env.ContentRootPath;
            _tessdataPath = Path.Combine(env.ContentRootPath, "tessdata");
            _pythonScriptPath = Path.Combine(_contentRootPath, "ML", "test_invoice_model.py");
            _modelPath = Path.Combine(_contentRootPath, "BL", "path_to_your_trained_model1.pkl");
            _vectorizerPath = Path.Combine(_contentRootPath, "BL", "path_to_your_vectorizer1.pkl");
            _geminiService = geminiService;
            _logger = logger;
        }

        public async Task<PdfExtractionResult> ExtractAsync(Stream pdfStream, string fileName)
        {
            // Step 1: Try iText7 text extraction (for digitally-generated PDFs)
            string extractedText = ExtractTextWithIText(pdfStream);
            string method = "text";

            // Step 2: If text is too short, fall back to Tesseract OCR
            if (extractedText.Trim().Length < MinTextLength)
            {
                pdfStream.Position = 0;
                var ocrText = ExtractTextWithOcr(pdfStream);
                if (ocrText.Trim().Length > extractedText.Trim().Length)
                {
                    extractedText = ocrText;
                    method = "ocr";
                }
            }

            await LogLocalModelInferenceAsync(extractedText, fileName);

            // Step 3: Try parsing with Gemini AI first
            PdfExtractionResult? result = null;
            try
            {
                
                _logger.LogInformation("Starting PDF extraction for {FileName} using {ExtractionMethod}", fileName, method);
                result = await _geminiService.ParseInvoiceTextAsync(extractedText);
                
                if (result != null)
                {
                    _logger.LogInformation("Gemini extraction successful for {FileName}. Confidence: {Confidence}", 
                        fileName, result.ExtractionConfidence);
                    result.ExtractionMethod = method; // Preserve whether text or ocr was used
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

            // Step 4: Fallback to regex-based parsing if Gemini fails
            _logger.LogInformation("Using regex fallback extraction for {FileName}", fileName);
            result = ParseExtractedText(extractedText);
            result.ExtractionMethod = method;
            result.ExtractionSource = "regex";
            result.RawText = extractedText;

            return result;
        }

        private async Task LogLocalModelInferenceAsync(string extractedText, string fileName)
        {
            if (string.IsNullOrWhiteSpace(extractedText))
            {
                _logger.LogInformation("Skipping local model inference for {FileName} because extracted text is empty.", fileName);
                return;
            }

            if (!File.Exists(_pythonScriptPath) || !File.Exists(_modelPath) || !File.Exists(_vectorizerPath))
            {
                _logger.LogWarning(
                    "Skipping local model inference for {FileName} because one or more assets are missing. Script: {ScriptExists}, Model: {ModelExists}, Vectorizer: {VectorizerExists}",
                    fileName,
                    File.Exists(_pythonScriptPath),
                    File.Exists(_modelPath),
                    File.Exists(_vectorizerPath));
                return;
            }

            Console.WriteLine("\n========== LOCAL MODEL INFERENCE ==========");
            Console.WriteLine($"[INFO] File: {fileName}");
            Console.WriteLine($"[INFO] Extracted text length: {extractedText.Length} characters");
            Console.WriteLine($"[INFO] Script: {_pythonScriptPath}");
            Console.WriteLine($"[INFO] Model: {_modelPath}");
            Console.WriteLine($"[INFO] Vectorizer: {_vectorizerPath}");

            foreach (var pythonExecutable in PythonExecutables)
            {
                var result = await RunPythonInferenceAsync(pythonExecutable, extractedText);
                if (!result.Success)
                {
                    _logger.LogWarning(
                        "Local model inference attempt failed for {FileName} using {PythonExecutable}. Exit code: {ExitCode}. Error: {Error}",
                        fileName,
                        pythonExecutable,
                        result.ExitCode,
                        result.StandardError);
                    continue;
                }

                Console.WriteLine($"[SUCCESS] Local model inference completed using {pythonExecutable}.");
                if (!string.IsNullOrWhiteSpace(result.StandardOutput))
                {
                    Console.WriteLine("\n========== LOCAL MODEL RESULT ==========");
                    Console.WriteLine(result.StandardOutput.Trim());
                    Console.WriteLine("========================================\n");
                }

                if (!string.IsNullOrWhiteSpace(result.StandardError))
                {
                    Console.WriteLine("[WARN] Local model stderr:");
                    Console.WriteLine(result.StandardError.Trim());
                }

                Console.WriteLine("========================================\n");
                return;
            }

            Console.WriteLine("[ERROR] Local model inference could not be executed with any available Python command.");
            Console.WriteLine("========================================\n");
        }

private async Task<(bool Success, int ExitCode, string StandardOutput, string StandardError)> RunPythonInferenceAsync(
    string pythonExecutable,
    string extractedText)
{
    try
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = pythonExecutable,
            WorkingDirectory = _contentRootPath,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        if (pythonExecutable.Equals("py", StringComparison.OrdinalIgnoreCase))
        {
            startInfo.ArgumentList.Add("-3");
        }
        startInfo.ArgumentList.Add(_pythonScriptPath);
        startInfo.ArgumentList.Add("--model");
        startInfo.ArgumentList.Add(_modelPath);
        startInfo.ArgumentList.Add("--vectorizer");
        startInfo.ArgumentList.Add(_vectorizerPath);

        using var process = new Process { StartInfo = startInfo };
        if (!process.Start())
            return (false, -1, string.Empty, $"Failed to start {pythonExecutable}.");

        await process.StandardInput.WriteAsync(extractedText);
        await process.StandardInput.FlushAsync();
        process.StandardInput.Close();

        // Capture the raw output before parsing
        var standardOutputTask = process.StandardOutput.ReadToEndAsync();
        var standardErrorTask = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        var standardOutput = await standardOutputTask;
        var standardError = await standardErrorTask;

        // Log the raw output for debugging purposes
        Console.WriteLine("Standard Output:");
        Console.WriteLine(standardOutput);
        Console.WriteLine("Standard Error:");
        Console.WriteLine(standardError);

        // Parse the raw output (no JSON parsing needed)
        return (true, process.ExitCode, standardOutput, standardError);
    }
    catch (Exception ex)
    {
        return (false, -1, string.Empty, ex.Message);
    }
}

        // ── iText7 text extraction ────────────────────────────────────────

        private static string ExtractTextWithIText(Stream pdfStream)
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
                    var text = PdfTextExtractor.GetTextFromPage(page, strategy);
                    sb.AppendLine(text);
                }
            }
            catch
            {
                // If iText fails, return empty — OCR fallback will handle it
            }
            return sb.ToString();
        }

        // ── Tesseract OCR fallback ────────────────────────────────────────

        private string ExtractTextWithOcr(Stream pdfStream)
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
                // Skip images that can't be processed
            }
        }

        // ── Text parsing into structured fields ───────────────────────────

        private static string SanitizeText(string text)
        {
            // Strip null chars and other control characters that PDF extractors
            // sometimes include (e.g. \x00 between parts of invoice numbers).
            // Keep \n, \r, \t as they are meaningful for parsing.
            var sb = new StringBuilder(text.Length);
            foreach (var ch in text)
            {
                if (ch == '\n' || ch == '\r' || ch == '\t' || !char.IsControl(ch))
                    sb.Append(ch);
                else
                    sb.Append('-'); // replace control chars with dash to preserve separators
            }
            return sb.ToString();
        }

        private static PdfExtractionResult ParseExtractedText(string rawText)
        {
            var result = new PdfExtractionResult();
            if (string.IsNullOrWhiteSpace(rawText))
            {
                result.ExtractionConfidence = 0;
                return result;
            }

            // Sanitize: strip null/control characters that break regex matching
            var text = SanitizeText(rawText);

            int fieldsFound = 0;
            int totalFields = 9; // vendor, number, date, total, subtotal, vat, currency, taxId, card

            // Invoice / Receipt number
            result.InvoiceNumber = ExtractInvoiceNumber(text);
            if (result.InvoiceNumber != null) fieldsFound++;

            // Vendor name
            result.VendorName = ExtractVendorName(text);
            if (result.VendorName != null) fieldsFound++;

            // Invoice date
            result.InvoiceDate = ExtractDate(text);
            if (result.InvoiceDate != null) fieldsFound++;

            // Currency (detect before amounts so we know what to look for)
            result.Currency = ExtractCurrency(text);
            if (result.Currency != null) fieldsFound++;

            // ── Amounts: two-step approach ported from mock ──

            // Total amount — try specific labels first, then bare "total"
            result.TotalAmount = ExtractAmount(text,
                @"(?:grand\s*total|amount\s*due|total\s*due|total\s*amount|סכום\s*כולל)\s*[^\d\n]*?(\d[\d,]*\.?\d{0,2})");
            result.TotalAmount ??= ExtractAmount(text,
                @"(?:^|\n)\s*total\s*[^\d\n]*?(\d[\d,]*\.?\d{0,2})");
            result.TotalAmount ??= ExtractAmount(text,
                @"(?:סה""כ)\s*[^\d\n]*?(\d[\d,]*\.?\d{0,2})");
            if (result.TotalAmount != null) fieldsFound++;

            // Subtotal
            result.Subtotal = ExtractAmount(text,
                @"(?:subtotal|sub[\s-]*total|סה""כ\s*לפני)\s*[^\d\n]*?(\d[\d,]*\.?\d{0,2})");
            if (result.Subtotal != null) fieldsFound++;

            // VAT rate (percentage — must be extracted before VAT amount)
            result.VatRate = ExtractVatRate(text);

            // VAT amount — separate regex that avoids confusing % rate with $ amount
            result.VatAmount = ExtractAmount(text,
                @"(?:sales\s*tax|vat\s*amount|tax\s*amount|gst\s*amount|מע""מ\s*סכום)\s*[^\d\n]*?(\d[\d,]*\.\d{2})(?!\s*%)");
            result.VatAmount ??= ExtractAmount(text,
                @"(?:sales\s*tax|vat|tax|gst|מע""מ|מס)\s*(?:\([^)]*\))?[^\d%\n]*?(\d[\d,]*\.\d{2})(?!\s*%)");
            if (result.VatAmount != null) fieldsFound++;

            // Computed fallbacks: fill in missing total or subtotal from the other + vat
            if (result.TotalAmount == null && result.Subtotal != null && result.VatAmount != null)
                result.TotalAmount = result.Subtotal + result.VatAmount;
            if (result.Subtotal == null && result.TotalAmount != null && result.VatAmount != null)
                result.Subtotal = result.TotalAmount - result.VatAmount;

            // Vendor Tax ID
            result.VendorTaxId = ExtractVendorTaxId(text);
            if (result.VendorTaxId != null) fieldsFound++;

            // Last 4 digits of card
            result.LastFourDigitsCard = ExtractLastFourDigits(text);
            if (result.LastFourDigitsCard != null) fieldsFound++;

            // Line items
            result.LineItems = ExtractLineItems(text);

            // Calculate confidence
            result.ExtractionConfidence = Math.Round((decimal)fieldsFound / totalFields, 4);

            return result;
        }

        // ── Individual field extractors ───────────────────────────────────

        private static string? ExtractInvoiceNumber(string text)
        {
            var patterns = new[]
            {
                @"(?:invoice|receipt|inv|bill)\s*(?:#|no\.?|number)\s*[:.]?\s*([\w-]+)",
                @"(?:חשבונית|קבלה)\s*(?:מס['׳]?\.?)\s*[:.]?\s*([\w-]+)",
                @"(?:inv[.\s#-]*)([\w-]{3,20})",
                @"#\s*([\w-]{3,20})"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                    return match.Groups[1].Value.Trim();
            }
            return null;
        }

        private static string? ExtractVendorName(string text)
        {
            // Try specific patterns first
            var patterns = new[]
            {
                @"(?:from|vendor|supplier|sold\s*by|company)\s*[:.]?\s*(.+?)(?:\r?\n|$)",
                @"(?:מאת|ספק|חברה)\s*[:.]?\s*(.+?)(?:\r?\n|$)"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var name = match.Groups[1].Value.Trim();
                    if (name.Length >= 2 && name.Length <= 255)
                        return name;
                }
            }

            // Fallback: first meaningful non-numeric line (matches mock logic)
            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines.Take(5))
            {
                var trimmed = line.Trim();
                if (trimmed.Length >= 3 && trimmed.Length <= 100 &&
                    Regex.IsMatch(trimmed, @"[a-zA-Z\u0590-\u05FF]{3}", RegexOptions.None) &&
                    !Regex.IsMatch(trimmed, @"^(date|invoice|receipt|tax|total|page|bill|no\.|number)",
                        RegexOptions.IgnoreCase))
                    return trimmed;
            }

            return null;
        }

        private static DateTime? ExtractDate(string text)
        {
            // Labeled date patterns first (higher confidence)
            var labeledPatterns = new[]
            {
                @"(?:invoice\s*date|date\s*of\s*issue|issued\s*(?:on)?|receipt\s*date|תאריך)\s*[:.]?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
                @"(?:invoice\s*date|date\s*of\s*issue|issued\s*(?:on)?|receipt\s*date|תאריך)\s*[:.]?\s*(\w+\s+\d{1,2},?\s*\d{4})",
            };

            // Unlabeled fallback patterns
            var fallbackPatterns = new[]
            {
                @"(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
                @"(\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})",
                @"(\w+\s+\d{1,2},?\s*\d{4})"
            };

            var dateFormats = new[]
            {
                "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "MM-dd-yyyy",
                "dd.MM.yyyy", "MM.dd.yyyy", "yyyy-MM-dd", "yyyy/MM/dd",
                "dd/MM/yy", "MM/dd/yy", "dd-MM-yy", "MM-dd-yy",
                "MMMM d, yyyy", "MMMM dd, yyyy", "MMM d, yyyy", "MMM dd, yyyy",
                "d MMMM yyyy", "dd MMMM yyyy"
            };

            // Try labeled patterns first
            foreach (var pattern in labeledPatterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var dt = TryParseDate(match.Groups[1].Value.Trim(), dateFormats);
                    if (dt != null) return dt;
                }
            }

            // Fallback to unlabeled
            foreach (var pattern in fallbackPatterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var dt = TryParseDate(match.Groups[1].Value.Trim(), dateFormats);
                    if (dt != null) return dt;
                }
            }
            return null;
        }

        private static DateTime? TryParseDate(string dateStr, string[] formats)
        {
            if (DateTime.TryParseExact(dateStr, formats,
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                return dt;
            if (DateTime.TryParse(dateStr, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out dt))
                return dt;
            return null;
        }

        private static decimal? ExtractAmount(string text, string pattern)
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
            if (match.Success)
            {
                var amountStr = match.Groups[1].Value.Replace(",", "").Trim();
                if (decimal.TryParse(amountStr, NumberStyles.Number,
                        CultureInfo.InvariantCulture, out var amount) && amount > 0)
                    return amount;
            }
            return null;
        }

        private static decimal? ExtractVatRate(string text)
        {
            var match = Regex.Match(text,
                @"(?:sales\s*tax|vat|tax|gst|מע""מ)\s*(?:rate)?[:\s(]*(\d{1,2}(?:\.\d{1,2})?)\s*%",
                RegexOptions.IgnoreCase);
            if (match.Success && decimal.TryParse(match.Groups[1].Value,
                    NumberStyles.Number, CultureInfo.InvariantCulture, out var rate))
                return rate;
            return null;
        }

        private static string? ExtractCurrency(string text)
        {
            // Symbol-based detection
            if (Regex.IsMatch(text, @"₪|NIS|ILS|שקל", RegexOptions.IgnoreCase)) return "ILS";
            if (Regex.IsMatch(text, @"€|EUR", RegexOptions.IgnoreCase)) return "EUR";
            if (Regex.IsMatch(text, @"£|GBP", RegexOptions.IgnoreCase)) return "GBP";
            if (Regex.IsMatch(text, @"\$|USD", RegexOptions.IgnoreCase)) return "USD";
            return null;
        }

        private static string? ExtractVendorTaxId(string text)
        {
            var patterns = new[]
            {
                @"(?:tax\s*id|tin|vat\s*(?:no|number|reg)|ע\.?מ|ח\.?פ)\s*[:.]?\s*(\d[\d\-]{5,15})",
                @"(?:business\s*(?:no|number|id)|registration)\s*[:.]?\s*(\d[\d\-]{5,15})"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                    return match.Groups[1].Value.Trim();
            }
            return null;
        }

        private static string? ExtractLastFourDigits(string text)
        {
            var patterns = new[]
            {
                @"(?:\*{4}|\*{2,}\s*)(\d{4})",
                @"(?:card|ending\s*in|last\s*4)\s*[:.]?\s*(\d{4})",
                @"x{2,}(\d{4})"
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                    return match.Groups[1].Value;
            }
            return null;
        }

        // ── Line items extraction (ported from mock's smart approach) ─────

        private static List<ExtractedLineItem> ExtractLineItems(string text)
        {
            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                            .Select(l => l.Trim())
                            .Where(l => l.Length > 0)
                            .ToList();

            int headerIdx = FindHeaderIndex(lines);
            if (headerIdx == -1)
                return FallbackExtractLineItems(lines);

            int footerIdx = FindFooterIndex(lines, headerIdx);
            var bodyLines = ExtractBodyLines(lines, headerIdx, footerIdx);

            bool qtyFirst = DetectColumnOrder(lines[headerIdx]);
            return ParseBodyLines(bodyLines, qtyFirst);
        }

        private static int FindHeaderIndex(List<string> lines)
        {
            for (int i = 0; i < lines.Count; i++)
            {
                var l = lines[i];
                if (Regex.IsMatch(l, @"(?:description|item|service|product|particulars|פירוט|תיאור)", RegexOptions.IgnoreCase) &&
                    Regex.IsMatch(l, @"(?:qty|quantity|hours|units|amount|price|מחיר|כמות)", RegexOptions.IgnoreCase))
                {
                    return i;
                }
            }
            return -1;
        }

        private static int FindFooterIndex(List<string> lines, int headerIdx)
        {
            for (int i = headerIdx + 1; i < lines.Count; i++)
            {
                if (Regex.IsMatch(lines[i],
                    @"^\s*(?:subtotal|sub[\s-]*total|total|amount\s*due|balance\s*due|סה""כ)", RegexOptions.IgnoreCase))
                {
                    return i;
                }
            }
            return -1;
        }

        private static List<string> ExtractBodyLines(List<string> lines, int headerIdx, int footerIdx)
        {
            return lines
                .Skip(headerIdx + 1)
                .Take((footerIdx == -1 ? lines.Count : footerIdx) - headerIdx - 1)
                .ToList();
        }

        private static bool DetectColumnOrder(string headerLine)
        {
            var headerLineLower = headerLine.ToLower();
            var qtyMatch = Regex.Match(headerLineLower, @"qty|quantity|hours|units|כמות");
            var descMatch = Regex.Match(headerLineLower, @"desc|item|service|product|particular|פירוט|תיאור");
            return qtyMatch.Success && descMatch.Success && qtyMatch.Index < descMatch.Index;
        }

        private static List<ExtractedLineItem> ParseBodyLines(List<string> bodyLines, bool qtyFirst)
        {
            var items = new List<ExtractedLineItem>();
            var patQtyFirst4 = new Regex(@"^(\d[\d,]*(?:\.\d{1,2})?)\s+(.+?)\s+[$€£₪]?(\d[\d,]*\.\d{2})\s+[$€£₪]?(\d[\d,]*\.\d{2})\s*$");
            var patQtyFirst3 = new Regex(@"^(\d[\d,]*(?:\.\d{1,2})?)\s+(.+?)\s+[$€£₪]?(\d[\d,]*\.\d{2})\s*$");
            var patDescFirst4 = new Regex(@"^(.+?)\s+(\d[\d,]*(?:\.\d{1,2})?)\s+[$€£₪]?(\d[\d,]*\.\d{2})\s+[$€£₪]?(\d[\d,]*\.\d{2})\s*$");
            var patDescFirst3 = new Regex(@"^(.+?)\s+[$€£₪]?(\d[\d,]*\.\d{2})\s+[$€£₪]?(\d[\d,]*\.\d{2})\s*$");
            var patDescFirst2 = new Regex(@"^(.+?)\s+[$€£₪]?(\d[\d,]*\.\d{2})\s*$");

            foreach (var line in bodyLines)
            {
                if (ShouldSkipLine(line))
                    continue;

                var item = TryParseLineFromPatterns(line, qtyFirst, patQtyFirst4, patQtyFirst3, patDescFirst4, patDescFirst3, patDescFirst2);
                if (item != null)
                    items.Add(item);
            }

            return items;
        }

        private static bool ShouldSkipLine(string line)
        {
            if (string.IsNullOrWhiteSpace(line) || Regex.IsMatch(line, @"^[-=\s]+$"))
                return true;
            if (Regex.IsMatch(line, @"(?:sales\s*tax|vat|tax|gst|discount|shipping|delivery|מע""מ)", RegexOptions.IgnoreCase))
                return true;
            return false;
        }

        private static ExtractedLineItem? TryParseLineFromPatterns(
            string line,
            bool qtyFirst,
            Regex patQtyFirst4,
            Regex patQtyFirst3,
            Regex patDescFirst4,
            Regex patDescFirst3,
            Regex patDescFirst2)
        {
            if (qtyFirst)
            {
                var m = patQtyFirst4.Match(line);
                if (m.Success && TryParseLineItem4ColQtyFirst(m, 0.85m, out var item))
                    return item;

                m = patQtyFirst3.Match(line);
                if (m.Success && TryParseLineItem3ColQtyFirst(m, 0.72m, out item))
                    return item;
            }

            var match = patDescFirst4.Match(line);
            if (match.Success && TryParseLineItem4ColDescFirst(match, 0.85m, out var item2))
                return item2;

            match = patDescFirst3.Match(line);
            if (match.Success && TryParseLineItem3ColDescFirst(match, 0.75m, out item2))
                return item2;

            match = patDescFirst2.Match(line);
            if (match.Success && TryParseLineItem2ColDescFirst(match, out item2))
                return item2;

            return null;
        }

        private static bool TryParseLineItem2ColDescFirst(Match m, out ExtractedLineItem item)
        {
            item = new ExtractedLineItem();
            var desc = m.Groups[1].Value.Trim();
            if (desc.Length <= 1 || Regex.IsMatch(desc, @"^\d[\d.]*$"))
                return false;
            if (Regex.IsMatch(desc, @"(?:total|subtotal|vat|tax|discount|balance)", RegexOptions.IgnoreCase))
                return false;

            if (!decimal.TryParse(m.Groups[2].Value.Replace(",", ""),
                NumberStyles.Number, CultureInfo.InvariantCulture, out var total))
                return false;

            item = new ExtractedLineItem
            {
                Description = desc,
                Quantity = 1,
                UnitPrice = total,
                TotalAmount = total,
                AiConfidenceScore = 0.55m
            };
            return true;
        }

        /// <summary>
        /// Fallback when no table header is found — scan all lines but be strict
        /// about what qualifies as a line item to avoid false positives.
        /// </summary>
        private static List<ExtractedLineItem> FallbackExtractLineItems(List<string> lines)
        {
            var items = new List<ExtractedLineItem>();
            var patDescFirst4 = new Regex(
                @"^(.+?)\s+(\d[\d,]*(?:\.\d{1,2})?)\s+[$€£₪]?(\d[\d,]*\.\d{2})\s+[$€£₪]?(\d[\d,]*\.\d{2})\s*$");

            foreach (var line in lines)
            {
                // Only match 4-column patterns in fallback mode to minimize false positives
                if (Regex.IsMatch(line, @"^(description|item|product|qty|quantity|price|amount|total|subtotal|vat|tax|date|invoice|page|bill)",
                        RegexOptions.IgnoreCase))
                    continue;
                if (Regex.IsMatch(line, @"(?:total|subtotal|vat|tax|discount|balance|amount\s*due)", RegexOptions.IgnoreCase))
                    continue;

                var m = patDescFirst4.Match(line);
                if (m.Success && TryParseLineItem4ColDescFirst(m, 0.60m, out var item))
                    items.Add(item);
            }
            return items;
        }

        // ── Line item parsing helpers ─────────────────────────────────────

        private static bool TryParseLineItem4ColDescFirst(Match m, decimal confidence, out ExtractedLineItem item)
            => TryParseLineItemPattern(m, confidence, descGroupIndex: 1, qtyGroupIndex: 2, unitPriceGroupIndex: 3, totalGroupIndex: 4, out item);

        private static bool TryParseLineItem3ColDescFirst(Match m, decimal confidence, out ExtractedLineItem item)
            => TryParseLineItemPattern(m, confidence, descGroupIndex: 1, qtyGroupIndex: null, unitPriceGroupIndex: 2, totalGroupIndex: 3, out item);

        private static bool TryParseLineItem4ColQtyFirst(Match m, decimal confidence, out ExtractedLineItem item)
            => TryParseLineItemPattern(m, confidence, descGroupIndex: 2, qtyGroupIndex: 1, unitPriceGroupIndex: 3, totalGroupIndex: 4, out item);

        private static bool TryParseLineItem3ColQtyFirst(Match m, decimal confidence, out ExtractedLineItem item)
        {
            return TryParseLineItemPattern(
                m,
                confidence,
                descGroupIndex: 2,
                qtyGroupIndex: 1,
                unitPriceGroupIndex: null,
                totalGroupIndex: 3,
                out item);
        }

        private static bool TryParseLineItemPattern(
            Match m,
            decimal confidence,
            int descGroupIndex,
            int? qtyGroupIndex,
            int? unitPriceGroupIndex,
            int totalGroupIndex,
            out ExtractedLineItem item)
        {
            item = new ExtractedLineItem();
            var desc = m.Groups[descGroupIndex].Value.Trim();
            if (desc.Length <= 1) return false;

            if (!TryParseDecimalGroup(m, totalGroupIndex, out var total))
                return false;

            decimal qty;
            if (qtyGroupIndex.HasValue)
            {
                if (!TryParseDecimalGroup(m, qtyGroupIndex.Value, out qty))
                    return false;
            }
            else
            {
                qty = 1;
            }

            decimal unitPrice;
            if (unitPriceGroupIndex.HasValue)
            {
                if (!TryParseDecimalGroup(m, unitPriceGroupIndex.Value, out unitPrice))
                    return false;
            }
            else
            {
                unitPrice = qty > 0 ? Math.Round(total / qty, 2) : total;
            }

            if (!qtyGroupIndex.HasValue)
                qty = unitPrice > 0 ? Math.Round(total / unitPrice, 2) : 1;

            item = new ExtractedLineItem
            {
                Description = desc,
                Quantity = qty,
                UnitPrice = unitPrice,
                TotalAmount = total,
                AiConfidenceScore = confidence
            };
            return true;
        }

        private static bool TryParseDecimalGroup(Match m, int groupIndex, out decimal value)
            => decimal.TryParse(
                m.Groups[groupIndex].Value.Replace(",", ""),
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out value);
    }
}
