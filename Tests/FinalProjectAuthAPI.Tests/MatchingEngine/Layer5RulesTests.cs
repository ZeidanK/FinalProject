using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class Layer5RulesTests
    {
        [Fact]
        public void TransactionAmountHelper_GetEffectiveAmount_UsesChargeAmount()
        {
            var txn = new TransactionRow { Amount = -2555, ChargeAmount = 255 };
            Assert.Equal(255, TransactionAmountHelper.GetEffectiveAmount(txn));
        }

        [Fact]
        public void TransactionAmountHelper_GetEffectiveAmount_FallsBackToAmount()
        {
            var txn = new TransactionRow { Amount = -500, ChargeAmount = null };
            Assert.Equal(500, TransactionAmountHelper.GetEffectiveAmount(txn));
        }

        [Fact]
        public void Rule5_2_InstallmentPlan_MatchesInstallmentAmount()
        {
            var rule = new Rule5_2_InstallmentPlan();
            var invoice = new InvoiceRow
            {
                PaymentPlanInstallmentAmount = 250,
                TotalAmount = 3000
            };
            var txn = new TransactionRow
            {
                Amount = -255,
                ChargeAmount = 250,
                TransactionType = "installment"
            };

            var result = rule.Evaluate(invoice, txn, 0.60);

            Assert.True(result.Matched);
            Assert.Equal(250, result.MatchedAmount);
        }

        [Fact]
        public void Rule5_2_InstallmentPlan_Fails_NoInstallmentPlan()
        {
            var rule = new Rule5_2_InstallmentPlan();
            var invoice = new InvoiceRow { PaymentPlanInstallmentAmount = null };
            var txn = new TransactionRow { Amount = -250 };

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }

        [Fact]
        public void Rule5_1_BatchInvoicePayment_Evaluate_ReturnsFalse()
        {
            var rule = new Rule5_1_BatchInvoicePayment();
            var invoice = new InvoiceRow();
            var txn = new TransactionRow();

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }

        [Fact]
        public void Rule5_1_FindBatchMatch_ReturnsNull_ForLowFuzzyScore()
        {
            var txn = new TransactionRow { Amount = 500 };
            var invoices = new List<InvoiceRow> { new() { TotalAmount = 500, InvoiceDate = new DateTime(2025, 6, 1) } };

            Assert.Null(Rule5_1_BatchInvoicePayment.FindBatchMatch(txn, invoices, 0.50));
        }

        [Fact]
        public void Rule5_1_FindBatchMatch_ReturnsNull_ForNoEligibleInvoices()
        {
            var txn = new TransactionRow { Amount = 500, TransactionDate = new DateTime(2025, 1, 1) };
            var invoices = new List<InvoiceRow> { new() { TotalAmount = 500, InvoiceDate = new DateTime(2025, 6, 1) } };

            Assert.Null(Rule5_1_BatchInvoicePayment.FindBatchMatch(txn, invoices, 0.90));
        }

        [Fact]
        public void FindInstallmentAccumulation_ReturnsNull_ForFewerThanTwoTransactions()
        {
            var invoice = new InvoiceRow { TotalAmount = 1000 };
            var txns = new List<TransactionRow> { new() { Amount = 500 } };

            Assert.Null(Rule5_2_InstallmentPlan.FindInstallmentAccumulation(invoice, txns, 0.90));
        }

        [Fact]
        public void FindInstallmentAccumulation_FindsExactSum()
        {
            var invoice = new InvoiceRow { TotalAmount = 1000 };
            var txns = new List<TransactionRow>
            {
                new() { Amount = -300, TransactionDate = new DateTime(2025, 1, 1) },
                new() { Amount = -300, TransactionDate = new DateTime(2025, 2, 1) },
                new() { Amount = -400, TransactionDate = new DateTime(2025, 3, 1) },
            };

            var result = Rule5_2_InstallmentPlan.FindInstallmentAccumulation(invoice, txns, 0.90);

            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
        }
    }
}
