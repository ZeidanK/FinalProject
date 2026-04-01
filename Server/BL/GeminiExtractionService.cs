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
    }

    public class GeminiExtractionService : IGeminiExtractionService
    {
        private readonly GeminiSettings _settings;
        private readonly ILogger<GeminiExtractionService> _logger;
        private readonly GenerativeModel? _model;

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
                var googleAI = new GoogleAI(_settings.ApiKey);
                _model = googleAI.GenerativeModel(model: _settings.Model);
            }
        }

        public async Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText)
        {
            Console.WriteLine("\n========== GEMINI EXTRACTION ATTEMPT ==========");
            
            if (_model == null || string.IsNullOrWhiteSpace(_settings.ApiKey))
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
            Console.WriteLine($"[INFO] Text preview (first 500 chars):\n{rawText.Substring(0, Math.Min(500, rawText.Length))}...");

            try
            {
                var prompt = BuildInvoiceExtractionPrompt(rawText);
                
                Console.WriteLine("\n[INFO] Sending request to Gemini API...");
                Console.WriteLine($"[INFO] Using model: {_settings.Model}");
                _logger.LogInformation("Sending invoice text to Gemini for parsing...");
                
                var response = await _model.GenerateContent(prompt);
                var responseText = response?.Text;

                Console.WriteLine("\n[SUCCESS] Received response from Gemini!");
                
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

                // Parse the JSON response
                var result = ParseGeminiResponse(responseText);
                
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
                    Console.WriteLine("[ERROR] Failed to parse Gemini response into structured data.");
                    Console.WriteLine("================================================\n");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n[ERROR] Exception calling Gemini API: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                Console.WriteLine("================================================\n");
                _logger.LogError(ex, "Error calling Gemini API: {Message}", ex.Message);
                return null;
            }
        }

        private string BuildInvoiceExtractionPrompt(string rawText)
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
        private class GeminiInvoiceResponse
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

        private class GeminiLineItem
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

        private class GeminiPaymentPlan
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
    }
}
