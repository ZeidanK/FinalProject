using System.Text.Json;
using FinalProjectAuthAPI.Models;
using Mscc.GenerativeAI;

namespace FinalProjectAuthAPI.BL.GeminiExtraction
{
    public class VendorNameService
    {
        private readonly GeminiApiClient _apiClient;

        private static readonly Dictionary<string, List<string>> _vendorNameCache = new(StringComparer.OrdinalIgnoreCase);
        private static readonly SemaphoreSlim _cacheLock = new(1, 1);

        public VendorNameService(GeminiApiClient apiClient)
        {
            _apiClient = apiClient;
        }

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

            var variants = await _apiClient.TryAllModelsAsync<List<string>>(async model =>
            {
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

                var response = await model.GenerateContent(translatePrompt);
                var text = response?.Text?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return null;

                if (text.StartsWith("```"))
                    text = text.Split('\n').Skip(1).TakeWhile(l => !l.StartsWith("```")).Aggregate("", (a, b) => a + b);

                var parsed = JsonSerializer.Deserialize<List<string>>(text);
                if (parsed == null || parsed.Count == 0)
                    return null;

                if (!parsed.Contains(vendorName, StringComparer.OrdinalIgnoreCase))
                    parsed.Insert(0, vendorName);

                return parsed;
            }, "TranslateVendorName");

            return CacheAndReturn(vendorName, variants ?? new List<string> { vendorName });
        }

        public async Task<List<VendorComparisonResult>> CompareVendorNamesAsync(string invoiceVendorName, List<string> transactionDescriptions)
        {
            if (transactionDescriptions.Count == 0)
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
            var results = await _apiClient.TryAllModelsAsync<List<VendorComparisonResult>>(async model =>
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

        private static List<string> CacheAndReturn(string key, List<string> values)
        {
            _cacheLock.Wait();
            try { _vendorNameCache[key] = values; }
            finally { _cacheLock.Release(); }
            return values;
        }
    }
}
