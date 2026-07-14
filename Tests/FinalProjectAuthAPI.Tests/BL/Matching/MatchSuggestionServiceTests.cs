using FinalProjectAuthAPI.BL.Matching;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.Matching
{
    public class MatchSuggestionServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IRulePipelineEngine> _mockPipeline;
        private readonly MatchSuggestionService _service;

        public MatchSuggestionServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _mockPipeline = new Mock<IRulePipelineEngine>();
            _service = new MatchSuggestionService(_mockDb.Object, _mockPipeline.Object);
        }

        private static InvoiceRow CreateKspInstallmentInvoice(decimal installmentAmount = 255m)
        {
            return new InvoiceRow
            {
                Id = 80,
                CompanyId = 8,
                InvoiceNumber = "2866377",
                VendorName = "KSP",
                InvoiceDate = new System.DateTime(2025, 4, 6),
                TotalAmount = 2555m,
                MatchedAmount = 0m,
                PaymentPlanTotalInstallments = 10,
                PaymentPlanInstallmentAmount = installmentAmount,
            };
        }

        private static TransactionCandidate CreateKspInstallmentCandidate(
            long id,
            int installmentNumber,
            decimal chargeAmount,
            System.DateTime? postedDate = null)
        {
            return new TransactionCandidate
            {
                Id = id,
                TransactionDate = new System.DateTime(2025, 4, 6),
                PostedDate = postedDate ?? new System.DateTime(2025, 5, 2),
                Description = $"\u05ea\u05e9\u05dc\u05d5\u05dd {installmentNumber} \u05de\u05ea\u05d5\u05da 10",
                Amount = 2555m,
                ChargeAmount = chargeAmount,
                TransactionType = "\u05ea\u05e9\u05dc\u05d5\u05de\u05d9\u05dd",
                VendorName = "KSP",
                RequiresInvoice = true,
            };
        }

        [Fact]
        public void GetSimpleSuggestions_NoInvoices_ReturnsEmpty()
        {
            _mockDb.Setup(x => x.GetInvoicesByCompany(5, null, null, null, false))
                .Returns(new List<InvoiceRow>());
            var result = _service.GetSimpleSuggestions(5);
            Assert.Empty(result);
        }

        [Fact]
        public void GetSimpleSuggestions_NoMatchingTransactions_ReturnsEmpty()
        {
            _mockDb.Setup(x => x.GetInvoicesByCompany(5, null, null, null, false))
                .Returns(new List<InvoiceRow>
                {
                    new() { Id = 1, TotalAmount = 100, MatchedAmount = 0, InvoiceDate = new System.DateTime(2026, 6, 1) }
                });
            _mockDb.Setup(x => x.GetCandidateTransactions(5))
                .Returns(new List<TransactionCandidate>
                {
                    new() { Id = 1, Amount = 200, TransactionDate = new System.DateTime(2026, 6, 2), TransactionType = "debit" }
                });
            var result = _service.GetSimpleSuggestions(5);
            Assert.Empty(result);
        }

        [Fact]
        public void GetSimpleSuggestions_MatchingDateAndAmount_ReturnsSuggestion()
        {
            var date = new System.DateTime(2026, 6, 1);
            _mockDb.Setup(x => x.GetInvoicesByCompany(5, null, null, null, false))
                .Returns(new List<InvoiceRow>
                {
                    new() { Id = 1, InvoiceNumber = "INV-001", VendorName = "Acme", TotalAmount = 100, MatchedAmount = 0, InvoiceDate = date }
                });
            _mockDb.Setup(x => x.GetCandidateTransactions(5))
                .Returns(new List<TransactionCandidate>
                {
                    new() { Id = 1, Amount = -100, TransactionDate = date, TransactionType = "debit", Description = "Payment" }
                });
            var result = _service.GetSimpleSuggestions(5);
            Assert.Single(result);
            Assert.Equal(1, result[0].InvoiceId);
            Assert.Equal(1, result[0].TransactionId);
        }

        [Fact]
        public void GetSimpleSuggestions_SkipsInstallmentTransactions()
        {
            var date = new System.DateTime(2026, 6, 1);
            _mockDb.Setup(x => x.GetInvoicesByCompany(5, null, null, null, false))
                .Returns(new List<InvoiceRow>
                {
                    new() { Id = 1, TotalAmount = 100, MatchedAmount = 0, InvoiceDate = date }
                });
            _mockDb.Setup(x => x.GetCandidateTransactions(5))
                .Returns(new List<TransactionCandidate>
                {
                    new() { Id = 1, Amount = -100, TransactionDate = date, TransactionType = "תשלומים", Description = "Installment" }
                });
            var result = _service.GetSimpleSuggestions(5);
            Assert.Empty(result);
        }

        [Fact]
        public void GetInstallmentSuggestions_IncludesFirstInstallmentResidualAmount()
        {
            var invoice = CreateKspInstallmentInvoice(255.50m);
            _mockDb.Setup(x => x.GetInvoicesByCompany(8, null, null, null, (bool?)null))
                .Returns(new List<InvoiceRow> { invoice });
            _mockDb.Setup(x => x.GetCandidateTransactions(8))
                .Returns(new List<TransactionCandidate>
                {
                    CreateKspInstallmentCandidate(1006, 1, 260m),
                    CreateKspInstallmentCandidate(986, 2, 255m, new System.DateTime(2025, 6, 3)),
                });
            _mockDb.Setup(x => x.GetMatchesByInvoice(80))
                .Returns(new List<MatchRow>());

            var result = _service.GetInstallmentSuggestions(8);

            var group = Assert.Single(result);
            Assert.Equal(new long[] { 1006, 986 }, group.SuggestedTransactions.Select(t => t.TransactionId));
            Assert.Equal(260m, group.SuggestedTransactions[0].Amount);
        }

        [Fact]
        public void GetInstallmentSuggestions_DoesNotUseFirstResidualForNonFirstInstallment()
        {
            var invoice = CreateKspInstallmentInvoice();
            _mockDb.Setup(x => x.GetInvoicesByCompany(8, null, null, null, (bool?)null))
                .Returns(new List<InvoiceRow> { invoice });
            _mockDb.Setup(x => x.GetCandidateTransactions(8))
                .Returns(new List<TransactionCandidate>
                {
                    CreateKspInstallmentCandidate(986, 2, 260m, new System.DateTime(2025, 6, 3)),
                });
            _mockDb.Setup(x => x.GetMatchesByInvoice(80))
                .Returns(new List<MatchRow>());

            var result = _service.GetInstallmentSuggestions(8);

            var group = Assert.Single(result);
            Assert.Empty(group.SuggestedTransactions);
        }

        [Fact]
        public void GetInstallmentSuggestions_OrdersSuggestionsByInstallmentNumber()
        {
            var invoice = CreateKspInstallmentInvoice();
            _mockDb.Setup(x => x.GetInvoicesByCompany(8, null, null, null, (bool?)null))
                .Returns(new List<InvoiceRow> { invoice });
            _mockDb.Setup(x => x.GetCandidateTransactions(8))
                .Returns(new List<TransactionCandidate>
                {
                    CreateKspInstallmentCandidate(3, 3, 255m, new System.DateTime(2025, 7, 2)),
                    CreateKspInstallmentCandidate(1, 1, 260m, new System.DateTime(2025, 5, 2)),
                    CreateKspInstallmentCandidate(2, 2, 255m, new System.DateTime(2025, 6, 3)),
                });
            _mockDb.Setup(x => x.GetMatchesByInvoice(80))
                .Returns(new List<MatchRow>());

            var result = _service.GetInstallmentSuggestions(8);

            var group = Assert.Single(result);
            Assert.Equal(new long[] { 1, 2, 3 }, group.SuggestedTransactions.Select(t => t.TransactionId));
        }

        [Fact]
        public async Task GetSuggestionsAsync_InvoiceNotFound_ReturnsEmpty()
        {
            _mockDb.Setup(x => x.GetInvoiceById(99)).Returns((InvoiceRow?)null);
            var result = await _service.GetSuggestionsAsync(99);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetSuggestionsAsync_NoTransactions_ReturnsEmpty()
        {
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(new InvoiceRow { Id = 1, CompanyId = 5 });
            _mockDb.Setup(x => x.GetTransactionsByCompany(It.IsAny<long>(), It.IsAny<TransactionFilterRequest>()))
                .Returns(new PagedResponse<TransactionRow>());
            var result = await _service.GetSuggestionsAsync(1);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetSuggestionsAsync_WithPipelineResults_ReturnsSuggestions()
        {
            var invoice = new InvoiceRow { Id = 1, CompanyId = 5, TotalAmount = 100, InvoiceNumber = "INV-001" };
            var txns = new List<TransactionRow>
            {
                new() { Id = 1, Amount = -100, TransactionDate = new System.DateTime(2026, 6, 1), Description = "Payment", TransactionType = "debit" }
            };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockDb.Setup(x => x.GetTransactionsByCompany(It.IsAny<long>(), It.IsAny<TransactionFilterRequest>()))
                .Returns(new PagedResponse<TransactionRow> { Items = txns, TotalCount = txns.Count });

            var pipelineResult = new PipelineResult();
            pipelineResult.AutoMatches.Add(new MatchResult
            {
                InvoiceId = 1, TransactionId = 1, MatchedAmount = 100,
                Confidence = 0.85, RuleLayer = "Layer 1", RuleName = "Exact",
                MatchReason = "Exact match"
            });
            _mockPipeline.Setup(x => x.Execute(It.IsAny<List<InvoiceRow>>(), It.IsAny<List<TransactionRow>>()))
                .Returns(pipelineResult);

            var result = await _service.GetSuggestionsAsync(1);
            Assert.NotEmpty(result);
            Assert.Equal(1, result[0].Id);
            Assert.Equal(85, result[0].MatchScore);
        }
    }
}
