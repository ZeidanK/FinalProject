using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class Layer3RulesTests
    {
        [Fact]
        public void Rule3_1_SubtotalMatch_Matches()
        {
            var rule = new Rule3_1_SubtotalMatch();
            var invoice = new InvoiceRow { Subtotal = 800, TotalAmount = 880, VatAmount = 80 };
            var txn = new TransactionRow { Amount = 800 };

            var result = rule.Evaluate(invoice, txn, 0.85);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule3_1_SubtotalMatch_Fails_NoVat()
        {
            var rule = new Rule3_1_SubtotalMatch();
            var invoice = new InvoiceRow { Subtotal = 800, VatAmount = 0 };
            var txn = new TransactionRow { Amount = 800 };

            Assert.False(rule.Evaluate(invoice, txn, 0.85).Matched);
        }

        [Fact]
        public void Rule3_2_ShortPayWireFee_MatchesStandardFee()
        {
            var rule = new Rule3_2_ShortPayWireFee();
            var invoice = new InvoiceRow { TotalAmount = 1015 };
            var txn = new TransactionRow { Amount = 1000 };

            var result = rule.Evaluate(invoice, txn, 0.90);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule3_2_ShortPayWireFee_Fails_NonStandardDifference()
        {
            var rule = new Rule3_2_ShortPayWireFee();
            var invoice = new InvoiceRow { TotalAmount = 1050 };
            var txn = new TransactionRow { Amount = 1000 };

            Assert.False(rule.Evaluate(invoice, txn, 0.90).Matched);
        }

        [Fact]
        public void Rule3_3_SmallVarianceTolerance_AcceptsSmallAbsDiff()
        {
            var rule = new Rule3_3_SmallVarianceTolerance();
            var invoice = new InvoiceRow { TotalAmount = 500 };
            var txn = new TransactionRow { Amount = 498.50m };

            var result = rule.Evaluate(invoice, txn, 0.90);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule3_3_SmallVarianceTolerance_Fails_LargeDiff()
        {
            var rule = new Rule3_3_SmallVarianceTolerance();
            var invoice = new InvoiceRow { TotalAmount = 500 };
            var txn = new TransactionRow { Amount = 400 };

            Assert.False(rule.Evaluate(invoice, txn, 0.90).Matched);
        }

        [Fact]
        public void Rule3_4_EarlyCashDiscount_MatchesTwoPercent()
        {
            var rule = new Rule3_4_EarlyCashDiscount();
            var invoice = new InvoiceRow { TotalAmount = 1000, InvoiceDate = new DateTime(2025, 6, 1) };
            var txn = new TransactionRow { Amount = 980, TransactionDate = new DateTime(2025, 6, 5) };

            var result = rule.Evaluate(invoice, txn, 0.90);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule3_4_EarlyCashDiscount_Fails_OutsideWindow()
        {
            var rule = new Rule3_4_EarlyCashDiscount();
            var invoice = new InvoiceRow { TotalAmount = 1000, InvoiceDate = new DateTime(2025, 1, 1) };
            var txn = new TransactionRow { Amount = 980, TransactionDate = new DateTime(2025, 6, 1) };

            Assert.False(rule.Evaluate(invoice, txn, 0.90).Matched);
        }
    }
}
