using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Rule 4.1: FX Original Currency Ledger Lock
    /// transaction.original_currency == invoice.currency AND
    /// transaction.charge_amount == invoice.total_amount AND fuzzy_score > 0.80.
    /// </summary>
    public class Rule4_1_FxOriginalCurrencyLedgerLock : BaseRule
    {
        public override int Layer => 4;
        public override string Name => "FX Original Currency Ledger Lock (4.1)";
        public override double Confidence => 0.85;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.original_currency must not be null
            if (string.IsNullOrWhiteSpace(transaction.OriginalCurrency))
                return new RuleEvalResult { Matched = false };

            // transaction.original_currency == invoice.currency
            if (!string.Equals(transaction.OriginalCurrency, invoice.Currency, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            // transaction.charge_amount == invoice.total_amount (use charge_amount, not amount)
            if (!transaction.ChargeAmount.HasValue)
                return new RuleEvalResult { Matched = false };

            if (Math.Abs(Math.Abs(transaction.ChargeAmount.Value) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // fuzzy_score > 0.80
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
    /// Rule 4.2: Historical Exchange Rate Estimation Buffer
    /// transaction.original_currency is null AND invoice.currency != transaction.currency AND fuzzy_score > 0.85.
    /// Uses FxRateProvider to convert invoice.total_amount to transaction.currency.
    /// Matched if transaction.amount is within ±3% of the converted value.
    /// </summary>
    public class Rule4_2_HistoricalFxEstimation : BaseRule
    {
        public override int Layer => 4;
        public override string Name => "Historical FX Estimation (4.2)";
        public override double Confidence => 0.75;

        private readonly IFxRateProvider _fxRateProvider;

        public Rule4_2_HistoricalFxEstimation() 
            : this(new MockFxRateProvider()) { }

        public Rule4_2_HistoricalFxEstimation(IFxRateProvider fxRateProvider)
        {
            _fxRateProvider = fxRateProvider;
        }

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.original_currency must be null (no explicit FX info)
            if (!string.IsNullOrWhiteSpace(transaction.OriginalCurrency))
                return new RuleEvalResult { Matched = false };

            // invoice.currency must differ from transaction currency (charge_currency or assumed)
            var txnCurrency = !string.IsNullOrWhiteSpace(transaction.ChargeCurrency)
                ? transaction.ChargeCurrency
                : "USD"; // default assumption

            if (string.Equals(invoice.Currency, txnCurrency, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            // fuzzy_score > 0.85
            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            // Convert invoice.total_amount to transaction currency using rate on transaction date
            var fxRate = _fxRateProvider.GetRate(invoice.Currency, txnCurrency, transaction.TransactionDate);
            if (!fxRate.HasValue || fxRate.Value <= 0)
                return new RuleEvalResult { Matched = false };

            var convertedAmount = invoice.TotalAmount * fxRate.Value;
            var txnAmount = Math.Abs(transaction.Amount);

            // Check if transaction amount is within ±3% of the converted amount
            var lowerBound = convertedAmount * 0.97m;
            var upperBound = convertedAmount * 1.03m;

            if (txnAmount >= lowerBound && txnAmount <= upperBound)
            {
                var variancePct = Math.Abs((txnAmount - convertedAmount) / convertedAmount) * 100;
                return new RuleEvalResult
                {
                    Matched = true,
                    MatchedAmount = txnAmount,
                    MatchReason = $"FX estimation: {invoice.Currency}->{txnCurrency} at rate {fxRate:F4}, converted={convertedAmount:F2}, variance={variancePct:F1}% (within 3% tolerance)"
                };
            }

            return new RuleEvalResult { Matched = false };
        }
    }

    /// <summary>
    /// Interface for FX rate providers (allows mocking in tests).
    /// </summary>
    public interface IFxRateProvider
    {
        /// <summary>
        /// Gets the exchange rate from sourceCurrency to targetCurrency on the given date.
        /// </summary>
        decimal? GetRate(string sourceCurrency, string targetCurrency, DateTime date);
    }
}