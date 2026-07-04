using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class Layer2RulesTests
    {
        [Fact]
        public void Rule2_1_StandardPostDatedWindow_Matches()
        {
            var rule = new Rule2_1_StandardPostDatedWindow();
            var invoice = new InvoiceRow { TotalAmount = 1000, VendorName = "Acme Corp", InvoiceDate = new DateTime(2025, 6, 1), DueDate = new DateTime(2025, 6, 30) };
            var txn = new TransactionRow { Amount = 1000, VendorName = "Acme Corp", TransactionDate = new DateTime(2025, 6, 15) };

            var result = rule.Evaluate(invoice, txn, 0.90);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule2_1_StandardPostDatedWindow_Fails_LowFuzzyScore()
        {
            var rule = new Rule2_1_StandardPostDatedWindow();
            var invoice = new InvoiceRow { TotalAmount = 1000, InvoiceDate = new DateTime(2025, 6, 1) };
            var txn = new TransactionRow { Amount = 1000, TransactionDate = new DateTime(2025, 6, 15) };

            Assert.False(rule.Evaluate(invoice, txn, 0.50).Matched);
        }

        [Fact]
        public void Rule2_1_StandardPostDatedWindow_Fails_OutsideWindow()
        {
            var rule = new Rule2_1_StandardPostDatedWindow();
            var invoice = new InvoiceRow { TotalAmount = 1000, InvoiceDate = new DateTime(2025, 1, 1), DueDate = new DateTime(2025, 1, 31) };
            var txn = new TransactionRow { Amount = 1000, TransactionDate = new DateTime(2025, 6, 1) };

            Assert.False(rule.Evaluate(invoice, txn, 0.90).Matched);
        }

        [Fact]
        public void Rule2_2_RetroactivePrePaidWindow_Matches()
        {
            var rule = new Rule2_2_RetroactivePrePaidWindow();
            var invoice = new InvoiceRow { TotalAmount = 500, InvoiceDate = new DateTime(2025, 7, 1) };
            var txn = new TransactionRow { Amount = 500, TransactionDate = new DateTime(2025, 6, 20) };

            var result = rule.Evaluate(invoice, txn, 0.95);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule2_2_RetroactivePrePaidWindow_Fails_TooFarInPast()
        {
            var rule = new Rule2_2_RetroactivePrePaidWindow();
            var invoice = new InvoiceRow { TotalAmount = 500, InvoiceDate = new DateTime(2025, 7, 1) };
            var txn = new TransactionRow { Amount = 500, TransactionDate = new DateTime(2025, 1, 1) };

            Assert.False(rule.Evaluate(invoice, txn, 0.95).Matched);
        }

        [Fact]
        public void Rule2_3_FuzzyNameContainment_DescriptionContainsVendor()
        {
            var rule = new Rule2_3_FuzzyNameContainment();
            var invoice = new InvoiceRow { TotalAmount = 300, VendorName = "Amazon" };
            var txn = new TransactionRow { Amount = 300, Description = "Payment to Amazon Web Services" };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule2_3_FuzzyNameContainment_Fails_NoContainment()
        {
            var rule = new Rule2_3_FuzzyNameContainment();
            var invoice = new InvoiceRow { TotalAmount = 300, VendorName = "Amazon" };
            var txn = new TransactionRow { Amount = 300, Description = "Random expense" };

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }
    }
}
