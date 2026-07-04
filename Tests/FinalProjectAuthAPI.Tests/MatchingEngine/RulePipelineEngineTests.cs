using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class RulePipelineEngineTests
    {
        private readonly RulePipelineEngine _engine = new();

        [Fact]
        public void Execute_EmptyInvoices_ReturnsEmptyResult()
        {
            var result = _engine.Execute(new List<InvoiceRow>(), new List<TransactionRow>());
            Assert.NotNull(result);
            Assert.Empty(result.AutoMatches);
            Assert.Empty(result.SuggestedMatches);
            Assert.Equal(0, result.InvoicesProcessed);
            Assert.Equal(0, result.TransactionsProcessed);
        }

        [Fact]
        public void Execute_EmptyTransactions_ReturnsEmptyResult()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, InvoiceDate = new System.DateTime(2026, 6, 1) }
            };
            var result = _engine.Execute(invoices, new List<TransactionRow>());
            Assert.Empty(result.AutoMatches);
        }

        [Fact]
        public void Execute_FiltersOutMatchedInvoices()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, IsMatched = true, InvoiceDate = new System.DateTime(2026, 6, 1) },
                new() { Id = 2, TotalAmount = 200, IsMatched = false, InvoiceDate = new System.DateTime(2026, 6, 1) }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -200, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Payment" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.Equal(1, result.InvoicesProcessed);
        }

        [Fact]
        public void Execute_FiltersOutDuplicateInvoices()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, IsDuplicate = true, InvoiceDate = new System.DateTime(2026, 6, 1) }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Payment" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.Equal(0, result.InvoicesProcessed);
        }

        [Fact]
        public void Execute_FiltersOutInternalTransferTransactions()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, InvoiceDate = new System.DateTime(2026, 6, 1), VendorName = "Acme" }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Transfer to savings", TransactionType = "debit" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.Equal(0, result.TransactionsProcessed);
        }

        [Fact]
        public void Execute_FiltersOutTransferCategoryTransactions()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, InvoiceDate = new System.DateTime(2026, 6, 1), VendorName = "Acme" }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Some transfer", Category = "Transfer" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.Equal(0, result.TransactionsProcessed);
        }

        [Fact]
        public void Execute_ExactMatch_ReturnsAutoMatch()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, InvoiceDate = new System.DateTime(2026, 6, 1), VendorName = "Acme Corp" }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Payment to Acme Corp", VendorName = "Acme Corp" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.NotEmpty(result.AutoMatches);
        }

        [Fact]
        public void Execute_NoMatch_ReturnsEmptyAutoMatches()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 500, InvoiceDate = new System.DateTime(2026, 6, 1), VendorName = "Acme Corp" }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 15), Description = "Random purchase", VendorName = "Unknown Store" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.Empty(result.AutoMatches);
        }

        [Fact]
        public void Execute_RemainingCounts_AreCorrect()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, InvoiceDate = new System.DateTime(2026, 6, 1), VendorName = "Acme" },
                new() { Id = 2, TotalAmount = 200, InvoiceDate = new System.DateTime(2026, 6, 1), VendorName = "Beta" }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Acme payment", VendorName = "Acme" },
                new() { Id = 2, Amount = -50, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Small payment", VendorName = "Other" }
            };
            var result = _engine.Execute(invoices, transactions);
            Assert.Equal(1, result.InvoicesRemaining);
            Assert.Equal(1, result.TransactionsRemaining);
        }

        [Fact]
        public void ToCreateMatchRequest_InstallmentMatch_SetsInstallmentType()
        {
            var match = new MatchResult
            {
                InvoiceId = 1, TransactionId = 1, MatchedAmount = 100,
                Confidence = 0.8, RuleLayer = "Layer 5", RuleName = "Installment",
                MatchReason = "Installment payment", InstallmentNumber = 1,
                InstallmentNote = "Payment 1 of 3"
            };
            var request = RulePipelineEngine.ToCreateMatchRequest(match, 10);
            Assert.Equal("installment", request.MatchType);
            Assert.Equal(1, request.InstallmentNumber);
            Assert.Equal("Payment 1 of 3", request.InstallmentNote);
        }

        [Fact]
        public void ToCreateMatchRequest_NonInstallmentMatch_SetsFullType()
        {
            var match = new MatchResult
            {
                InvoiceId = 1, TransactionId = 1, MatchedAmount = 100,
                Confidence = 0.9, RuleLayer = "Layer 1", RuleName = "Exact",
                MatchReason = "Exact match"
            };
            var request = RulePipelineEngine.ToCreateMatchRequest(match, 10);
            Assert.Equal("full", request.MatchType);
            Assert.Null(request.InstallmentNumber);
        }
    }
}