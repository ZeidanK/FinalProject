using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Mscc.GenerativeAI;

namespace FinalProjectAuthAPI.BL
{
    public class GeminiSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public string Model { get; set; } = "gemini-2.5-flash";
        public List<string> Models { get; set; } = new();
    }

    public class GeminiExtractionService : IGeminiExtractionService
    {
        private readonly GeminiSettings _settings;
        private readonly ILogger<GeminiExtractionService> _logger;
        private readonly GoogleAI? _googleAI;
        private readonly List<string> _models = new();

        public GeminiExtractionService(GeminiSettings settings, ILogger<GeminiExtractionService> logger)
        {
            _settings = settings;
            _logger = logger;

            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                _logger.LogWarning("Gemini API key is not configured. Service will be unavailable.");
            }
            else
            {
                _googleAI = new GoogleAI(_settings.ApiKey);
                _models = _settings.Models.Count > 0
                    ? _settings.Models
                    : new List<string> { _settings.Model };
            }
        }

        public async Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText)
        {
            Console.WriteLine("\n========== GEMINI EXTRACTION ATTEMPT ==========");

            if (_googleAI == null || string.IsNullOrWhiteSpace(_settings.ApiKey))
            {
                Console.WriteLine("[ERROR] Gemini service not initialized. API key missing.");
                _logger.LogWarning("Gemini service not initialized. API key missing.");
                return null;
            }

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

            var result = await TryAllModelsAsync<PdfExtractionResult>(async model =>
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

                return ParseGeminiResponse(responseText);
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

**OUTPUT (JSON only):**";
        }

        private PdfExtractionResult? ParseGeminiResponse(string responseText)
        {
            try
            {
                // Clean up response - remove markdown code blocks if present
                var cleanJson = responseText.Trim();
                if (cleanJson.StartsWith("```json"))
                {
                    cleanJson = cleanJson.Substring(7);
                }
                if (cleanJson.StartsWith("```"))
                {
                    cleanJson = cleanJson.Substring(3);
                }
                if (cleanJson.EndsWith("```"))
                {
                    cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
                }
                cleanJson = cleanJson.Trim();

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                };

                var geminiData = JsonSerializer.Deserialize<GeminiInvoiceResponse>(cleanJson, options);

                if (geminiData == null)
                {
                    _logger.LogWarning("Failed to deserialize Gemini response.");
                    return null;
                }

                // Map Gemini response to PdfExtractionResult
                var result = new PdfExtractionResult
                {
                    VendorName = geminiData.VendorName,
                    InvoiceNumber = geminiData.InvoiceNumber,
                    InvoiceDate = geminiData.InvoiceDate,
                    DueDate = geminiData.DueDate,
                    TotalAmount = geminiData.TotalAmount,
                    Subtotal = geminiData.Subtotal,
                    VatRate = geminiData.VatRate,
                    VatAmount = geminiData.VatAmount,
                    Currency = geminiData.Currency ?? "USD",
                    VendorTaxId = geminiData.VendorTaxId,
                    LastFourDigitsCard = geminiData.LastFourDigitsCard,
                    ItemCount = geminiData.ItemCount,
                    PaymentPlan = geminiData.PaymentPlan != null ? new PaymentPlanInfo
                    {
                        TotalInstallments = geminiData.PaymentPlan.TotalInstallments,
                        InstallmentAmount = geminiData.PaymentPlan.InstallmentAmount,
                        Frequency = geminiData.PaymentPlan.Frequency,
                        CurrentInstallment = geminiData.PaymentPlan.CurrentInstallment,
                        Description = geminiData.PaymentPlan.Description
                    } : null,
                    LineItems = geminiData.LineItems?.Select(li => new ExtractedLineItem
                    {
                        Description = li.Description ?? "",
                        Quantity = li.Quantity ?? 1,
                        UnitPrice = li.UnitPrice ?? 0,
                        TotalAmount = li.TotalAmount ?? 0,
                        VatRate = li.VatRate,
                        Category = li.Category,
                        AiConfidenceScore = li.AiConfidenceScore
                    }).ToList() ?? new List<ExtractedLineItem>(),
                    ExtractionConfidence = geminiData.OverallConfidence ?? 0.5m,
                    ExtractionSource = "gemini"
                };

                return result;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse Gemini JSON response: {Response}", responseText);
                return null;
            }
        }

        // Internal class for deserializing Gemini response
        private sealed class GeminiInvoiceResponse
        {
            [JsonPropertyName("vendorName")]
            public string? VendorName { get; set; }

            [JsonPropertyName("invoiceNumber")]
            public string? InvoiceNumber { get; set; }

            [JsonPropertyName("invoiceDate")]
            public DateTime? InvoiceDate { get; set; }

            [JsonPropertyName("dueDate")]
            public DateTime? DueDate { get; set; }

            [JsonPropertyName("totalAmount")]
            public decimal? TotalAmount { get; set; }

            [JsonPropertyName("subtotal")]
            public decimal? Subtotal { get; set; }

            [JsonPropertyName("vatRate")]
            public decimal? VatRate { get; set; }

            [JsonPropertyName("vatAmount")]
            public decimal? VatAmount { get; set; }

            [JsonPropertyName("currency")]
            public string? Currency { get; set; }

            [JsonPropertyName("vendorTaxId")]
            public string? VendorTaxId { get; set; }

            [JsonPropertyName("lastFourDigitsCard")]
            public string? LastFourDigitsCard { get; set; }

            [JsonPropertyName("itemCount")]
            public int? ItemCount { get; set; }

            [JsonPropertyName("paymentPlan")]
            public GeminiPaymentPlan? PaymentPlan { get; set; }

            [JsonPropertyName("lineItems")]
            public List<GeminiLineItem>? LineItems { get; set; }

            [JsonPropertyName("overallConfidence")]
            public decimal? OverallConfidence { get; set; }
        }

        private sealed class GeminiLineItem
        {
            [JsonPropertyName("description")]
            public string? Description { get; set; }

            [JsonPropertyName("quantity")]
            public decimal? Quantity { get; set; }

            [JsonPropertyName("unitPrice")]
            public decimal? UnitPrice { get; set; }

            [JsonPropertyName("totalAmount")]
            public decimal? TotalAmount { get; set; }

            [JsonPropertyName("vatRate")]
            public decimal? VatRate { get; set; }

            [JsonPropertyName("category")]
            public string? Category { get; set; }

            [JsonPropertyName("aiConfidenceScore")]
            public decimal? AiConfidenceScore { get; set; }
        }

        private sealed class GeminiPaymentPlan
        {
            [JsonPropertyName("totalInstallments")]
            public int? TotalInstallments { get; set; }

            [JsonPropertyName("installmentAmount")]
            public decimal? InstallmentAmount { get; set; }

            [JsonPropertyName("frequency")]
            public string? Frequency { get; set; }

            [JsonPropertyName("currentInstallment")]
            public int? CurrentInstallment { get; set; }

            [JsonPropertyName("description")]
            public string? Description { get; set; }
        }

        // ── Vendor name translation for matching ──────────────────────────

        private static readonly Dictionary<string, List<string>> _vendorNameCache = new(StringComparer.OrdinalIgnoreCase);
        private static readonly SemaphoreSlim _cacheLock = new(1, 1);

        public async Task<List<string>> TranslateVendorNameAsync(string vendorName)
        {
            if (string.IsNullOrWhiteSpace(vendorName))
                return new List<string> { vendorName };

            // Check app-level cache first
            await _cacheLock.WaitAsync();
            try
            {
                if (_vendorNameCache.TryGetValue(vendorName, out var cached))
                    return cached;
            }
            finally { _cacheLock.Release(); }

            // If Gemini is unavailable, return original only
            if (_googleAI == null || string.IsNullOrWhiteSpace(_settings.ApiKey))
                return new List<string> { vendorName };

            var translatePrompt = @$"Given this company/vendor name: ""{vendorName}""

Return a JSON array of all likely name variants that might appear in a bank transaction description.
Include:
- The original name
- English translation (if the name is in Hebrew or another language)
- Hebrew version (if the name is in English)
- Common abbreviations
- Name without legal suffixes (Ltd, בע""מ, Inc, etc.)

Return ONLY a JSON array of strings, nothing else. Example: [""Original Name"", ""Translated Name"", ""Abbreviation""]
If you cannot translate, just return the original name in an array.";

            var variants = await TryAllModelsAsync<List<string>>(async model =>
            {
                var response = await model.GenerateContent(translatePrompt);
                var text = response?.Text?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return null;

                // Clean markdown fencing if present
                if (text.StartsWith("```"))
                    text = text.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")).Aggregate("", (a, b) => a + b);

                var parsed = JsonSerializer.Deserialize<List<string>>(text);
                if (parsed == null || parsed.Count == 0)
                    return null;

                // Always include the original
                if (!parsed.Contains(vendorName, StringComparer.OrdinalIgnoreCase))
                    parsed.Insert(0, vendorName);

                return parsed;
            }, "TranslateVendorName");

            return CacheAndReturn(vendorName, variants ?? new List<string> { vendorName });
        }

        private static List<string> CacheAndReturn(string key, List<string> values)
        {
            _cacheLock.Wait();
            try { _vendorNameCache[key] = values; }
            finally { _cacheLock.Release(); }
            return values;
        }

        private async Task<T?> TryAllModelsAsync<T>(Func<GenerativeModel, Task<T?>> action, string operationName) where T : class
        {
            for (int i = 0; i < _models.Count; i++)
            {
                var modelName = _models[i];
                try
                {
                    var model = _googleAI!.GenerativeModel(model: modelName);
                    var result = await action(model);

                    if (result != null)
                        return result;
                }
                catch (Exception ex)
                {
                    _logger.LogDebug("{Operation}: model {Model} failed, trying next. Error: {Message}", operationName, modelName, ex.Message);
                }
            }

            _logger.LogError("{Operation}: all {Count} Gemini models exhausted.", operationName, _models.Count);
            return null;
        }

        public async Task<List<VendorComparisonResult>> CompareVendorNamesAsync(string invoiceVendorName, List<string> transactionDescriptions)
        {
            if (_googleAI == null || string.IsNullOrWhiteSpace(_settings.ApiKey) || transactionDescriptions.Count == 0)
                return new List<VendorComparisonResult>();

            var descriptionsJson = JsonSerializer.Serialize(transactionDescriptions);
            var prompt = @$"You are a vendor name matching expert. Compare the invoice vendor name against each transaction description and rate their similarity.

Invoice vendor name: ""{invoiceVendorName}""

Transaction descriptions (JSON array):
{descriptionsJson}

For each transaction description, assess how likely it refers to the same vendor as the invoice vendor name.
Consider: abbreviations, translations between Hebrew and English, common name variants, partial matches.

Return ONLY a JSON array with one object per transaction (same order), each with:
- ""transactionDescription"": the original transaction description string
- ""similarityScore"": integer from 0 to 100 (100 = definitely same vendor, 0 = definitely different)

Example output: [{{""transactionDescription"":""AMAZON"",""similarityScore"":95}}]
Return ONLY the JSON array, no markdown, no explanation.";

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var results = await TryAllModelsAsync<List<VendorComparisonResult>>(async model =>
            {
                var response = await model.GenerateContent(prompt);
                var text = response?.Text?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return null;

                if (text.StartsWith("```"))
                    text = string.Join("\n", text.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")));

                return JsonSerializer.Deserialize<List<VendorComparisonResult>>(text.Trim(), options);
            }, "CompareVendorNames");

            return results ?? new List<VendorComparisonResult>();
        }
    }
}
