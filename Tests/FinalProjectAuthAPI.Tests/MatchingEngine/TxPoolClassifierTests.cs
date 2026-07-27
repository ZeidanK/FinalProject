using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class TxPoolClassifierTests
    {
        // ── IsPaymentPlanInvoice ──────────────────────────────────────────────

        [Fact]
        public void IsPaymentPlanInvoice_NullInvoice_ReturnsFalse()
        {
            Assert.False(TxPoolClassifier.IsPaymentPlanInvoice(null!));
        }

        [Fact]
        public void IsPaymentPlanInvoice_NoPaymentPlanFields_ReturnsFalse()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                TotalAmount = 1000m,
                InvoiceDate = new System.DateTime(2026, 6, 1)
            };
            Assert.False(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        [Fact]
        public void IsPaymentPlanInvoice_HasTotalInstallments_ReturnsTrue()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanTotalInstallments = 3
            };
            Assert.True(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        [Fact]
        public void IsPaymentPlanInvoice_SingleInstallment_ReturnsFalse()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanTotalInstallments = 1
            };
            Assert.False(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        [Fact]
        public void IsPaymentPlanInvoice_HasInstallmentAmountOnly_ReturnsFalse()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanInstallmentAmount = 333.33m
            };
            Assert.False(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        [Fact]
        public void IsPaymentPlanInvoice_HasPaymentPlanDescriptionOnly_ReturnsFalse()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanDescription = "Monthly payment"
            };
            Assert.False(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        [Fact]
        public void IsPaymentPlanInvoice_HasInstallmentsAndAmount_ReturnsTrue()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanTotalInstallments = 3,
                PaymentPlanInstallmentAmount = 333.33m
            };
            Assert.True(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        [Fact]
        public void IsPaymentPlanInvoice_WhitespaceDescription_ReturnsFalse()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanDescription = "  "
            };
            Assert.False(TxPoolClassifier.IsPaymentPlanInvoice(invoice));
        }

        // ── IsInstallmentTxn ──────────────────────────────────────────────────

        [Fact]
        public void IsInstallmentTxn_NullTxn_ReturnsFalse()
        {
            Assert.False(TxPoolClassifier.IsInstallmentTxn((TransactionRow)null!));
        }

        [Fact]
        public void IsInstallmentTxn_InstallmentTypeHebrew_ReturnsTrue()
        {
            var txn = new TransactionRow
            {
                Id = 1,
                TransactionType = "תשלומים"
            };
            Assert.True(TxPoolClassifier.IsInstallmentTxn(txn));
        }

        [Fact]
        public void IsInstallmentTxn_InstallmentTypeLegacyMojibake_ReturnsTrue()
        {
            var txn = new TransactionRow
            {
                Id = 1,
                TransactionType = "×ª×©×œ×•×ž×™×"
            };
            Assert.True(TxPoolClassifier.IsInstallmentTxn(txn));
        }

        [Fact]
        public void IsInstallmentTxn_InstallmentTypeCaseInsensitive_ReturnsTrue()
        {
            var txn = new TransactionRow
            {
                Id = 1,
                TransactionType = "תשלומים"
            };
            Assert.True(TxPoolClassifier.IsInstallmentTxn(txn));
        }

        [Fact]
        public void IsInstallmentTxn_NonInstallmentType_ReturnsFalse()
        {
            var txn = new TransactionRow
            {
                Id = 1,
                TransactionType = "debit"
            };
            Assert.False(TxPoolClassifier.IsInstallmentTxn(txn));
        }

        [Fact]
        public void IsInstallmentTxn_NullType_ReturnsFalse()
        {
            var txn = new TransactionRow
            {
                Id = 1,
                TransactionType = null!
            };
            Assert.False(TxPoolClassifier.IsInstallmentTxn(txn));
        }

        // ── FilterTxnsForInvoice ──────────────────────────────────────────────

        [Fact]
        public void FilterTxnsForInvoice_NullCandidateList_ReturnsEmpty()
        {
            var invoice = new InvoiceRow { Id = 1 };
            var result = TxPoolClassifier.FilterTxnsForInvoice(invoice, null!);
            Assert.Empty(result);
        }

        [Fact]
        public void FilterTxnsForInvoice_EmptyCandidateList_ReturnsEmpty()
        {
            var invoice = new InvoiceRow { Id = 1 };
            var result = TxPoolClassifier.FilterTxnsForInvoice(invoice, new List<TransactionRow>());
            Assert.Empty(result);
        }

        [Fact]
        public void FilterTxnsForInvoice_NormalInvoice_ExcludesInstallmentTxns()
        {
            var invoice = new InvoiceRow { Id = 1 };
            var txns = new List<TransactionRow>
            {
                new() { Id = 1, TransactionType = "debit" },
                new() { Id = 2, TransactionType = "תשלומים" },
                new() { Id = 3, TransactionType = "credit" }
            };

            var result = TxPoolClassifier.FilterTxnsForInvoice(invoice, txns);

            Assert.Equal(2, result.Count);
            Assert.Contains(result, t => t.Id == 1);
            Assert.Contains(result, t => t.Id == 3);
        }

        [Fact]
        public void FilterTxnsForInvoice_InstallmentInvoice_IncludesOnlyInstallmentTxns()
        {
            var invoice = new InvoiceRow
            {
                Id = 1,
                PaymentPlanTotalInstallments = 3
            };
            var txns = new List<TransactionRow>
            {
                new() { Id = 1, TransactionType = "debit" },
                new() { Id = 2, TransactionType = "תשלומים" },
                new() { Id = 3, TransactionType = "credit" }
            };

            var result = TxPoolClassifier.FilterTxnsForInvoice(invoice, txns);

            Assert.Single(result);
            Assert.Equal(2, result[0].Id);
        }
    }
}
