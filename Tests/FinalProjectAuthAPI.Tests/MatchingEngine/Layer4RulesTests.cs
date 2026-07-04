using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class Layer4RulesTests
    {
        [Fact]
        public void Rule4_1_FxOriginalCurrencyLedgerLock_Matches()
        {
            var rule = new Rule4_1_FxOriginalCurrencyLedgerLock();
            var invoice = new InvoiceRow { TotalAmount = 1000, Currency = "EUR" };
            var txn = new TransactionRow { OriginalCurrency = "EUR", ChargeAmount = 1000, Amount = 1080 };

            var result = rule.Evaluate(invoice, txn, 0.85);

            Assert.True(result.Matched);
            Assert.Equal(1000, result.MatchedAmount);
        }

        [Fact]
        public void Rule4_1_FxOriginalCurrencyLedgerLock_Fails_CurrencyMismatch()
        {
            var rule = new Rule4_1_FxOriginalCurrencyLedgerLock();
            var invoice = new InvoiceRow { TotalAmount = 1000, Currency = "EUR" };
            var txn = new TransactionRow { OriginalCurrency = "GBP", ChargeAmount = 1000 };

            Assert.False(rule.Evaluate(invoice, txn, 0.85).Matched);
        }

        [Fact]
        public void Rule4_2_HistoricalFxEstimation_Matches()
        {
            var rule = new Rule4_2_HistoricalFxEstimation();
            var invoice = new InvoiceRow { TotalAmount = 1000, Currency = "EUR" };
            var txn = new TransactionRow { Amount = -926, OriginalCurrency = null, ChargeCurrency = "USD", TransactionDate = new DateTime(2025, 6, 15) };

            var result = rule.Evaluate(invoice, txn, 0.90);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule4_2_HistoricalFxEstimation_Fails_SameCurrency()
        {
            var rule = new Rule4_2_HistoricalFxEstimation();
            var invoice = new InvoiceRow { TotalAmount = 1000, Currency = "USD" };
            var txn = new TransactionRow { Amount = -1000, OriginalCurrency = null, ChargeCurrency = "USD" };

            Assert.False(rule.Evaluate(invoice, txn, 0.90).Matched);
        }

        [Fact]
        public void Rule4_2_HistoricalFxEstimation_Fails_OriginalCurrencyPresent()
        {
            var rule = new Rule4_2_HistoricalFxEstimation();
            var invoice = new InvoiceRow { TotalAmount = 1000, Currency = "EUR" };
            var txn = new TransactionRow { Amount = -1080, OriginalCurrency = "EUR", ChargeCurrency = "USD" };

            Assert.False(rule.Evaluate(invoice, txn, 0.90).Matched);
        }
    }
}
