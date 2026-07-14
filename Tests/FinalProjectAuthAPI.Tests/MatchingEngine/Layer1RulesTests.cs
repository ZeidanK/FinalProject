using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class Layer1RulesTests
    {
        [Fact]
        public void Rule1_1_ExactMetadataToken_FindsInvoiceNumberInReference()
        {
            var rule = new Rule1_1_ExactMetadataToken();
            var invoice = new InvoiceRow { InvoiceNumber = "INV-001", TotalAmount = 100 };
            var txn = new TransactionRow { ReferenceNumber = "REF-INV-001-XYZ", Amount = -100 };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.True(result.Matched);
            Assert.Equal(100, result.MatchedAmount);
        }

        [Fact]
        public void Rule1_1_ExactMetadataToken_FindsInvoiceNumberInDescription()
        {
            var rule = new Rule1_1_ExactMetadataToken();
            var invoice = new InvoiceRow { InvoiceNumber = "INV-001", TotalAmount = 100 };
            var txn = new TransactionRow { Description = "Payment for INV-001", Amount = -100 };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule1_1_ExactMetadataToken_NoMatch_WhenInvoiceNumberTooShort()
        {
            var rule = new Rule1_1_ExactMetadataToken();
            var invoice = new InvoiceRow { InvoiceNumber = "AB" };
            var txn = new TransactionRow { ReferenceNumber = "AB" };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.False(result.Matched);
        }

        [Fact]
        public void Rule1_1_ExactMetadataToken_NoMatch_WhenNotFound()
        {
            var rule = new Rule1_1_ExactMetadataToken();
            var invoice = new InvoiceRow { InvoiceNumber = "INV-001" };
            var txn = new TransactionRow { Description = "Something else" };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.False(result.Matched);
        }

        [Fact]
        public void Rule1_2_TrinityMatch_MatchesExactly()
        {
            var rule = new Rule1_2_TrinityMatch();
            var date = new DateTime(2025, 6, 15);
            var invoice = new InvoiceRow { TotalAmount = 500, VendorName = "Acme Corp", InvoiceDate = date };
            var txn = new TransactionRow { Amount = 500, VendorName = "Acme Corp", TransactionDate = date };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule1_2_TrinityMatch_SkipsInstallmentTransactions()
        {
            var rule = new Rule1_2_TrinityMatch();
            var date = new DateTime(2025, 8, 25);
            var invoice = new InvoiceRow { TotalAmount = 2100, VendorName = "TravelGo Tickets", InvoiceDate = date };
            var txn = new TransactionRow
            {
                Amount = 2100,
                ChargeAmount = 525,
                VendorName = "TravelGo Tickets",
                TransactionDate = date,
                TransactionType = "\u05ea\u05e9\u05dc\u05d5\u05de\u05d9\u05dd"
            };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.False(result.Matched);
        }

        [Fact]
        public void Rule1_2_TrinityMatch_Fails_DifferentAmount()
        {
            var rule = new Rule1_2_TrinityMatch();
            var date = new DateTime(2025, 6, 15);
            var invoice = new InvoiceRow { TotalAmount = 500, VendorName = "Acme Corp", InvoiceDate = date };
            var txn = new TransactionRow { Amount = 600, VendorName = "Acme Corp", TransactionDate = date };

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }

        [Fact]
        public void Rule1_2_TrinityMatch_Fails_DifferentDate()
        {
            var rule = new Rule1_2_TrinityMatch();
            var invoice = new InvoiceRow { TotalAmount = 500, VendorName = "Acme Corp", InvoiceDate = new DateTime(2025, 6, 15) };
            var txn = new TransactionRow { Amount = 500, VendorName = "Acme Corp", TransactionDate = new DateTime(2025, 7, 1) };

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }

        [Fact]
        public void Rule1_3_TokenizedCardMatch_MatchesExactly()
        {
            var rule = new Rule1_3_TokenizedCardMatch();
            var invoice = new InvoiceRow { TotalAmount = 200, LastFourDigitsCard = "1234", InvoiceDate = new DateTime(2025, 6, 15) };
            var txn = new TransactionRow { Amount = 200, CardLast4 = "1234", TransactionDate = new DateTime(2025, 6, 16) };

            var result = rule.Evaluate(invoice, txn, 0);

            Assert.True(result.Matched);
        }

        [Fact]
        public void Rule1_3_TokenizedCardMatch_Fails_NoCardOnTxn()
        {
            var rule = new Rule1_3_TokenizedCardMatch();
            var invoice = new InvoiceRow { TotalAmount = 200, LastFourDigitsCard = "1234" };
            var txn = new TransactionRow { Amount = 200, CardLast4 = "" };

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }

        [Fact]
        public void Rule1_3_TokenizedCardMatch_Fails_DateWindowExceeded()
        {
            var rule = new Rule1_3_TokenizedCardMatch();
            var invoice = new InvoiceRow { TotalAmount = 200, LastFourDigitsCard = "1234", InvoiceDate = new DateTime(2025, 6, 1) };
            var txn = new TransactionRow { Amount = 200, CardLast4 = "1234", TransactionDate = new DateTime(2025, 7, 1) };

            Assert.False(rule.Evaluate(invoice, txn, 0).Matched);
        }
    }
}
