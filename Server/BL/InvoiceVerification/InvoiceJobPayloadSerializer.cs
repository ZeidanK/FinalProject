using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.InvoiceVerification
{
    public class InvoiceJobPayloadSerializer
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public StoredInvoiceJobResult ReadStoredPayload(string? resultJson)
        {
            if (string.IsNullOrWhiteSpace(resultJson))
                return new StoredInvoiceJobResult();

            try
            {
                return JsonSerializer.Deserialize<StoredInvoiceJobResult>(resultJson, JsonOptions)
                    ?? new StoredInvoiceJobResult();
            }
            catch
            {
                return new StoredInvoiceJobResult();
            }
        }

        public string BuildResultJson(
            PdfExtractionResult? extracted,
            long? invoiceId,
            bool isDuplicate,
            InvoiceJobAutoMatchResult? autoMatch,
            string message,
            HybridExtractionAudit? hybridAudit = null,
            PdfExtractionResult? verifiedResult = null,
            string? verificationSource = null,
            bool usedRegexFallback = false)
        {
            return JsonSerializer.Serialize(new StoredInvoiceJobResult
            {
                InvoiceId = invoiceId,
                IsDuplicate = isDuplicate,
                ExtractedData = extracted,
                LocalResult = WithoutRawText(hybridAudit?.LocalResult),
                GeminiResult = WithoutRawText(hybridAudit?.GeminiResult),
                MergedResult = WithoutRawText(hybridAudit?.MergedResult),
                FieldSources = hybridAudit?.FieldSources ?? new Dictionary<string, string>(),
                UsedRegexFallback = usedRegexFallback,
                VerifiedResult = WithoutRawText(verifiedResult),
                VerificationSource = verificationSource,
                AutoMatchResult = autoMatch,
                Message = message
            }, JsonOptions);
        }

        public InvoiceJobVerificationResult Result(
            long jobId,
            string outcome,
            string message,
            decimal? confidence = null,
            long? invoiceId = null)
        {
            return new InvoiceJobVerificationResult
            {
                JobId = jobId,
                InvoiceId = invoiceId,
                Outcome = outcome,
                Message = message,
                Confidence = confidence
            };
        }

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
                PaymentPlan = result.PaymentPlan,
                LineItems = result.LineItems,
                ExtractionConfidence = result.ExtractionConfidence,
                ExtractionMethod = result.ExtractionMethod,
                ExtractionSource = result.ExtractionSource,
                RawText = null
            };
        }
    }

    public sealed class StoredInvoiceJobResult
    {
        public long? InvoiceId { get; set; }
        public bool IsDuplicate { get; set; }
        public PdfExtractionResult? ExtractedData { get; set; }
        public PdfExtractionResult? LocalResult { get; set; }
        public PdfExtractionResult? GeminiResult { get; set; }
        public PdfExtractionResult? MergedResult { get; set; }
        public Dictionary<string, string> FieldSources { get; set; } = new();
        public bool UsedRegexFallback { get; set; }
        public PdfExtractionResult? VerifiedResult { get; set; }
        public string? VerificationSource { get; set; }
        public InvoiceJobAutoMatchResult? AutoMatchResult { get; set; }
        public string? Message { get; set; }
    }
}
