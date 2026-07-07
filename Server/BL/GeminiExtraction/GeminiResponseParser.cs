using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.GeminiExtraction
{
    public class GeminiResponseParser
    {
        public PdfExtractionResult? Parse(string responseText)
        {
            if (string.IsNullOrWhiteSpace(responseText))
                return null;
            try
            {
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
                    return null;
                }

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
            catch (JsonException)
            {
                return null;
            }
        }
    }
}
