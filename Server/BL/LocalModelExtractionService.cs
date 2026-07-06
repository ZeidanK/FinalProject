using System.Globalization;
using System.Text;
using System.Text.Json;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class LocalModelSettings
    {
        public string Url { get; set; } = "http://localhost:8000";
    }

    /// <summary>
    /// Calls the local Python DistilBERT NER microservice (Server/LocalModel/main.py)
    /// to extract structured fields from raw invoice text.
    /// Implements IGeminiExtractionService so it can be swapped in via AiProvider config.
    /// </summary>
    public class LocalModelExtractionService : IGeminiExtractionService
    {
        private readonly LocalModelSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<LocalModelExtractionService> _logger;

        public LocalModelExtractionService(
            LocalModelSettings settings,
            IHttpClientFactory httpClientFactory,
            ILogger<LocalModelExtractionService> logger)
        {
            _settings          = settings;
            _httpClientFactory = httpClientFactory;
            _logger            = logger;
        }

        public async Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText)
        {
            Console.WriteLine("\n========== LOCAL MODEL EXTRACTION ATTEMPT ==========");

            if (string.IsNullOrWhiteSpace(rawText))
            {
                _logger.LogWarning("Local model: raw text is empty.");
                return null;
            }

            Console.WriteLine($"[INFO] Text length: {rawText.Length} chars | URL: {_settings.Url}");

            var client = _httpClientFactory.CreateClient("localmodel");
            var body   = JsonSerializer.Serialize(new { text = rawText });
            using var content = new StringContent(body, Encoding.UTF8, "application/json");

            HttpResponseMessage response;
            try
            {
                response = await client.PostAsync($"{_settings.Url}/extract", content);
                response.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Local model service unavailable: {ex.Message}");
                _logger.LogWarning(ex, "Local model service unavailable: {Message}", ex.Message);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[INFO] Response: {json}");

            using var doc  = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var result = new PdfExtractionResult
            {
                ExtractionSource     = "localmodel",
                ExtractionConfidence = GetDecimal(root, "confidence"),
                VendorName           = GetString(root, "vendor_name"),
                InvoiceNumber        = GetString(root, "invoice_number"),
                InvoiceDate          = ParseDate(GetString(root, "invoice_date")),
                DueDate              = ParseDate(GetString(root, "due_date")),
                TotalAmount          = ParseDecimal(GetString(root, "total_amount")),
                Subtotal             = ParseDecimal(GetString(root, "subtotal")),
                VatAmount            = ParseDecimal(GetString(root, "vat_amount")),
                VatRate              = ParseDecimal(GetString(root, "vat_rate")),
                VendorTaxId          = GetString(root, "vendor_tax_id"),
                Currency             = GetString(root, "currency") ?? "USD",
            };

            Console.WriteLine($"[SUCCESS] Local model extracted — Vendor: {result.VendorName}, " +
                              $"Invoice#: {result.InvoiceNumber}, Total: {result.TotalAmount}, " +
                              $"Confidence: {result.ExtractionConfidence:P0}");
            Console.WriteLine("====================================================\n");

            return result;
        }

        // Vendor translation / comparison are LLM-specific — not applicable for local NER model.
        public Task<List<string>> TranslateVendorNameAsync(string vendorName) =>
            Task.FromResult(new List<string> { vendorName });

        public Task<List<VendorComparisonResult>> CompareVendorNamesAsync(
            string invoiceVendorName,
            List<string> transactionDescriptions) =>
            Task.FromResult(new List<VendorComparisonResult>());

        // ── Helpers ──────────────────────────────────────────────────────────

        private static string? GetString(JsonElement root, string key) =>
            root.TryGetProperty(key, out var el) && el.ValueKind == JsonValueKind.String
                ? el.GetString()
                : null;

        private static decimal GetDecimal(JsonElement root, string key) =>
            root.TryGetProperty(key, out var el) &&
            el.TryGetDecimal(out var d) ? d : 0m;

        private static DateTime? ParseDate(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            return DateTime.TryParse(raw, CultureInfo.InvariantCulture,
                                     DateTimeStyles.None, out var dt) ? dt : null;
        }

        private static decimal? ParseDecimal(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            // Strip currency symbols, commas, whitespace — keep digits, dots, minus
            var cleaned = System.Text.RegularExpressions.Regex.Replace(raw, @"[^\d.\-]", "");
            return decimal.TryParse(cleaned, NumberStyles.Any,
                                    CultureInfo.InvariantCulture, out var d) ? d : null;
        }
    }
}
