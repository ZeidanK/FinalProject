namespace FinalProjectAuthAPI.MatchingEngine
{
    public interface IFxRateProvider
    {
        decimal? GetRate(string sourceCurrency, string targetCurrency, DateTime date);
    }

    /// <summary>
    /// Mock FX rate provider that returns realistic exchange rates for common currency pairs.
    /// In production, this would call an external FX API (e.g., OpenExchangeRates, XE, etc.).
    /// </summary>
    public class MockFxRateProvider : IFxRateProvider
    {
        // Average reference rates (mock data - in production these come from an API)
        private static readonly Dictionary<string, decimal> RatesToUsd = new(StringComparer.OrdinalIgnoreCase)
        {
            ["USD"] = 1.0000m,
            ["EUR"] = 1.0800m,
            ["GBP"] = 1.2600m,
            ["ILS"] = 0.2700m,
            ["JPY"] = 0.0067m,
            ["CAD"] = 0.7300m,
            ["AUD"] = 0.6500m,
            ["CHF"] = 1.1000m,
            ["CNY"] = 0.1400m,
            ["INR"] = 0.0120m,
        };

        /// <summary>
        /// Gets a mock exchange rate from sourceCurrency to targetCurrency.
        /// The date parameter is accepted for API compatibility but this mock
        /// returns a static average rate regardless of date.
        /// </summary>
        public decimal? GetRate(string sourceCurrency, string targetCurrency, DateTime date)
        {
            if (string.IsNullOrWhiteSpace(sourceCurrency) || string.IsNullOrWhiteSpace(targetCurrency))
                return null;

            // If same currency, rate is 1
            if (string.Equals(sourceCurrency, targetCurrency, StringComparison.OrdinalIgnoreCase))
                return 1.0m;

            // Get rates to USD as base
            if (!RatesToUsd.TryGetValue(sourceCurrency, out var sourceToUsd))
                return null;
            if (!RatesToUsd.TryGetValue(targetCurrency, out var targetToUsd))
                return null;

            // Convert: source -> USD -> target
            var usdToSource = 1.0m / sourceToUsd;
            var rate = usdToSource * targetToUsd;

            // Round to 4 decimal places
            return Math.Round(rate, 4);
        }
    }
}