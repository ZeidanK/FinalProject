using FinalProjectAuthAPI.BL.Matching;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.Matching
{
    public class MatchCrudServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly MatchCrudService _service;

        public MatchCrudServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _service = new MatchCrudService(_mockDb.Object);
        }

        // ── GetByCompany ──────────────────────────────────────────────────────

        [Fact]
        public void GetByCompany_DelegatesToDb()
        {
            var rows = new List<MatchRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetMatchesByCompany(5)).Returns(rows);
            Assert.Same(rows, _service.GetByCompany(5));
        }

        // ── GetById ───────────────────────────────────────────────────────────

        [Fact]
        public void GetById_ReturnsMatch()
        {
            var row = new MatchRow { Id = 1 };
            _mockDb.Setup(x => x.GetMatchById(1)).Returns(row);
            Assert.Same(row, _service.GetById(1));
        }

        [Fact]
        public void GetById_NotFound_ReturnsNull()
        {
            _mockDb.Setup(x => x.GetMatchById(99)).Returns((MatchRow?)null);
            Assert.Null(_service.GetById(99));
        }

        // ── GetMatchesByInvoice ───────────────────────────────────────────────

        [Fact]
        public void GetMatchesByInvoice_Delegates()
        {
            var rows = new List<MatchRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetMatchesByInvoice(10)).Returns(rows);
            Assert.Same(rows, _service.GetMatchesByInvoice(10));
        }

        // ── Create ────────────────────────────────────────────────────────────

        [Fact]
        public void Create_InvalidInvoiceId_ReturnsFailure()
        {
            var req = new CreateMatchRequest { InvoiceId = 0, TransactionId = 1, MatchedAmount = 100 };
            var (success, id, error) = _service.Create(req, 10);
            Assert.False(success);
            Assert.Contains("invoice", error);
        }

        [Fact]
        public void Create_InvalidTransactionId_ReturnsFailure()
        {
            var req = new CreateMatchRequest { InvoiceId = 1, TransactionId = 0, MatchedAmount = 100 };
            var (success, id, error) = _service.Create(req, 10);
            Assert.False(success);
            Assert.Contains("transaction", error);
        }

        [Fact]
        public void Create_ZeroMatchedAmount_ReturnsFailure()
        {
            var req = new CreateMatchRequest { InvoiceId = 1, TransactionId = 1, MatchedAmount = 0 };
            var (success, id, error) = _service.Create(req, 10);
            Assert.False(success);
            Assert.Contains("amount", error, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Create_InvoiceNotFound_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns((InvoiceRow?)null);
            var req = new CreateMatchRequest { InvoiceId = 1, TransactionId = 1, MatchedAmount = 100 };
            var (success, id, error) = _service.Create(req, 10);
            Assert.False(success);
            Assert.Contains("not found", error);
        }

        [Fact]
        public void Create_ExceedsRemainingBalance_ReturnsFailure()
        {
            var invoice = new InvoiceRow { Id = 1, TotalAmount = 100, MatchedAmount = 80 };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            var req = new CreateMatchRequest { InvoiceId = 1, TransactionId = 1, MatchedAmount = 50 };
            var (success, id, error) = _service.Create(req, 10);
            Assert.False(success);
            Assert.Contains("exceeds", error);
        }

        [Fact]
        public void Create_InstallmentOverageTolerance_AllowsOverage()
        {
            var invoice = new InvoiceRow { Id = 1, TotalAmount = 100, MatchedAmount = 0 };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockDb.Setup(x => x.CreateMatch(It.IsAny<long>(), It.IsAny<long>(), It.IsAny<decimal>(),
                It.IsAny<string>(), It.IsAny<long?>(), It.IsAny<string>(), It.IsAny<decimal?>(),
                It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string?>())).Returns(42);
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockDb.Setup(x => x.GetTransactionById(1)).Returns(new TransactionRow { Id = 1, Description = "Test" });

            var req = new CreateMatchRequest
            {
                InvoiceId = 1,
                TransactionId = 1,
                MatchedAmount = 101.50m, // within 2.00 tolerance for installment
                InstallmentNumber = 1
            };
            var (success, id, error) = _service.Create(req, 10);
            Assert.True(success);
        }

        [Fact]
        public void Create_Success_RecordsVendorAlias_OnManualMatch()
        {
            var invoice = new InvoiceRow { Id = 1, TotalAmount = 100, MatchedAmount = 0, CompanyId = 5, VendorName = "Acme" };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockDb.Setup(x => x.GetTransactionById(1)).Returns(new TransactionRow { Id = 1, Description = "Payment to Acme" });
            _mockDb.Setup(x => x.CreateMatch(It.IsAny<long>(), It.IsAny<long>(), It.IsAny<decimal>(),
                "manual", 10, "full", It.IsAny<decimal?>(), It.IsAny<string?>(),
                It.IsAny<int?>(), It.IsAny<string?>())).Returns(42);

            var req = new CreateMatchRequest
            {
                InvoiceId = 1,
                TransactionId = 1,
                MatchedAmount = 100,
                MatchMethod = "manual",
                MatchType = "full"
            };
            var (success, id, error) = _service.Create(req, 10);
            Assert.True(success);
            Assert.Equal(42, id);
            _mockDb.Verify(x => x.RecordVendorAlias(5, "Acme", "Payment to Acme"), Times.Once);
        }

        [Fact]
        public void Create_AutoMatch_DoesNotRecordVendorAlias()
        {
            var invoice = new InvoiceRow { Id = 1, TotalAmount = 100, MatchedAmount = 0, CompanyId = 5, VendorName = "Acme" };
            _mockDb.SetupSequence(x => x.GetInvoiceById(1)).Returns(invoice);
            _mockDb.Setup(x => x.CreateMatch(It.IsAny<long>(), It.IsAny<long>(), It.IsAny<decimal>(),
                "automatic", 10, "full", It.IsAny<decimal?>(), It.IsAny<string?>(),
                It.IsAny<int?>(), It.IsAny<string?>())).Returns(42);

            var req = new CreateMatchRequest
            {
                InvoiceId = 1,
                TransactionId = 1,
                MatchedAmount = 100,
                MatchMethod = "automatic"
            };
            var (success, id, error) = _service.Create(req, 10);
            Assert.True(success);
            _mockDb.Verify(x => x.RecordVendorAlias(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        // ── Delete ────────────────────────────────────────────────────────────

        [Fact]
        public void Delete_Exists_DeletesAndRejectsAlias()
        {
            var match = new MatchRow
            {
                Id = 1, InvoiceId = 1, VendorName = "Acme",
                TransactionDescription = "Payment to Acme"
            };
            _mockDb.Setup(x => x.GetMatchById(1)).Returns(match);
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(new InvoiceRow { Id = 1, CompanyId = 5 });
            _mockDb.Setup(x => x.DeleteMatch(1)).Returns(true);

            Assert.True(_service.Delete(1));
            _mockDb.Verify(x => x.RejectVendorAlias(5, "Acme", "Payment to Acme"), Times.Once);
        }

        [Fact]
        public void Delete_NoVendorInfo_DoesNotRejectAlias()
        {
            var match = new MatchRow { Id = 1, InvoiceId = 1 };
            _mockDb.Setup(x => x.GetMatchById(1)).Returns(match);
            _mockDb.Setup(x => x.DeleteMatch(1)).Returns(true);

            Assert.True(_service.Delete(1));
            _mockDb.Verify(x => x.RejectVendorAlias(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void Delete_Failure_ReturnsFalse()
        {
            _mockDb.Setup(x => x.GetMatchById(99)).Returns((MatchRow?)null);
            _mockDb.Setup(x => x.DeleteMatch(99)).Returns(false);
            Assert.False(_service.Delete(99));
        }

        // ── GetConfidenceCategory ─────────────────────────────────────────────

        [Theory]
        [InlineData(85, "high")]
        [InlineData(70, "high")]
        [InlineData(60, "medium")]
        [InlineData(50, "medium")]
        [InlineData(40, "low")]
        [InlineData(30, "low")]
        [InlineData(20, "very-low")]
        [InlineData(0, "very-low")]
        public void GetConfidenceCategory_Categorizes(decimal score, string expected)
        {
            Assert.Equal(expected, MatchCrudService.GetConfidenceCategory(score));
        }
    }
}