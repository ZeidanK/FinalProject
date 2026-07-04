using FinalProjectAuthAPI.BL.AnomalyDetection;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.AnomalyDetection
{
    public class AnomalyCrudServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly AnomalyCrudService _service;

        public AnomalyCrudServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _service = new AnomalyCrudService(_mockDb.Object);
        }

        // ── GetByCompany ──────────────────────────────────────────────────────

        [Fact]
        public void GetByCompany_DelegatesToDb()
        {
            var rows = new List<AnomalyRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetAnomaliesByCompany(5, null, null, null)).Returns(rows);
            Assert.Same(rows, _service.GetByCompany(5));
        }

        [Fact]
        public void GetByCompany_WithFilters_Delegates()
        {
            var rows = new List<AnomalyRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetAnomaliesByCompany(5, "open", "high", "duplicate")).Returns(rows);
            Assert.Same(rows, _service.GetByCompany(5, "open", "high", "duplicate"));
        }

        // ── GetById ───────────────────────────────────────────────────────────

        [Fact]
        public void GetById_ReturnsAnomaly()
        {
            var a = new AnomalyRow { Id = 1 };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(a);
            Assert.Same(a, _service.GetById(1));
        }

        [Fact]
        public void GetById_NotFound_ReturnsNull()
        {
            _mockDb.Setup(x => x.GetAnomalyById(99)).Returns((AnomalyRow?)null);
            Assert.Null(_service.GetById(99));
        }

        // ── GetStats ──────────────────────────────────────────────────────────

        [Fact]
        public void GetStats_EmptyList_ReturnsEmptyStats()
        {
            var stats = _service.GetStats(new List<AnomalyRow>());
            Assert.Empty(stats.ByStatus);
            Assert.Empty(stats.BySeverity);
        }

        [Fact]
        public void GetStats_PopulatedList_CountsCorrectly()
        {
            var rows = new List<AnomalyRow>
            {
                new() { Id = 1, Status = "open", Severity = "high" },
                new() { Id = 2, Status = "open", Severity = "medium" },
                new() { Id = 3, Status = "resolved", Severity = "high" },
            };

            var stats = _service.GetStats(rows);

            Assert.Equal(2, stats.ByStatus["open"]);
            Assert.Equal(1, stats.ByStatus["resolved"]);
            Assert.Equal(2, stats.BySeverity["high"]);
            Assert.Equal(1, stats.BySeverity["medium"]);
        }

        [Fact]
        public void GetStats_NullStatusAndSeverity_DefaultsGracefully()
        {
            var rows = new List<AnomalyRow>
            {
                new() { Id = 1, Status = null, Severity = null },
            };

            var stats = _service.GetStats(rows);

            Assert.Equal(1, stats.ByStatus["open"]);
            Assert.Equal(1, stats.BySeverity["warning"]);
        }

        // ── Create ────────────────────────────────────────────────────────────

        [Fact]
        public void Create_EmptyAnomalyType_ReturnsFailure()
        {
            var req = new CreateAnomalyRequest { AnomalyType = "", Title = "Test" };
            var (success, id, error) = _service.Create(req);
            Assert.False(success);
            Assert.Contains("type", error);
        }

        [Fact]
        public void Create_EmptyTitle_ReturnsFailure()
        {
            var req = new CreateAnomalyRequest { AnomalyType = "fraud", Title = "" };
            var (success, id, error) = _service.Create(req);
            Assert.False(success);
            Assert.Contains("Title", error);
        }

        [Fact]
        public void Create_InvalidSeverity_ReturnsFailure()
        {
            var req = new CreateAnomalyRequest { AnomalyType = "fraud", Title = "Test", Severity = "invalid" };
            var (success, id, error) = _service.Create(req);
            Assert.False(success);
            Assert.Contains("severity", error);
        }

        [Fact]
        public void Create_NullSeverity_DefaultsToMedium()
        {
            _mockDb.Setup(x => x.CreateAnomaly(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), "medium", It.IsAny<string?>(),
                It.IsAny<long?>(), It.IsAny<long?>(), It.IsAny<long?>(),
                It.IsAny<decimal?>(), It.IsAny<string>(), It.IsAny<decimal?>())).Returns(42);

            var req = new CreateAnomalyRequest { CompanyId = 5, AnomalyType = "fraud", Title = "Test" };
            var (success, id, error) = _service.Create(req);
            Assert.True(success);
            Assert.Equal(42, id);
        }

        [Fact]
        public void Create_DbFails_ReturnsFailure()
        {
            _mockDb.Setup(x => x.CreateAnomaly(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<long?>(), It.IsAny<long?>(), It.IsAny<long?>(),
                It.IsAny<decimal?>(), It.IsAny<string>(), It.IsAny<decimal?>())).Returns(0);

            var req = new CreateAnomalyRequest { CompanyId = 5, AnomalyType = "fraud", Title = "Test", Severity = "high" };
            var (success, id, error) = _service.Create(req);
            Assert.False(success);
            Assert.Contains("Failed", error);
        }

        [Fact]
        public void Create_Success_ReturnsId()
        {
            _mockDb.Setup(x => x.CreateAnomaly(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<long?>(), It.IsAny<long?>(), It.IsAny<long?>(),
                It.IsAny<decimal?>(), It.IsAny<string>(), It.IsAny<decimal?>())).Returns(42);

            var req = new CreateAnomalyRequest { CompanyId = 5, AnomalyType = "fraud", Title = "Test", Severity = "high" };
            var (success, id, error) = _service.Create(req);
            Assert.True(success);
            Assert.Equal(42, id);
        }

        // ── Resolve ───────────────────────────────────────────────────────────

        [Fact]
        public void Resolve_InvalidStatus_ReturnsFailure()
        {
            var req = new ResolveAnomalyRequest { Status = "invalid" };
            var (success, error) = _service.Resolve(1, 10, req);
            Assert.False(success);
            Assert.Contains("status", error);
        }

        [Fact]
        public void Resolve_NullStatus_DefaultsToResolved()
        {
            var req = new ResolveAnomalyRequest();
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(new AnomalyRow { Id = 1 });
            _mockDb.Setup(x => x.ResolveAnomaly(1, 10, null, "resolved")).Returns(true);

            var (success, error) = _service.Resolve(1, 10, req);
            Assert.True(success);
        }

        [Fact]
        public void Resolve_AnomalyNotFound_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetAnomalyById(99)).Returns((AnomalyRow?)null);
            var req = new ResolveAnomalyRequest { Status = "resolved" };
            var (success, error) = _service.Resolve(99, 10, req);
            Assert.False(success);
            Assert.Contains("not found", error);
        }

        [Fact]
        public void Resolve_DuplicateAnomaly_ResolvesGroup()
        {
            var anomaly = new AnomalyRow
            {
                Id = 1, CompanyId = 5, AnomalyType = "duplicate",
                RelatedInvoiceId = 10, Status = "open"
            };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.GetInvoiceById(10)).Returns(new InvoiceRow
            {
                Id = 10, InvoiceNumber = "INV-001",
                TotalAmount = 1000, InvoiceDate = new System.DateTime(2026, 6, 1)
            });
            var groupRows = new List<AnomalyRow>
            {
                new() { Id = 1 }, new() { Id = 2 }
            };
            _mockDb.Setup(x => x.GetDuplicateInvoiceAnomaliesBySignature(
                5, "INV-001", 1000m, new System.DateTime(2026, 6, 1), "open")).Returns(groupRows);
            _mockDb.Setup(x => x.GetDuplicateInvoicesBySignature(
                5, "INV-001", 1000m, new System.DateTime(2026, 6, 1)))
                .Returns(new List<InvoiceRow>
                {
                    new() { Id = 10 }, new() { Id = 11 }
                });
            _mockDb.Setup(x => x.ResolveAnomalies(It.Is<List<long>>(ids => ids.Count == 2), 10, null, "resolved"))
                .Returns(true);

            var req = new ResolveAnomalyRequest { Status = "resolved" };
            var (success, error) = _service.Resolve(1, 10, req);
            Assert.True(success);
        }

        [Fact]
        public void Resolve_DuplicateFileAnomaly_ResolvesGroup()
        {
            var anomaly = new AnomalyRow
            {
                Id = 1, CompanyId = 5, AnomalyType = "duplicate_transaction_file", Status = "open"
            };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.GetTransactionFileUploadsByAnomalyId(1))
                .Returns(new List<TransactionFileUploadRow>
                {
                    new() { FileHashSha256 = "hash123" }
                });
            _mockDb.Setup(x => x.GetDuplicateFileAnomaliesByHash(5, "hash123", "open"))
                .Returns(new List<AnomalyRow> { new() { Id = 1 }, new() { Id = 2 } });
            _mockDb.Setup(x => x.ResolveAnomalies(It.Is<List<long>>(ids => ids.Count == 2), 10, null, "dismissed"))
                .Returns(true);

            var req = new ResolveAnomalyRequest { Status = "dismissed" };
            var (success, error) = _service.Resolve(1, 10, req);
            Assert.True(success);
        }

        [Fact]
        public void Resolve_SingleAnomaly_Resolves()
        {
            var anomaly = new AnomalyRow { Id = 1, CompanyId = 5, AnomalyType = "fraud", Status = "open" };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.ResolveAnomaly(1, 10, "Fixed it", "resolved")).Returns(true);

            var req = new ResolveAnomalyRequest { Status = "resolved", ResolutionNotes = "Fixed it" };
            var (success, error) = _service.Resolve(1, 10, req);
            Assert.True(success);
        }

        [Fact]
        public void Resolve_ReopeningDuplicate_RestoresInvoices()
        {
            var anomaly = new AnomalyRow
            {
                Id = 1, CompanyId = 5, AnomalyType = "duplicate",
                RelatedInvoiceId = 10, Status = "resolved"
            };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.GetInvoiceById(10)).Returns(new InvoiceRow
            {
                Id = 10, InvoiceNumber = "INV-001",
                TotalAmount = 1000, InvoiceDate = new System.DateTime(2026, 6, 1)
            });
            var groupRows = new List<AnomalyRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetDuplicateInvoiceAnomaliesBySignature(
                5, "INV-001", 1000m, new System.DateTime(2026, 6, 1), "resolved")).Returns(groupRows);
            _mockDb.Setup(x => x.GetDuplicateInvoicesBySignature(
                5, "INV-001", 1000m, new System.DateTime(2026, 6, 1)))
                .Returns(new List<InvoiceRow> { new() { Id = 10 }, new() { Id = 11 } });
            _mockDb.Setup(x => x.ResolveAnomaly(1, 10, null, "open")).Returns(true);

            var req = new ResolveAnomalyRequest { Status = "open" };
            var (success, error) = _service.Resolve(1, 10, req);
            Assert.True(success);
            _mockDb.Verify(x => x.RestoreDuplicateInvoices(It.Is<List<long>>(ids => ids.Count == 2)), Times.Once);
        }
    }
}