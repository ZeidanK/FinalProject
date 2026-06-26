using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class OllamaSettings
    {
        public string Url   { get; set; } = "http://91.108.121.20:11434";
        public string Model { get; set; } = "llama3";
    }

    public class OllamaExtractionService : IGeminiExtractionService
    {
        private readonly OllamaSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<OllamaExtractionService> _logger;

        private static readonly Dictionary<string, List<string>> _vendorNameCache =
            new(StringComparer.OrdinalIgnoreCase);
        private static readonly SemaphoreSlim _cacheLock = new(1, 1);

        public OllamaExtractionService(
            OllamaSettings settings,
            IHttpClientFactory httpClientFactory,
            ILogger<OllamaExtractionService> logger)
        {
            _settings          = settings;
            _httpClientFactory = httpClientFactory;
            _logger            = logger;
        }

        // ── Core HTTP call ────────────────────────────────────────────────

        private async Task<string?> CallOllamaAsync(string prompt)
        {
            var client = _httpClientFactory.CreateClient("ollama");

            var requestBody = new { model = _settings.Model, prompt, stream = false };
            var json        = JsonSerializer.Serialize(requestBody);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{_settings.Url}/api/generate", content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            return doc.RootElement.TryGetProperty("response", out var r) ? r.GetString() : null;
        }

        // ── Invoice extraction ────────────────────────────────────────────

        public async Task<PdfExtractionResult?> ParseInvoiceTextAsync(string rawText)
        {
            Console.WriteLine("\n========== OLLAMA EXTRACTION ATTEMPT ==========");

            if (string.IsNullOrWhiteSpace(rawText))
            {
                Console.WriteLine("[ERROR] Raw text is empty. Cannot parse invoice.");
                _logger.LogWarning("Raw text is empty. Cannot parse invoice.");
                return null;
            }

            Console.WriteLine($"[INFO] Text length: {rawText.Length} chars | Model: {_settings.Model} | URL: {_settings.Url}");

            try
            {
                var prompt       = BuildInvoiceExtractionPrompt(rawText);
                var responseText = await CallOllamaAsync(prompt);

                if (string.IsNullOrWhiteSpace(responseText))
                {
                    Console.WriteLine("[WARNING] Ollama returned empty response.");
                    _logger.LogWarning("Ollama returned empty response.");
                    return null;
                }

                Console.WriteLine("[SUCCESS] Received response from Ollama!");
                Console.WriteLine($"[INFO] Response length: {responseText.Length} characters");
                Console.WriteLine("\n========== OLLAMA RAW RESPONSE ==========\n");
                Console.WriteLine(responseText);
                Console.WriteLine("\n=========================================\n");

                var result = ParseResponse(responseText);

                if (result != null)
                {
                    Console.WriteLine($"[SUCCESS] Parsed invoice. Confidence: {result.ExtractionConfidence}");
                    Console.WriteLine($"[INFO] Vendor: {result.VendorName}, Invoice#: {result.InvoiceNumber}, Total: {result.TotalAmount}");
                    _logger.LogInformation("Ollama parsed invoice. Confidence: {Confidence}", result.ExtractionConfidence);
                }
                else
                {
                    Console.WriteLine("[ERROR] Failed to parse Ollama response into structured data.");
                }

                Console.WriteLine("================================================\n");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Ollama call failed: {ex.Message}");
                _logger.LogError(ex, "Error calling Ollama API: {Message}", ex.Message);
                return null;
            }
        }

        private static string BuildInvoiceExtractionPrompt(string rawText) =>
            $@"Extract invoice data from the text below. Output ONLY a raw JSON object — no prose, no markdown, no code fences.
Dates: yyyy-MM-dd. Amounts: numbers only. Missing fields: null. Currency: 3-letter code (USD/EUR/ILS). vatRate as percent number (e.g. 17).
Detect installment plans: e.g. ""Payment 3 of 10"" → totalInstallments:10, currentInstallment:3. Hebrew: ""תשלומים 6"" → totalInstallments:6.

Required JSON structure (use these exact field names):
{{""vendorName"":null,""invoiceNumber"":null,""invoiceDate"":null,""dueDate"":null,""totalAmount"":null,""subtotal"":null,""vatRate"":null,""vatAmount"":null,""currency"":""USD"",""vendorTaxId"":null,""lastFourDigitsCard"":null,""itemCount"":null,""paymentPlan"":null,""lineItems"":[],""overallConfidence"":0.5}}

paymentPlan shape when present: {{""totalInstallments"":null,""installmentAmount"":null,""frequency"":null,""currentInstallment"":null,""description"":null}}
lineItem shape: {{""description"":"""",""quantity"":1,""unitPrice"":0,""totalAmount"":0,""vatRate"":null,""category"":null,""aiConfidenceScore"":0.5}}

INVOICE TEXT:
{rawText}

JSON:";

        // ── Vendor name translation ────────────────────────────────────────

        public async Task<List<string>> TranslateVendorNameAsync(string vendorName)
        {
            if (string.IsNullOrWhiteSpace(vendorName))
                return new List<string> { vendorName };

            await _cacheLock.WaitAsync();
            try
            {
                if (_vendorNameCache.TryGetValue(vendorName, out var cached))
                    return cached;
            }
            finally { _cacheLock.Release(); }

            try
            {
                var prompt = $@"Given this company/vendor name: ""{vendorName}""

Return a JSON array of all likely name variants that might appear in a bank transaction description.
Include:
- The original name
- English translation (if the name is in Hebrew or another language)
- Hebrew version (if the name is in English)
- Common abbreviations
- Name without legal suffixes (Ltd, בע""מ, Inc, etc.)

Return ONLY a JSON array of strings, nothing else. Example: [""Original Name"", ""Translated Name"", ""Abbreviation""]
If you cannot translate, just return the original name in an array.";

                var text = (await CallOllamaAsync(prompt))?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return CacheAndReturn(vendorName, new List<string> { vendorName });

                if (text.StartsWith("```"))
                    text = string.Join("", text.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")));

                var variants = JsonSerializer.Deserialize<List<string>>(text);
                if (variants == null || variants.Count == 0)
                    return CacheAndReturn(vendorName, new List<string> { vendorName });

                if (!variants.Contains(vendorName, StringComparer.OrdinalIgnoreCase))
                    variants.Insert(0, vendorName);

                return CacheAndReturn(vendorName, variants);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Ollama vendor name translation failed for: {Name}", vendorName);
                return CacheAndReturn(vendorName, new List<string> { vendorName });
            }
        }

        // ── Vendor name comparison ─────────────────────────────────────────

        public async Task<List<VendorComparisonResult>> CompareVendorNamesAsync(
            string invoiceVendorName,
            List<string> transactionDescriptions)
        {
            if (transactionDescriptions.Count == 0)
                return new List<VendorComparisonResult>();

            try
            {
                var descriptionsJson = JsonSerializer.Serialize(transactionDescriptions);
                var prompt = $@"You are a vendor name matching expert. Compare the invoice vendor name against each transaction description and rate their similarity.

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

                var text = (await CallOllamaAsync(prompt))?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return new List<VendorComparisonResult>();

                if (text.StartsWith("```"))
                    text = string.Join("\n", text.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")));

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return JsonSerializer.Deserialize<List<VendorComparisonResult>>(text.Trim(), options)
                       ?? new List<VendorComparisonResult>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Ollama vendor name comparison failed for: {Name}", invoiceVendorName);
                return new List<VendorComparisonResult>();
            }
        }

        // ── Response parsing ──────────────────────────────────────────────

        private PdfExtractionResult? ParseResponse(string responseText)
        {
            try
            {
                // Extract JSON by finding first { and last } — handles llama3 prose around the block
                var first = responseText.IndexOf('{');
                var last  = responseText.LastIndexOf('}');
                if (first < 0 || last <= first)
                {
                    _logger.LogWarning("Ollama response contains no JSON object.");
                    return null;
                }
                var cleanJson = responseText[first..(last + 1)];

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                };

                var data = JsonSerializer.Deserialize<AiInvoiceResponse>(cleanJson, options);
                if (data == null) return null;

                return new PdfExtractionResult
                {
                    VendorName          = data.VendorName,
                    InvoiceNumber       = data.InvoiceNumber,
                    InvoiceDate         = data.InvoiceDate,
                    DueDate             = data.DueDate,
                    TotalAmount         = data.TotalAmount,
                    Subtotal            = data.Subtotal,
                    VatRate             = data.VatRate,
                    VatAmount           = data.VatAmount,
                    Currency            = data.Currency ?? "USD",
                    VendorTaxId         = data.VendorTaxId,
                    LastFourDigitsCard  = data.LastFourDigitsCard,
                    ItemCount           = data.ItemCount,
                    PaymentPlan         = data.PaymentPlan != null ? new PaymentPlanInfo
                    {
                        TotalInstallments  = data.PaymentPlan.TotalInstallments,
                        InstallmentAmount  = data.PaymentPlan.InstallmentAmount,
                        Frequency          = data.PaymentPlan.Frequency,
                        CurrentInstallment = data.PaymentPlan.CurrentInstallment,
                        Description        = data.PaymentPlan.Description,
                    } : null,
                    LineItems = data.LineItems?.Select(li => new ExtractedLineItem
                    {
                        Description       = li.Description ?? "",
                        Quantity          = li.Quantity         ?? 1,
                        UnitPrice         = li.UnitPrice        ?? 0,
                        TotalAmount       = li.TotalAmount      ?? 0,
                        VatRate           = li.VatRate,
                        Category          = li.Category,
                        AiConfidenceScore = li.AiConfidenceScore,
                    }).ToList() ?? new List<ExtractedLineItem>(),
                    ExtractionConfidence = data.OverallConfidence ?? 0.5m,
                    ExtractionSource     = "ollama",
                };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse Ollama JSON response.");
                return null;
            }
        }

        private static List<string> CacheAndReturn(string key, List<string> values)
        {
            _cacheLock.Wait();
            try { _vendorNameCache[key] = values; }
            finally { _cacheLock.Release(); }
            return values;
        }

        // ── Private response DTOs ─────────────────────────────────────────
        // Uses shared AiInvoiceResponse/AiLineItem/AiPaymentPlan from InvoiceModels.cs
    }
}
