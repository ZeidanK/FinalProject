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
            long invoiceId,
            bool isDuplicate,
            InvoiceJobAutoMatchResult? autoMatch,
            string message)
        {
            return JsonSerializer.Serialize(new
            {
                invoiceId,
                isDuplicate,
                extractedData = extracted,
                autoMatchResult = autoMatch,
                message
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
    }

    public sealed class StoredInvoiceJobResult
    {
        public long? InvoiceId { get; set; }
        public bool IsDuplicate { get; set; }
        public PdfExtractionResult? ExtractedData { get; set; }
    }
}
