using FinalProjectAuthAPI.BL.GeminiExtraction;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class GeminiExtractionService : IGeminiExtractionService
    {
        private readonly GeminiApiClient _apiClient;
        private readonly GeminiResponseParser _responseParser;
        private readonly VendorNameService _vendorNameService;
        private readonly ILogger<GeminiExtractionService> _logger;

        public GeminiExtractionService(
            GeminiSettings settings,
            GeminiApiKeyPool keyPool,
            ILoggerFactory loggerFactory,
            ILogger<GeminiExtractionService> logger)
        {
            _logger = logger;
            _apiClient = new GeminiApiClient(keyPool, settings, loggerFactory.CreateLogger<GeminiApiClient>());
            _responseParser = new GeminiResponseParser();
            _vendorNameService = new VendorNameService(_apiClient);

            if (keyPool.Count == 0)
            {
                _logger.LogWarning("No Gemini API keys are configured. Service will be unavailable.");
            }
        }

        public async Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText)
        {
            Console.WriteLine("\n========== GEMINI EXTRACTION ATTEMPT ==========");

            if (string.IsNullOrWhiteSpace(rawText))
            {
                Console.WriteLine("[ERROR] Raw text is empty. Cannot parse invoice.");
                _logger.LogWarning("Raw text is empty. Cannot parse invoice.");
                return null;
            }

            Console.WriteLine($"[INFO] Extracted text length: {rawText.Length} characters");
            Console.WriteLine($"[INFO] Text preview:\n{rawText}...");

            var prompt = BuildInvoiceExtractionPrompt(rawText);
            Console.WriteLine("\n[INFO] Sending request to Gemini API...");
            _logger.LogInformation("Sending invoice text to Gemini for parsing...");

            var result = await _apiClient.TryAllModelsAsync<PdfExtractionResult>(async model =>
            {
                var response = await model.GenerateContent(prompt);
                var responseText = response?.Text;

                if (string.IsNullOrWhiteSpace(responseText))
                {
                    Console.WriteLine("[WARNING] Gemini returned empty response.");
                    _logger.LogWarning("Gemini returned empty response.");
                    return null;
                }

                Console.WriteLine($"[INFO] Response length: {responseText.Length} characters");
                Console.WriteLine("\n========== GEMINI RAW RESPONSE ==========\n");
                Console.WriteLine(responseText);
                Console.WriteLine("\n========================================\n");
                _logger.LogDebug("Gemini response: {Response}", responseText);

                return _responseParser.Parse(responseText);
            }, "ParseInvoice");

            if (result != null)
            {
                Console.WriteLine($"[SUCCESS] Successfully parsed invoice with Gemini. Confidence: {result.ExtractionConfidence}");
                Console.WriteLine($"[INFO] Vendor: {result.VendorName}, Invoice#: {result.InvoiceNumber}, Total: {result.TotalAmount}");
                Console.WriteLine($"[INFO] Line items found: {result.LineItems?.Count ?? 0}");
                Console.WriteLine("================================================\n");
                _logger.LogInformation("Successfully parsed invoice with Gemini. Confidence: {Confidence}", result.ExtractionConfidence);
            }
            else
            {
                Console.WriteLine("[ERROR] All Gemini models failed to parse invoice.");
                Console.WriteLine("================================================\n");
            }

            return result;
        }

        public async Task<List<string>> TranslateVendorNameAsync(string vendorName) =>
            await _vendorNameService.TranslateVendorNameAsync(vendorName);

        public async Task<List<VendorComparisonResult>> CompareVendorNamesAsync(string invoiceVendorName, List<string> transactionDescriptions) =>
            await _vendorNameService.CompareVendorNamesAsync(invoiceVendorName, transactionDescriptions);

        private static string BuildInvoiceExtractionPrompt(string rawText)
        {
            return $@"You are an invoice data extraction expert. Extract structured data from the following invoice text.
The invoice may be in Hebrew or English. Extract all available fields with high accuracy.

**IMPORTANT INSTRUCTIONS:**
1. Return ONLY valid JSON, no markdown, no explanations, no code blocks
2. For dates, use ISO 8601 format (yyyy-MM-dd)
3. For amounts, use decimal numbers only (no currency symbols)
4. If a field is not found, use null
5. Extract ALL line items from the invoice
6. Calculate confidence scores (0.0 to 1.0) for each field based on certainty
7. For VatRate, extract as percentage (e.g., 17 for 17%)
8. For Currency, use 3-letter code (USD, EUR, ILS, GBP)
9. Extract vendor tax ID / business number if present (like מס׳ עוסק, Tax ID, VAT number, etc.)
10. Extract last 4 digits of credit card if payment method mentioned
11. **Extract item count**: Total number of distinct items/products in the invoice
12. **Extract payment plan information**: If the invoice mentions installments, payment plans, or split payments

**PAYMENT PLAN DETECTION:**
Look for phrases like:
- ""Payment 3 of 10"" or ""3/10"" → totalInstallments: 10, currentInstallment: 3
- ""Paid in 5 installments of $200 each"" → totalInstallments: 5, installmentAmount: 200
- ""Monthly payment plan - 12 months"" → totalInstallments: 12, frequency: ""monthly""
- ""Split into 4 equal payments"" → totalInstallments: 4
- ""תשלום 3 מתוך 10"" (Hebrew) → totalInstallments: 10, currentInstallment: 3
- ""תשלומים 6"" (Hebrew) → totalInstallments: 6

**JSON SCHEMA:**
{{
  ""vendorName"": ""string or null"",
  ""invoiceNumber"": ""string or null"",
  ""invoiceDate"": ""yyyy-MM-dd or null"",
  ""dueDate"": ""yyyy-MM-dd or null"",
  ""totalAmount"": number or null,
  ""subtotal"": number or null,
  ""vatRate"": number or null (percentage),
  ""vatAmount"": number or null,
  ""currency"": ""string or null (3-letter code)"",
  ""vendorTaxId"": ""string or null"",
  ""lastFourDigitsCard"": ""string or null (4 digits)"",
  ""itemCount"": number or null,
  ""paymentPlan"": {{
    ""totalInstallments"": number or null,
    ""installmentAmount"": number or null,
    ""frequency"": ""monthly"" | ""weekly"" | ""biweekly"" | ""one-time"" | null,
    ""currentInstallment"": number or null,
    ""description"": ""string or null""
  }} or null,
  ""lineItems"": [
    {{
      ""description"": ""string"",
      ""quantity"": number,
      ""unitPrice"": number,
      ""totalAmount"": number,
      ""vatRate"": number or null,
      ""category"": ""string or null"",
      ""aiConfidenceScore"": number (0.0-1.0)
    }}
  ],
  ""overallConfidence"": number (0.0-1.0)
}}

**INVOICE TEXT:**
{rawText}

**OUTPUT (JSON only)**:";
        }
    }
}
