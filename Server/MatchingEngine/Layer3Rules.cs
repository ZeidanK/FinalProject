using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Rule 3.1: Subtotal Match (Omitted VAT)
    /// transaction.amount == invoice.subtotal AND invoice.vat_amount > 0 AND fuzzy_score > 0.80.
    /// </summary>
    public class Rule3_1_SubtotalMatch : BaseRule
    {
        public override int Layer => 3;
        public override string Name => "Subtotal Match / Omitted VAT (3.1)";
        public override double Confidence => 0.85;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.amount == invoice.subtotal
            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.Subtotal) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // invoice.vat_amount > 0 (VAT exists, so payment without it makes sense)
            if (!(invoice.VatAmount > 0))
                return new RuleEvalResult { Matched = false };

            // fuzzy_score > 0.80
            if (fuzzyScore <= 0.80)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = $"Amount matches subtotal ({invoice.Subtotal:F2}) with VAT={invoice.VatAmount:F2} omitted, vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule 3.2: Short Pay / Banking Wire Fee Absorption
    /// fuzzy_score > 0.85 AND (total - transaction) fits exactly into standard wire fees: 15, 25, or 35.
    /// </summary>
    public class Rule3_2_ShortPayWireFee : BaseRule
    {
        public override int Layer => 3;
        public override string Name => "Short Pay / Wire Fee (3.2)";
        public override double Confidence => 0.85;

        private static readonly decimal[] WireFeeValues = { 15.00m, 25.00m, 35.00m };

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            var difference = invoice.TotalAmount - Math.Abs(transaction.Amount);

            // Difference must be positive (transaction is less than total) and match a wire fee
            if (difference <= 0)
                return new RuleEvalResult { Matched = false };

            foreach (var fee in WireFeeValues)
            {
                if (Math.Abs(difference - fee) < 0.001m)
                {
                    // Also verify the invoice total is larger than the fee
                    return new RuleEvalResult
                    {
                        Matched = true,
                        MatchedAmount = Math.Abs(transaction.Amount),
                        MatchReason = $"Amount difference of {difference:F2} matches standard wire fee of {fee:F2}, vendor similarity={fuzzyScore:P1}"
                    };
                }
            }

            return new RuleEvalResult { Matched = false };
        }
    }

    /// <summary>
    /// Rule 3.3: Small Variance Tolerance
    /// fuzzy_score > 0.85 AND (abs diff <= 2.00 OR abs diff / total <= 0.01).
    /// </summary>
    public class Rule3_3_SmallVarianceTolerance : BaseRule
    {
        public override int Layer => 3;
        public override string Name => "Small Variance Tolerance (3.3)";
        public override double Confidence => 0.80;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            var absDiff = Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount);

            // Absolute difference <= 2.00
            bool smallAbsDiff = absDiff <= 2.00m;

            // OR relative difference <= 1% of total amount
            bool smallRelDiff = invoice.TotalAmount > 0 &&
                                (absDiff / invoice.TotalAmount) <= 0.01m;

            if (!smallAbsDiff && !smallRelDiff)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = $"Amount variance of {absDiff:F2} ({(absDiff / invoice.TotalAmount):P1}) within tolerance, vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule 3.4: Early Cash Discount ("2/10 Net 30")
    /// fuzzy_score > 0.85 AND days between <= 10 AND amount is 98%, 99%, or 95% of total.
    /// </summary>
    public class Rule3_4_EarlyCashDiscount : BaseRule
    {
        public override int Layer => 3;
        public override string Name => "Early Cash Discount (3.4)";
        public override double Confidence => 0.85;

        private static readonly decimal[] DiscountRates = { 0.98m, 0.99m, 0.95m };

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            // AbsoluteDaysBetween <= 10 (early payment discount window)
            if (AbsoluteDaysBetween(transaction.TransactionDate, invoice.InvoiceDate) > 10)
                return new RuleEvalResult { Matched = false };

            var txnAmount = Math.Abs(transaction.Amount);

            // Check if amount matches any standard discount rate
            foreach (var rate in DiscountRates)
            {
                var expectedAmount = invoice.TotalAmount * rate;
                if (Math.Abs(txnAmount - expectedAmount) < 0.01m)
                {
                    int discountPercent = (int)((1 - rate) * 100);
                    return new RuleEvalResult
                    {
                        Matched = true,
                        MatchedAmount = txnAmount,
                        MatchReason = $"Early payment discount of {discountPercent}% applied (paid within {AbsoluteDaysBetween(transaction.TransactionDate, invoice.InvoiceDate)} days)"
                    };
                }
            }

            return new RuleEvalResult { Matched = false };
        }
    }
}