using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Rule F1: Post-dated or retroactive window match.
    /// Amount matches invoice total, transaction date within reasonable window,
    /// vendor fuzzy score > threshold.
    /// </summary>
    public class RuleF1_TemporalWindowMatch : BaseRule
    {
        public override int Layer => 2;
        public override string Name => "Temporal Window Match (F1)";
        public override double Confidence => 0.90;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
            if (Math.Abs(effectiveAmount - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // Post-dated: txn date between invoice_date and due_date + 14
            var postWindowEnd = invoice.DueDate?.AddDays(14) ?? invoice.InvoiceDate.AddDays(14);
            bool inPostWindow = transaction.TransactionDate.Date >= invoice.InvoiceDate.Date &&
                                transaction.TransactionDate.Date <= postWindowEnd.Date;

            // Retroactive: txn up to 31 days before invoice
            var daysBefore = (invoice.InvoiceDate.Date - transaction.TransactionDate.Date).Days;
            bool inPreWindow = daysBefore >= 0 && daysBefore <= 31;

            if (!inPostWindow && !inPreWindow)
                return new RuleEvalResult { Matched = false };

            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = effectiveAmount,
                MatchReason = $"Amount match with temporal window (txn {daysBefore}d {(inPreWindow ? "before" : "after")} invoice), vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule F2: Subtotal match (VAT omitted) — transaction matches invoice subtotal when VAT > 0.
    /// </summary>
    public class RuleF2_SubtotalMatch : BaseRule
    {
        public override int Layer => 3;
        public override string Name => "Subtotal Match / Omitted VAT (F2)";
        public override double Confidence => 0.85;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
            if (Math.Abs(effectiveAmount - invoice.Subtotal) > 0.001m)
                return new RuleEvalResult { Matched = false };

            if (!(invoice.VatAmount > 0))
                return new RuleEvalResult { Matched = false };

            if (fuzzyScore <= 0.80)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = effectiveAmount,
                MatchReason = $"Amount matches subtotal ({invoice.Subtotal:F2}) with VAT={invoice.VatAmount:F2} omitted, vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule F3: Small variance tolerance — amount within $2 or 1% with vendor fuzzy match.
    /// </summary>
    public class RuleF3_SmallVarianceTolerance : BaseRule
    {
        public override int Layer => 3;
        public override string Name => "Small Variance Tolerance (F3)";
        public override double Confidence => 0.80;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
            var absDiff = Math.Abs(effectiveAmount - invoice.TotalAmount);

            bool smallAbsDiff = absDiff <= 2.00m;
            bool smallRelDiff = invoice.TotalAmount > 0 && (absDiff / invoice.TotalAmount) <= 0.01m;

            if (!smallAbsDiff && !smallRelDiff)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = effectiveAmount,
                MatchReason = $"Amount variance of {absDiff:F2} ({(absDiff / invoice.TotalAmount):P1}) within tolerance, vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule F4: FX original currency match — transaction original_currency matches invoice currency
    /// and charge_amount matches invoice total.
    /// </summary>
    public class RuleF4_FxOriginalCurrencyMatch : BaseRule
    {
        public override int Layer => 4;
        public override string Name => "FX Original Currency Match (F4)";
        public override double Confidence => 0.85;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (string.IsNullOrWhiteSpace(transaction.OriginalCurrency))
                return new RuleEvalResult { Matched = false };

            if (!string.Equals(transaction.OriginalCurrency, invoice.Currency, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            if (!transaction.ChargeAmount.HasValue)
                return new RuleEvalResult { Matched = false };

            if (Math.Abs(Math.Abs(transaction.ChargeAmount.Value) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            if (fuzzyScore <= 0.80)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.ChargeAmount.Value),
                MatchReason = $"FX match: original currency '{transaction.OriginalCurrency}' matches invoice currency, charge_amount matches total"
            };
        }
    }

    /// <summary>
    /// Rule F5: FX estimation — invoice currency differs from txn currency, converted +-3% tolerance.
    /// </summary>
    public class RuleF5_FxEstimation : BaseRule
    {
        public override int Layer => 4;
        public override string Name => "FX Estimation (F5)";
        public override double Confidence => 0.75;

        private readonly IFxRateProvider _fxRateProvider;

        public RuleF5_FxEstimation() : this(new MockFxRateProvider()) { }

        public RuleF5_FxEstimation(IFxRateProvider fxRateProvider)
        {
            _fxRateProvider = fxRateProvider;
        }

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (!string.IsNullOrWhiteSpace(transaction.OriginalCurrency))
                return new RuleEvalResult { Matched = false };

            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            var txnCurrency = !string.IsNullOrWhiteSpace(transaction.ChargeCurrency)
                ? transaction.ChargeCurrency
                : "USD";

            if (string.Equals(invoice.Currency, txnCurrency, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            var fxRate = _fxRateProvider.GetRate(invoice.Currency, txnCurrency, transaction.TransactionDate);
            if (!fxRate.HasValue || fxRate.Value <= 0)
                return new RuleEvalResult { Matched = false };

            var convertedAmount = invoice.TotalAmount * fxRate.Value;
            var txnAmount = Math.Abs(transaction.Amount);
            var lowerBound = convertedAmount * 0.97m;
            var upperBound = convertedAmount * 1.03m;

            if (txnAmount >= lowerBound && txnAmount <= upperBound)
            {
                var variancePct = Math.Abs((txnAmount - convertedAmount) / convertedAmount) * 100;
                return new RuleEvalResult
                {
                    Matched = true,
                    MatchedAmount = txnAmount,
                    MatchReason = $"FX estimation: {invoice.Currency}->{txnCurrency} at rate {fxRate:F4}, converted={convertedAmount:F2}, variance={variancePct:F1}%"
                };
            }

            return new RuleEvalResult { Matched = false };
        }
    }
}
