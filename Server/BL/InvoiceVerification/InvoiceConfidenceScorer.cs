using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.InvoiceVerification
{
    public static class InvoiceConfidenceScorer
    {
        private const int FullConfidenceFieldCount = 9;

        public static decimal? CalculateFullConfidence(PdfExtractionResult? extracted)
        {
            if (extracted == null)
                return null;

            var confidence = Clamp(extracted.ExtractionConfidence);
            var total = 0m;

            total += HasValue(extracted.VendorName) ? confidence : 0m;
            total += HasValue(extracted.InvoiceNumber) ? confidence : 0m;
            total += extracted.InvoiceDate.HasValue ? confidence : 0m;
            total += extracted.TotalAmount.HasValue ? confidence : 0m;
            total += extracted.Subtotal.HasValue ? confidence : 0m;
            total += extracted.VatAmount.HasValue ? confidence : 0m;
            total += HasValue(extracted.Currency) ? confidence : 0m;
            total += HasValue(extracted.VendorTaxId) ? confidence : 0m;
            total += HasValue(extracted.LastFourDigitsCard) ? confidence : 0m;

            return Math.Round(total / FullConfidenceFieldCount, 4);
        }

        private static bool HasValue(string? value) =>
            !string.IsNullOrWhiteSpace(value);

        private static decimal Clamp(decimal value)
        {
            if (value < 0m)
                return 0m;
            if (value > 1m)
                return 1m;
            return value;
        }
    }
}
