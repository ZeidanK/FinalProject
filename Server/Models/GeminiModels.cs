using System.Text.Json.Serialization;
using Mscc.GenerativeAI;

namespace FinalProjectAuthAPI.Models
{
    public class GeminiSettings
    {
        public string ApiKey { get; set; } = string.Empty;
        public List<string> ApiKeys { get; set; } = new();
        public string Model { get; set; } = "gemini-2.5-flash";
        public List<string> Models { get; set; } = new();
    }

    public sealed class GeminiApiKeyPool
    {
        private readonly IReadOnlyList<GoogleAI> _clients;
        private int _preferredKeyIndex;

        public GeminiApiKeyPool(GeminiSettings settings)
        {
            var keys = new[] { settings.ApiKey }
                .Concat(settings.ApiKeys ?? new List<string>())
                .Where(key => !string.IsNullOrWhiteSpace(key))
                .Select(key => key.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();

            _clients = keys.Select(key => new GoogleAI(key)).ToList();
        }

        public int Count => _clients.Count;

        public int PreferredKeyIndex
        {
            get
            {
                if (Count == 0)
                    return 0;

                var index = Volatile.Read(ref _preferredKeyIndex);
                return (index & int.MaxValue) % Count;
            }
        }

        public GoogleAI GetClient(int index) => _clients[index];

        public void Prefer(int index) => Volatile.Write(ref _preferredKeyIndex, index);
    }

    internal sealed class GeminiInvoiceResponse
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

    internal sealed class GeminiLineItem
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

    internal sealed class GeminiPaymentPlan
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
