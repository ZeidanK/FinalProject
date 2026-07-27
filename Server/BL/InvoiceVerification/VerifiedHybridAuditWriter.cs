using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.InvoiceVerification
{
    public class VerifiedHybridAuditWriter : IVerifiedHybridAuditWriter
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly IWebHostEnvironment _env;
        private readonly HybridExtractionSettings _settings;
        private readonly ILogger<VerifiedHybridAuditWriter> _logger;

        public VerifiedHybridAuditWriter(
            IWebHostEnvironment env,
            HybridExtractionSettings settings,
            ILogger<VerifiedHybridAuditWriter> logger)
        {
            _env = env;
            _settings = settings;
            _logger = logger;
        }

        public async Task AppendVerifiedAsync(
            UploadJobRow job,
            StoredInvoiceJobResult storedPayload,
            PdfExtractionResult verifiedResult,
            string verificationSource)
        {
            if (storedPayload.LocalResult == null
                && storedPayload.GeminiResult == null
                && storedPayload.MergedResult == null)
            {
                return;
            }

            var rawText = storedPayload.ExtractedData?.RawText ?? verifiedResult.RawText;
            if (string.IsNullOrWhiteSpace(rawText))
                return;

            try
            {
                var relativePath = _settings.VerifiedAuditFilePath
                    .Replace('/', Path.DirectorySeparatorChar)
                    .Replace('\\', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(_env.ContentRootPath, relativePath);
                var directory = Path.GetDirectoryName(fullPath);
                if (!string.IsNullOrWhiteSpace(directory))
                    Directory.CreateDirectory(directory);

                var record = new
                {
                    text = rawText,
                    fileName = job.FileOriginalName,
                    timestampUtc = DateTime.UtcNow,
                    verificationSource,
                    localResult = WithoutRawText(storedPayload.LocalResult),
                    geminiResult = WithoutRawText(storedPayload.GeminiResult),
                    mergedResult = WithoutRawText(storedPayload.MergedResult ?? storedPayload.ExtractedData),
                    verifiedResult = WithoutRawText(verifiedResult),
                    fieldSources = storedPayload.FieldSources,
                    usedRegexFallback = storedPayload.UsedRegexFallback
                };

                var line = JsonSerializer.Serialize(record, JsonOptions) + Environment.NewLine;
                await File.AppendAllTextAsync(fullPath, line);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not append verified hybrid audit for upload job {JobId}: {Message}", job.Id, ex.Message);
            }
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
                PaymentPlan = result.PaymentPlan == null
                    ? null
                    : new PaymentPlanInfo
                    {
                        TotalInstallments = result.PaymentPlan.TotalInstallments,
                        InstallmentAmount = result.PaymentPlan.InstallmentAmount,
                        Frequency = result.PaymentPlan.Frequency,
                        CurrentInstallment = result.PaymentPlan.CurrentInstallment,
                        Description = result.PaymentPlan.Description
                    },
                LineItems = result.LineItems.Select(item => new ExtractedLineItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount,
                    VatRate = item.VatRate,
                    Category = item.Category,
                    AiConfidenceScore = item.AiConfidenceScore
                }).ToList(),
                ExtractionConfidence = result.ExtractionConfidence,
                ExtractionMethod = result.ExtractionMethod,
                ExtractionSource = result.ExtractionSource,
                RawText = null
            };
        }
    }
}
