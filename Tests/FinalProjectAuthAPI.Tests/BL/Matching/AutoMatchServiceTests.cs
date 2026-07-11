using FinalProjectAuthAPI.BL.Matching;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.Matching
{
    public class AutoMatchServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IRulePipelineEngine> _mockPipeline;
        private readonly Mock<MatchCrudService> _mockCrud;
        private readonly Mock<MatchSuggestionService> _mockSuggestions;
        private readonly AutoMatchService _service;

        public AutoMatchServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _mockPipeline = new Mock<IRulePipelineEngine>();
            _mockCrud = new Mock<MatchCrudService>(_mockDb.Object);
            _mockSuggestions = new Mock<MatchSuggestionService>(_mockDb.Object, _mockPipeline.Object);
            _service = new AutoMatchService(_mockDb.Object, _mockPipeline.Object, _mockCrud.Object, _mockSuggestions.Object);
        }

        [Fact]
        public async Task AutoMatchAsync_InvoiceNotFound_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetInvoiceById(99)).Returns((InvoiceRow?)null);
            var (success, matchId, message, score) = await _service.AutoMatchAsync(99, 10);
            Assert.False(success);
            Assert.Contains("not found", message);
        }

        [Fact]
        public async Task AutoMatchAsync_NoSuggestions_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(new InvoiceRow { Id = 1 });
            _mockSuggestions.Setup(x => x.GetSuggestionsAsync(1)).ReturnsAsync(new List<MatchSuggestionRow>());
            var (success, matchId, message, score) = await _service.AutoMatchAsync(1, 10);
            Assert.False(success);
            Assert.Contains("No potential matches", message);
        }

        [Fact]
        public async Task AutoMatchAsync_BelowThreshold_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(new InvoiceRow { Id = 1, TotalAmount = 100 });
            _mockSuggestions.Setup(x => x.GetSuggestionsAsync(1)).ReturnsAsync(new List<MatchSuggestionRow>
            {
                new() { Id = 1, Amount = 100, MatchScore = 60 }
            });
            var (success, matchId, message, score) = await _service.AutoMatchAsync(1, 10, 70m);
            Assert.False(success);
            Assert.Contains("below threshold", message);
            Assert.Equal(60, score);
        }

        [Fact]
        public async Task AutoMatchAsync_Success_ReturnsMatch()
        {
            var invoice = new InvoiceRow { Id = 1, TotalAmount = 100, MatchedAmount = 0 };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockSuggestions.Setup(x => x.GetSuggestionsAsync(1)).ReturnsAsync(new List<MatchSuggestionRow>
            {
                new() { Id = 5, Amount = 100, MatchScore = 85, MatchReasons = new List<string> { "Exact match" } }
            });
            _mockDb.Setup(x => x.GetMatchesByInvoice(1)).Returns(new List<MatchRow>());
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateMatchRequest>(), 10)).Returns((true, 42L, ""));

            var (success, matchId, message, score) = await _service.AutoMatchAsync(1, 10);
            Assert.True(success);
            Assert.Equal(42, matchId);
            Assert.Equal(85, score);
        }

        [Fact]
        public async Task AutoMatchAsync_InstallmentInvoice_SetsInstallmentNumber()
        {
            var invoice = new InvoiceRow
            {
                Id = 1, TotalAmount = 300, MatchedAmount = 0,
                PaymentPlanTotalInstallments = 3
            };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockSuggestions.Setup(x => x.GetSuggestionsAsync(1)).ReturnsAsync(new List<MatchSuggestionRow>
            {
                new() { Id = 5, Amount = 100, MatchScore = 85, MatchReasons = new List<string> { "Installment" } }
            });
            _mockDb.Setup(x => x.GetMatchesByInvoice(1)).Returns(new List<MatchRow>());
            _mockCrud.Setup(x => x.Create(It.Is<CreateMatchRequest>(r => r.InstallmentNumber == 1), 10))
                .Returns((true, 42L, ""));

            var (success, matchId, message, score) = await _service.AutoMatchAsync(1, 10);
            Assert.True(success);
            Assert.Contains("installment 1/3", message);
        }

        [Fact]
        public async Task AutoMatchAsync_CreateFails_ReturnsError()
        {
            var invoice = new InvoiceRow { Id = 1, TotalAmount = 100, MatchedAmount = 0 };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockSuggestions.Setup(x => x.GetSuggestionsAsync(1)).ReturnsAsync(new List<MatchSuggestionRow>
            {
                new() { Id = 5, Amount = 100, MatchScore = 85, MatchReasons = new List<string> { "Exact" } }
            });
            _mockDb.Setup(x => x.GetMatchesByInvoice(1)).Returns(new List<MatchRow>());
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateMatchRequest>(), 10)).Returns((false, 0L, "DB error"));

            var (success, matchId, message, score) = await _service.AutoMatchAsync(1, 10);
            Assert.False(success);
            Assert.Equal("DB error", message);
        }

        [Fact]
        public async Task AutoMatchBatchAsync_NoInvoices_ReturnsEmpty()
        {
            _mockDb.Setup(x => x.GetUnmatchedInvoicesByCompany(5)).Returns(new List<InvoiceRow>());
            _mockDb.Setup(x => x.GetTransactionsByCompany(It.IsAny<long>(), It.IsAny<TransactionFilterRequest>()))
                .Returns(new PagedResponse<TransactionRow>());
            var result = await _service.AutoMatchBatchAsync(5, 10);
            Assert.Equal(0, result.SuccessfulMatches);
        }

        [Fact]
        public async Task AutoMatchBatchAsync_NoTransactions_ReturnsEmpty()
        {
            _mockDb.Setup(x => x.GetUnmatchedInvoicesByCompany(5)).Returns(new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100 }
            });
            _mockDb.Setup(x => x.GetTransactionsByCompany(It.IsAny<long>(), It.IsAny<TransactionFilterRequest>()))
                .Returns(new PagedResponse<TransactionRow>());
            var result = await _service.AutoMatchBatchAsync(5, 10);
            Assert.Equal(0, result.SuccessfulMatches);
        }

        [Fact]
        public async Task AutoMatchBatchAsync_WithMatches_ReturnsSuccess()
        {
            var invoices = new List<InvoiceRow>
            {
                new() { Id = 1, TotalAmount = 100, MatchedAmount = 0, InvoiceNumber = "INV-001" }
            };
            var transactions = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, Description = "Payment" }
            };
            _mockDb.Setup(x => x.GetUnmatchedInvoicesByCompany(5)).Returns(invoices);
            _mockDb.Setup(x => x.GetTransactionsByCompany(It.IsAny<long>(), It.IsAny<TransactionFilterRequest>()))
                .Returns(new PagedResponse<TransactionRow> { Items = transactions, TotalCount = transactions.Count });

            var pipelineResult = new PipelineResult();
            pipelineResult.AutoMatches.Add(new MatchResult
            {
                InvoiceId = 1, TransactionId = 1, MatchedAmount = 100,
                Confidence = 0.85, RuleName = "Exact Match"
            });
            _mockPipeline.Setup(x => x.Execute(invoices, transactions)).Returns(pipelineResult);
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateMatchRequest>(), 10)).Returns((true, 42L, ""));

            var result = await _service.AutoMatchBatchAsync(5, 10);
            Assert.Equal(1, result.SuccessfulMatches);
        }
    }
}