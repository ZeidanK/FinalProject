using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Matching;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class MatchServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IRulePipelineEngine> _mockPipeline;
        private readonly Mock<MatchCrudService> _mockCrud;
        private readonly Mock<MatchSuggestionService> _mockSuggestions;
        private readonly Mock<AutoMatchService> _mockAutoMatch;
        private readonly MatchService _service;

        public MatchServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _mockPipeline = new Mock<IRulePipelineEngine>();
            _mockCrud = new Mock<MatchCrudService>(_mockDb.Object);
            _mockSuggestions = new Mock<MatchSuggestionService>(_mockDb.Object, _mockPipeline.Object);
            _mockAutoMatch = new Mock<AutoMatchService>(_mockDb.Object, _mockPipeline.Object, _mockCrud.Object, _mockSuggestions.Object);
            _service = new MatchService(_mockCrud.Object, _mockSuggestions.Object, _mockAutoMatch.Object);
        }

        [Fact]
        public void GetByCompany_DelegatesToCrud()
        {
            var rows = new List<MatchRow> { new() { Id = 1 } };
            _mockCrud.Setup(x => x.GetByCompany(5)).Returns(rows);

            var result = _service.GetByCompany(5);

            Assert.Same(rows, result);
        }

        [Fact]
        public void GetById_DelegatesToCrud()
        {
            var row = new MatchRow { Id = 1 };
            _mockCrud.Setup(x => x.GetById(1)).Returns(row);

            var result = _service.GetById(1);

            Assert.Same(row, result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNull()
        {
            _mockCrud.Setup(x => x.GetById(99)).Returns((MatchRow?)null);

            Assert.Null(_service.GetById(99));
        }

        [Fact]
        public void GetMatchesByInvoice_DelegatesToCrud()
        {
            var rows = new List<MatchRow> { new() { Id = 1 } };
            _mockCrud.Setup(x => x.GetMatchesByInvoice(10)).Returns(rows);

            var result = _service.GetMatchesByInvoice(10);

            Assert.Same(rows, result);
        }

        [Fact]
        public void GetSimpleSuggestions_Delegates()
        {
            var suggestions = new List<SimpleMatchSuggestion>
            {
                new() { InvoiceId = 1, TransactionId = 2 }
            };
            _mockSuggestions.Setup(x => x.GetSimpleSuggestions(5)).Returns(suggestions);

            var result = _service.GetSimpleSuggestions(5);

            Assert.Same(suggestions, result);
        }

        [Fact]
        public void GetInstallmentSuggestions_Delegates()
        {
            var suggestions = new List<InstallmentGroupSuggestion>
            {
                new() { InvoiceId = 1 }
            };
            _mockSuggestions.Setup(x => x.GetInstallmentSuggestions(5)).Returns(suggestions);

            var result = _service.GetInstallmentSuggestions(5);

            Assert.Same(suggestions, result);
        }

        [Fact]
        public async Task GetSuggestionsAsync_Delegates()
        {
            var suggestions = new List<MatchSuggestionRow>
            {
                new() { Id = 1, Amount = 500m }
            };
            _mockSuggestions.Setup(x => x.GetSuggestionsAsync(10))
                .ReturnsAsync(suggestions);

            var result = await _service.GetSuggestionsAsync(10);

            Assert.Same(suggestions, result);
        }

        [Fact]
        public async Task AutoMatchAsync_Success_ReturnsResult()
        {
            _mockAutoMatch.Setup(x => x.AutoMatchAsync(1, 10, 70m))
                .ReturnsAsync((true, 5L, "Auto-matched", 85m));

            var (success, matchId, message, score) = await _service.AutoMatchAsync(1, 10);

            Assert.True(success);
            Assert.Equal(5, matchId);
            Assert.Equal(85m, score);
        }

        [Fact]
        public async Task AutoMatchAsync_Failure_ReturnsError()
        {
            _mockAutoMatch.Setup(x => x.AutoMatchAsync(99, 10, 70m))
                .ReturnsAsync((false, (long?)null, "Invoice not found", (decimal?)null));

            var (success, matchId, message, score) = await _service.AutoMatchAsync(99, 10);

            Assert.False(success);
            Assert.Null(matchId);
            Assert.Equal("Invoice not found", message);
        }

        [Fact]
        public async Task AutoMatchBatchAsync_Delegates()
        {
            var batchResult = new AutoMatchBatchResult { SuccessfulMatches = 3 };
            _mockAutoMatch.Setup(x => x.AutoMatchBatchAsync(5, 10, 70m))
                .ReturnsAsync(batchResult);

            var result = await _service.AutoMatchBatchAsync(5, 10);

            Assert.Equal(3, result.SuccessfulMatches);
        }

        [Fact]
        public void Create_Success_ReturnsId()
        {
            var req = new CreateMatchRequest
            {
                InvoiceId = 1,
                TransactionId = 2,
                MatchedAmount = 500m,
                MatchMethod = "manual"
            };
            _mockCrud.Setup(x => x.Create(req, 10)).Returns((true, 42L, ""));

            var (success, id, error) = _service.Create(req, 10);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
        }

        [Fact]
        public void Create_Failure_ReturnsError()
        {
            var req = new CreateMatchRequest();
            _mockCrud.Setup(x => x.Create(req, 10)).Returns((false, 0L, "Invalid invoice"));

            var (success, id, error) = _service.Create(req, 10);

            Assert.False(success);
            Assert.Equal("Invalid invoice", error);
        }

        [Fact]
        public void Delete_Success_ReturnsTrue()
        {
            _mockCrud.Setup(x => x.Delete(1)).Returns(true);

            Assert.True(_service.Delete(1));
        }

        [Fact]
        public void Delete_Failure_ReturnsFalse()
        {
            _mockCrud.Setup(x => x.Delete(99)).Returns(false);

            Assert.False(_service.Delete(99));
        }

        [Theory]
        [InlineData(85, "high")]
        [InlineData(60, "medium")]
        [InlineData(40, "low")]
        [InlineData(20, "very-low")]
        public void GetConfidenceCategory_Categorizes(decimal score, string expectedCategory)
        {
            Assert.Equal(expectedCategory, MatchService.GetConfidenceCategory(score));
        }
    }
}
