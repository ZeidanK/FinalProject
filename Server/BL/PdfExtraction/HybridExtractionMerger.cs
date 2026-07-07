using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.PdfExtraction
{
    public sealed class HybridMergeResult
    {
        public PdfExtractionResult Result { get; init; } = new();
        public Dictionary<string, string> FieldSources { get; init; } = new();
    }

    public class HybridExtractionMerger
    {
        private readonly HybridExtractionSettings _settings;

        public HybridExtractionMerger(HybridExtractionSettings settings)
        {
            _settings = settings;
        }

        public HybridMergeResult Merge(PdfExtractionResult? localInput, PdfExtractionResult? geminiInput)
        {
            var local = Normalize(localInput);
            var gemini = Normalize(geminiInput);
            var fieldSources = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var localConfidence = local?.ExtractionConfidence ?? 0m;
            var geminiConfidence = gemini?.ExtractionConfidence ?? 0m;

            var merged = new PdfExtractionResult
            {
                ExtractionSource = "hybrid",
                ExtractionConfidence = Math.Max(localConfidence, geminiConfidence),
                VendorName = ChooseString("vendorName", local?.VendorName, gemini?.VendorName, true, localConfidence, fieldSources, IsNonEmpty),
                InvoiceNumber = ChooseString("invoiceNumber", local?.InvoiceNumber, gemini?.InvoiceNumber, true, localConfidence, fieldSources, IsNonEmpty),
                InvoiceDate = ChooseDate("invoiceDate", local?.InvoiceDate, gemini?.InvoiceDate, true, localConfidence, fieldSources),
                DueDate = ChooseDate("dueDate", local?.DueDate, gemini?.DueDate, false, localConfidence, fieldSources),
                TotalAmount = ChooseDecimal("totalAmount", local?.TotalAmount, gemini?.TotalAmount, true, localConfidence, fieldSources, IsPositiveAmount),
                VatAmount = ChooseDecimal("vatAmount", local?.VatAmount, gemini?.VatAmount, false, localConfidence, fieldSources, IsNonNegativeAmount),
                VatRate = ChooseDecimal("vatRate", local?.VatRate, gemini?.VatRate, false, localConfidence, fieldSources, IsValidVatRate),
                VendorTaxId = ChooseString("vendorTaxId", local?.VendorTaxId, gemini?.VendorTaxId, false, localConfidence, fieldSources, IsNonEmpty),
                Currency = ChooseCurrency(local?.Currency, gemini?.Currency, localConfidence, fieldSources),
                LastFourDigitsCard = ChooseString("lastFourDigitsCard", local?.LastFourDigitsCard, gemini?.LastFourDigitsCard, false, localConfidence, fieldSources, IsValidCardLast4),
            };

            merged.Subtotal = ChooseSubtotal(local?.Subtotal, gemini?.Subtotal, localConfidence, merged.TotalAmount, fieldSources);
            merged.PaymentPlan = MergePaymentPlan(local?.PaymentPlan, gemini?.PaymentPlan, localConfidence, fieldSources);
            merged.LineItems = ChooseLineItems(local?.LineItems, gemini?.LineItems, fieldSources);
            merged.ItemCount = ChooseItemCount(local?.ItemCount, gemini?.ItemCount, localConfidence, merged.LineItems.Count, fieldSources);

            return new HybridMergeResult
            {
                Result = merged,
                FieldSources = fieldSources
            };
        }

        private PaymentPlanInfo? MergePaymentPlan(
            PaymentPlanInfo? local,
            PaymentPlanInfo? gemini,
            decimal localConfidence,
            IDictionary<string, string> fieldSources)
        {
            var localPlan = Normalize(local);
            var geminiPlan = Normalize(gemini);
            if (localPlan == null && geminiPlan == null)
                return null;

            var merged = new PaymentPlanInfo
            {
                TotalInstallments = ChooseInt(
                    "paymentPlan.totalInstallments",
                    localPlan?.TotalInstallments,
                    geminiPlan?.TotalInstallments,
                    false,
                    localConfidence,
                    fieldSources,
                    value => value.HasValue && value.Value > 0),
                InstallmentAmount = ChooseDecimal(
                    "paymentPlan.installmentAmount",
                    localPlan?.InstallmentAmount,
                    geminiPlan?.InstallmentAmount,
                    false,
                    localConfidence,
                    fieldSources,
                    IsPositiveAmount),
                Frequency = ChooseString(
                    "paymentPlan.frequency",
                    localPlan?.Frequency,
                    geminiPlan?.Frequency,
                    false,
                    localConfidence,
                    fieldSources,
                    IsNonEmpty),
                CurrentInstallment = ChooseInt(
                    "paymentPlan.currentInstallment",
                    localPlan?.CurrentInstallment,
                    geminiPlan?.CurrentInstallment,
                    false,
                    localConfidence,
                    fieldSources,
                    value => value.HasValue && value.Value > 0),
                Description = ChooseString(
                    "paymentPlan.description",
                    localPlan?.Description,
                    geminiPlan?.Description,
                    false,
                    localConfidence,
                    fieldSources,
                    IsNonEmpty)
            };

            if (merged.TotalInstallments.HasValue && merged.CurrentInstallment.HasValue
                && merged.CurrentInstallment.Value > merged.TotalInstallments.Value)
            {
                var geminiCurrent = NormalizePositiveInt(geminiPlan?.CurrentInstallment);
                if (geminiCurrent.HasValue && geminiCurrent.Value <= merged.TotalInstallments.Value)
                {
                    merged.CurrentInstallment = geminiCurrent;
                    fieldSources["paymentPlan.currentInstallment"] = "gemini";
                }
                else
                {
                    merged.CurrentInstallment = null;
                }
            }

            return HasPaymentPlanData(merged) ? merged : null;
        }

        private List<ExtractedLineItem> ChooseLineItems(
            List<ExtractedLineItem>? localItems,
            List<ExtractedLineItem>? geminiItems,
            IDictionary<string, string> fieldSources)
        {
            var normalizedLocal = Normalize(localItems);
            var normalizedGemini = Normalize(geminiItems);
            var localScore = ScoreLineItems(normalizedLocal);
            var geminiScore = ScoreLineItems(normalizedGemini);

            if (geminiScore > localScore)
            {
                fieldSources["lineItems"] = "gemini";
                return normalizedGemini;
            }

            if (normalizedLocal.Count > 0 || normalizedGemini.Count > 0)
                fieldSources["lineItems"] = "localmodel";

            return normalizedLocal;
        }

        private int? ChooseItemCount(
            int? local,
            int? gemini,
            decimal localConfidence,
            int derivedCount,
            IDictionary<string, string> fieldSources)
        {
            var chosen = ChooseInt(
                "itemCount",
                local,
                gemini,
                false,
                localConfidence,
                fieldSources,
                value => value.HasValue && value.Value > 0);

            if (!chosen.HasValue && derivedCount > 0)
            {
                fieldSources["itemCount"] = "derived";
                return derivedCount;
            }

            return chosen;
        }

        private decimal? ChooseSubtotal(
            decimal? local,
            decimal? gemini,
            decimal localConfidence,
            decimal? totalAmount,
            IDictionary<string, string> fieldSources)
        {
            var chosen = ChooseDecimal("subtotal", local, gemini, false, localConfidence, fieldSources, IsNonNegativeAmount);
            if (chosen.HasValue && totalAmount.HasValue && chosen.Value > totalAmount.Value)
            {
                var alternate = NormalizeNonNegativeAmount(gemini);
                if (fieldSources.TryGetValue("subtotal", out var currentSource)
                    && currentSource == "gemini")
                {
                    alternate = NormalizeNonNegativeAmount(local);
                    if (alternate.HasValue && alternate.Value <= totalAmount.Value)
                    {
                        fieldSources["subtotal"] = "localmodel";
                        return alternate;
                    }
                }
                else if (alternate.HasValue && alternate.Value <= totalAmount.Value)
                {
                    fieldSources["subtotal"] = "gemini";
                    return alternate;
                }

                return null;
            }

            return chosen;
        }

        private string? ChooseCurrency(
            string? local,
            string? gemini,
            decimal localConfidence,
            IDictionary<string, string> fieldSources)
        {
            return ChooseString("currency", NormalizeCurrency(local), NormalizeCurrency(gemini), false, localConfidence, fieldSources, IsNonEmpty);
        }

        private string? ChooseString(
            string fieldName,
            string? local,
            string? gemini,
            bool isCore,
            decimal localConfidence,
            IDictionary<string, string> fieldSources,
            Func<string?, bool> validator)
        {
            local = TrimToNull(local);
            gemini = TrimToNull(gemini);
            if (StringEquals(local, gemini) && validator(local))
            {
                fieldSources[fieldName] = "localmodel";
                return local;
            }

            var localValid = validator(local);
            var geminiValid = validator(gemini);
            return ChooseValue(fieldName, local, gemini, localValid, geminiValid, isCore, localConfidence, fieldSources);
        }

        private DateTime? ChooseDate(
            string fieldName,
            DateTime? local,
            DateTime? gemini,
            bool isCore,
            decimal localConfidence,
            IDictionary<string, string> fieldSources)
        {
            local = NormalizeDate(local);
            gemini = NormalizeDate(gemini);
            if (local.HasValue && gemini.HasValue && local.Value == gemini.Value)
            {
                fieldSources[fieldName] = "localmodel";
                return local;
            }

            var localValid = local.HasValue;
            var geminiValid = gemini.HasValue;
            return ChooseValue(fieldName, local, gemini, localValid, geminiValid, isCore, localConfidence, fieldSources);
        }

        private decimal? ChooseDecimal(
            string fieldName,
            decimal? local,
            decimal? gemini,
            bool isCore,
            decimal localConfidence,
            IDictionary<string, string> fieldSources,
            Func<decimal?, bool> validator)
        {
            local = RoundDecimal(local);
            gemini = RoundDecimal(gemini);
            if (local.HasValue && gemini.HasValue && local.Value == gemini.Value && validator(local))
            {
                fieldSources[fieldName] = "localmodel";
                return local;
            }

            var localValid = validator(local);
            var geminiValid = validator(gemini);
            return ChooseValue(fieldName, local, gemini, localValid, geminiValid, isCore, localConfidence, fieldSources);
        }

        private int? ChooseInt(
            string fieldName,
            int? local,
            int? gemini,
            bool isCore,
            decimal localConfidence,
            IDictionary<string, string> fieldSources,
            Func<int?, bool> validator)
        {
            local = NormalizePositiveInt(local);
            gemini = NormalizePositiveInt(gemini);
            if (local.HasValue && gemini.HasValue && local.Value == gemini.Value && validator(local))
            {
                fieldSources[fieldName] = "localmodel";
                return local;
            }

            var localValid = validator(local);
            var geminiValid = validator(gemini);
            return ChooseValue(fieldName, local, gemini, localValid, geminiValid, isCore, localConfidence, fieldSources);
        }

        private T? ChooseValue<T>(
            string fieldName,
            T? local,
            T? gemini,
            bool localValid,
            bool geminiValid,
            bool isCore,
            decimal localConfidence,
            IDictionary<string, string> fieldSources)
        {
            if (!localValid && !geminiValid)
                return default;
            if (localValid && !geminiValid)
            {
                fieldSources[fieldName] = "localmodel";
                return local;
            }
            if (!localValid && geminiValid)
            {
                fieldSources[fieldName] = "gemini";
                return gemini;
            }
            if (isCore && localConfidence < _settings.LocalConfidenceThreshold)
            {
                fieldSources[fieldName] = "gemini";
                return gemini;
            }

            fieldSources[fieldName] = "localmodel";
            return local;
        }

        private static PdfExtractionResult? Normalize(PdfExtractionResult? input)
        {
            if (input == null)
                return null;

            return new PdfExtractionResult
            {
                VendorName = TrimToNull(input.VendorName),
                InvoiceNumber = TrimToNull(input.InvoiceNumber),
                InvoiceDate = NormalizeDate(input.InvoiceDate),
                DueDate = NormalizeDate(input.DueDate),
                TotalAmount = NormalizePositiveAmount(input.TotalAmount),
                Subtotal = NormalizeNonNegativeAmount(input.Subtotal),
                VatRate = NormalizeVatRate(input.VatRate),
                VatAmount = NormalizeNonNegativeAmount(input.VatAmount),
                Currency = NormalizeCurrency(input.Currency),
                VendorTaxId = TrimToNull(input.VendorTaxId),
                LastFourDigitsCard = NormalizeCard(input.LastFourDigitsCard),
                ItemCount = NormalizePositiveInt(input.ItemCount),
                PaymentPlan = Normalize(input.PaymentPlan),
                LineItems = Normalize(input.LineItems),
                ExtractionConfidence = input.ExtractionConfidence,
                ExtractionMethod = input.ExtractionMethod,
                ExtractionSource = TrimToNull(input.ExtractionSource) ?? "unknown",
                RawText = input.RawText
            };
        }

        private static PaymentPlanInfo? Normalize(PaymentPlanInfo? input)
        {
            if (input == null)
                return null;

            var result = new PaymentPlanInfo
            {
                TotalInstallments = NormalizePositiveInt(input.TotalInstallments),
                InstallmentAmount = NormalizePositiveAmount(input.InstallmentAmount),
                Frequency = TrimToNull(input.Frequency),
                CurrentInstallment = NormalizePositiveInt(input.CurrentInstallment),
                Description = TrimToNull(input.Description)
            };

            return HasPaymentPlanData(result) ? result : null;
        }

        private static List<ExtractedLineItem> Normalize(List<ExtractedLineItem>? items)
        {
            if (items == null || items.Count == 0)
                return new List<ExtractedLineItem>();

            return items
                .Select(item => new ExtractedLineItem
                {
                    Description = TrimToNull(item.Description) ?? string.Empty,
                    Quantity = item.Quantity > 0 ? decimal.Round(item.Quantity, 3) : 1m,
                    UnitPrice = item.UnitPrice >= 0 ? decimal.Round(item.UnitPrice, 2) : 0m,
                    TotalAmount = item.TotalAmount >= 0 ? decimal.Round(item.TotalAmount, 2) : 0m,
                    VatRate = NormalizeVatRate(item.VatRate),
                    Category = TrimToNull(item.Category),
                    AiConfidenceScore = item.AiConfidenceScore
                })
                .Where(item => !string.IsNullOrWhiteSpace(item.Description))
                .ToList();
        }

        private static decimal ScoreLineItems(IReadOnlyCollection<ExtractedLineItem> items)
        {
            if (items.Count == 0)
                return 0m;

            decimal score = 0m;
            foreach (var item in items)
            {
                if (!string.IsNullOrWhiteSpace(item.Description))
                    score += 3m;
                if (item.Quantity > 0)
                    score += 1m;
                if (item.UnitPrice >= 0)
                    score += 1m;
                if (item.TotalAmount >= 0)
                    score += 1m;
                if (!item.VatRate.HasValue || IsValidVatRate(item.VatRate))
                    score += 0.5m;
                if (item.Quantity > 0 && item.UnitPrice > 0 && item.TotalAmount > 0)
                {
                    var expected = decimal.Round(item.Quantity * item.UnitPrice, 2);
                    score += Math.Abs(expected - item.TotalAmount) <= 0.05m ? 2m : -1m;
                }
            }

            return score + items.Count;
        }

        private static bool HasPaymentPlanData(PaymentPlanInfo? plan) =>
            plan != null
            && (plan.TotalInstallments.HasValue
                || plan.InstallmentAmount.HasValue
                || plan.CurrentInstallment.HasValue
                || !string.IsNullOrWhiteSpace(plan.Frequency)
                || !string.IsNullOrWhiteSpace(plan.Description));

        private static string? TrimToNull(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static bool StringEquals(string? left, string? right) =>
            string.Equals(TrimToNull(left), TrimToNull(right), StringComparison.OrdinalIgnoreCase);

        private static string? NormalizeCurrency(string? value)
        {
            value = TrimToNull(value)?.ToUpperInvariant();
            return value switch
            {
                "$" => "USD",
                "₪" => "ILS",
                "NIS" => "ILS",
                "ILS" => "ILS",
                "USD" => "USD",
                "EUR" => "EUR",
                "GBP" => "GBP",
                _ => value
            };
        }

        private static string? NormalizeCard(string? value)
        {
            var digits = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
            return digits.Length == 4 ? digits : null;
        }

        private static DateTime? NormalizeDate(DateTime? value)
        {
            if (!value.HasValue)
                return null;

            var normalized = value.Value.Date;
            return normalized.Year is >= 2000 and <= 2100 ? normalized : null;
        }

        private static decimal? NormalizePositiveAmount(decimal? value) =>
            value.HasValue && value.Value > 0 ? decimal.Round(value.Value, 2) : null;

        private static decimal? NormalizeNonNegativeAmount(decimal? value) =>
            value.HasValue && value.Value >= 0 ? decimal.Round(value.Value, 2) : null;

        private static decimal? NormalizeVatRate(decimal? value) =>
            value.HasValue && value.Value >= 0 && value.Value <= 100 ? decimal.Round(value.Value, 2) : null;

        private static int? NormalizePositiveInt(int? value) =>
            value.HasValue && value.Value > 0 ? value : null;

        private static decimal? RoundDecimal(decimal? value) =>
            value.HasValue ? decimal.Round(value.Value, 2) : null;

        private static bool IsNonEmpty(string? value) => !string.IsNullOrWhiteSpace(value);
        private static bool IsValidCardLast4(string? value) => NormalizeCard(value) != null;
        private static bool IsPositiveAmount(decimal? value) => value.HasValue && value.Value > 0;
        private static bool IsNonNegativeAmount(decimal? value) => value.HasValue && value.Value >= 0;
        private static bool IsValidVatRate(decimal? value) => value.HasValue && value.Value >= 0 && value.Value <= 100;
    }
}
