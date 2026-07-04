using FinalProjectAuthAPI.BL.AnomalyDetection;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.AnomalyDetection
{
    public class DuplicateInvoiceServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly Mock<AnomalyCrudService> _mockCrud;
        private readonly DuplicateInvoiceService _service;

        public DuplicateInvoiceServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _mockCrud = new Mock<AnomalyCrudService>(_mockDb.Object);
            _service = new DuplicateInvoiceService(_mockDb.Object, _mockCrud.Object);
        }

        // ── EnsureDuplicateInvoiceAnomaly ─────────────────────────────────────

        [Fact]
        public void EnsureDuplicateInvoiceAnomaly_ExistingAnomaly_ReturnsExistingId()
        {
            _mockDb.Setup(x => x.GetOpenDuplicateInvoiceAnomalyId(5, "INV-001", 1000m,
                new System.DateTime(2026, 6, 1))).Returns(42);

            var (success, id, error) = _service.EnsureDuplicateInvoiceAnomaly(
                5, 10, "INV-001", "Acme", 1000m, new System.DateTime(2026, 6, 1), "USD");

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
            _mockCrud.Verify(x => x.Create(It.IsAny<CreateAnomalyRequest>()), Times.Never);
        }

        [Fact]
        public void EnsureDuplicateInvoiceAnomaly_NoExistingAnomaly_CreatesNew()
        {
            _mockDb.Setup(x => x.GetOpenDuplicateInvoiceAnomalyId(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<decimal>(), It.IsAny<System.DateTime>())).Returns((long?)null);
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateAnomalyRequest>())).Returns((true, 99, ""));

            var (success, id, error) = _service.EnsureDuplicateInvoiceAnomaly(
                5, 10, "INV-001", "Acme", 1000m, new System.DateTime(2026, 6, 1), "USD");

            Assert.True(success);
            Assert.Equal(99, id);
            _mockCrud.Verify(x => x.Create(It.Is<CreateAnomalyRequest>(r =>
                r.AnomalyType == "duplicate" && r.CompanyId == 5)), Times.Once);
        }

        [Fact]
        public void EnsureDuplicateInvoiceAnomaly_CreateFails_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetOpenDuplicateInvoiceAnomalyId(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<decimal>(), It.IsAny<System.DateTime>())).Returns((long?)null);
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateAnomalyRequest>())).Returns((false, 0, "DB error"));

            var (success, id, error) = _service.EnsureDuplicateInvoiceAnomaly(
                5, 10, "INV-001", "Acme", 1000m, new System.DateTime(2026, 6, 1), "USD");

            Assert.False(success);
            Assert.Equal(0, id);
            Assert.Equal("DB error", error);
        }

        // ── KeepDuplicateInvoice ──────────────────────────────────────────────

        [Fact]
        public void KeepDuplicateInvoice_InvalidInvoiceId_ReturnsFailure()
        {
            var req = new KeepDuplicateInvoiceRequest { KeepInvoiceId = 0 };
            var (success, error) = _service.KeepDuplicateInvoice(1, 10, req);
            Assert.False(success);
            Assert.Contains("Invoice to keep", error);
        }

        [Fact]
        public void KeepDuplicateInvoice_AnomalyNotFound_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetAnomalyById(99)).Returns((AnomalyRow?)null);
            var req = new KeepDuplicateInvoiceRequest { KeepInvoiceId = 10 };
            var (success, error) = _service.KeepDuplicateInvoice(99, 10, req);
            Assert.False(success);
            Assert.Contains("not found", error);
        }

        [Fact]
        public void KeepDuplicateInvoice_NoAccess_ReturnsFailure()
        {
            var anomaly = new AnomalyRow { Id = 1, CompanyId = 5 };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);
            var req = new KeepDuplicateInvoiceRequest { KeepInvoiceId = 10 };
            var (success, error) = _service.KeepDuplicateInvoice(1, 10, req);
            Assert.False(success);
            Assert.Contains("access", error);
        }

        [Fact]
        public void KeepDuplicateInvoice_NotDuplicateType_ReturnsFailure()
        {
            var anomaly = new AnomalyRow { Id = 1, CompanyId = 5, AnomalyType = "fraud" };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            var req = new KeepDuplicateInvoiceRequest { KeepInvoiceId = 10 };
            var (success, error) = _service.KeepDuplicateInvoice(1, 10, req);
            Assert.False(success);
        }

        [Fact]
        public void KeepDuplicateInvoice_Successful_DeletesAndResolves()
        {
            var anomaly = new AnomalyRow
            {
                Id = 1, CompanyId = 5, AnomalyType = "duplicate",
                RelatedInvoiceId = 10, Status = "open"
            };
            _mockDb.Setup(x => x.GetAnomalyById(1)).Returns(anomaly);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockDb.Setup(x => x.GetInvoiceById(10)).Returns(new InvoiceRow
            {
                Id = 10, InvoiceNumber = "INV-001",
                TotalAmount = 1000, InvoiceDate = new System.DateTime(2026, 6, 1)
            });
            _mockDb.Setup(x => x.GetDuplicateInvoiceAnomaliesBySignature(5, "INV-001", 1000m,
                new System.DateTime(2026, 6, 1), "open"))
                .Returns(new List<AnomalyRow> { new() { Id = 1 } });
            _mockDb.Setup(x => x.GetDuplicateInvoicesBySignature(5, "INV-001", 1000m,
                new System.DateTime(2026, 6, 1), false))
                .Returns(new List<InvoiceRow>
                {
                    new() { Id = 10 }, new() { Id = 11 }
                });
            _mockDb.Setup(x => x.ApplyDuplicateInvoiceDecision(
                It.IsAny<List<long>>(), It.IsAny<List<long>>(),
                10, 10, It.IsAny<string>())).Returns(true);

            var req = new KeepDuplicateInvoiceRequest { KeepInvoiceId = 10 };
            var (success, error) = _service.KeepDuplicateInvoice(1, 10, req);
            Assert.True(success);
        }

        // ── TryGetInvoiceSignature ────────────────────────────────────────────

        [Fact]
        public void TryGetInvoiceSignature_InvalidInvoice_ReturnsNull()
        {
            _mockDb.Setup(x => x.GetInvoiceById(99)).Returns((InvoiceRow?)null);
            Assert.Null(_service.TryGetInvoiceSignature(99));
        }

        [Fact]
        public void TryGetInvoiceSignature_ValidInvoice_ReturnsSignature()
        {
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(new InvoiceRow
            {
                Id = 1, InvoiceNumber = "INV-001",
                TotalAmount = 1000, InvoiceDate = new System.DateTime(2026, 6, 1)
            });
            var sig = _service.TryGetInvoiceSignature(1);
            Assert.NotNull(sig);
            Assert.Equal("INV-001", sig!.InvoiceNumber);
            Assert.Equal(1000m, sig.TotalAmount);
        }

        // ── BuildInvoiceGroupKey ──────────────────────────────────────────────

        [Fact]
        public void BuildInvoiceGroupKey_ReturnsPrefixedHash()
        {
            var key = _service.BuildInvoiceGroupKey(5, "INV-001", 1000m,
                new System.DateTime(2026, 6, 1));
            Assert.StartsWith("inv:", key);
            Assert.Equal(68, key.Length); // "inv:" + 64 hex chars
        }

        [Fact]
        public void BuildInvoiceGroupKey_CaseInsensitive_ProducesSameKey()
        {
            var key1 = _service.BuildInvoiceGroupKey(5, "INV-001", 1000m,
                new System.DateTime(2026, 6, 1));
            var key2 = _service.BuildInvoiceGroupKey(5, "inv-001", 1000m,
                new System.DateTime(2026, 6, 1));
            Assert.Equal(key1, key2);
        }
    }
}