using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.AnomalyDetection;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class AnomalyServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<AnomalyCrudService> _mockCrud;
        private readonly Mock<DuplicateInvoiceService> _mockDupInvoice;
        private readonly Mock<DuplicateFileDetectionService> _mockDupFile;
        private readonly AnomalyService _service;

        public AnomalyServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _mockCrud = new Mock<AnomalyCrudService>(_mockDb.Object);
            _mockDupInvoice = new Mock<DuplicateInvoiceService>(_mockDb.Object, _mockCrud.Object);
            _mockDupFile = new Mock<DuplicateFileDetectionService>(_mockDb.Object, _mockCrud.Object);
            _service = new AnomalyService(_mockDb.Object, _mockCrud.Object, _mockDupInvoice.Object, _mockDupFile.Object);
        }

        private static AnomalyRow MakeDuplicateAnomaly(long id = 1, long invoiceId = 10) => new()
        {
            Id = id,
            CompanyId = 5,
            AnomalyType = "duplicate",
            Title = "Duplicate invoice",
            Status = "open",
            RelatedInvoiceId = invoiceId,
            CreatedAt = new DateTime(2026, 6, 1, 10, 0, 0),
        };

        private static AnomalyRow MakeFileAnomaly(long id = 3) => new()
        {
            Id = id,
            CompanyId = 5,
            AnomalyType = "duplicate_transaction_file",
            Title = "Duplicate file",
            Status = "open",
            CreatedAt = new DateTime(2026, 6, 3, 10, 0, 0),
        };

        private static InvoiceRow MakeInvoiceRow(long id = 10) => new()
        {
            Id = id,
            CompanyId = 5,
            InvoiceNumber = "INV-001",
            VendorName = "Acme",
            TotalAmount = 1000m,
            InvoiceDate = new DateTime(2026, 6, 1),
        };

        [Fact]
        public void GetByCompany_DelegatesToCrud()
        {
            var rows = new List<AnomalyRow> { new() { Id = 1, AnomalyType = "other", CreatedAt = DateTime.Now } };
            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(rows);

            var result = _service.GetByCompany(5);

            Assert.Single(result);
            Assert.Equal(1, result[0].Id);
        }

        [Fact]
        public void GetByCompany_GroupsDuplicateAnomalies()
        {
            var a1 = MakeDuplicateAnomaly(1, 10);
            var a2 = MakeDuplicateAnomaly(2, 10);
            var rows = new List<AnomalyRow> { a1, a2 };

            var signature = new DuplicateInvoiceService.InvoiceSignature
            {
                InvoiceNumber = "INV-001",
                TotalAmount = 1000m,
                InvoiceDate = new DateTime(2026, 6, 1),
            };

            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(rows);
            _mockDupInvoice.Setup(x => x.TryGetInvoiceSignature(10)).Returns(signature);
            _mockDupInvoice.Setup(x => x.BuildInvoiceGroupKey(5, "INV-001", 1000m, new DateTime(2026, 6, 1)))
                .Returns("inv:abc");
            _mockDb.Setup(x => x.GetDuplicateInvoiceAnomaliesBySignature(5, "INV-001", 1000m, new DateTime(2026, 6, 1), "open"))
                .Returns(rows);
            _mockDb.Setup(x => x.GetDuplicateInvoicesBySignature(5, "INV-001", 1000m, new DateTime(2026, 6, 1), false, null))
                .Returns(new List<InvoiceRow> { MakeInvoiceRow() });

            var result = _service.GetByCompany(5);

            Assert.Single(result);
            Assert.Equal(1, result[0].RelatedItemsCount);
        }

        [Fact]
        public void GetByCompany_DuplicateWithoutSignature_FallsBack()
        {
            var a1 = MakeDuplicateAnomaly(1, 10);
            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(new List<AnomalyRow> { a1 });
            _mockDupInvoice.Setup(x => x.TryGetInvoiceSignature(10)).Returns((DuplicateInvoiceService.InvoiceSignature?)null);

            var result = _service.GetByCompany(5);

            Assert.Single(result);
        }

        [Fact]
        public void GetByCompany_FileAnomaly_PopulatesRelatedItems()
        {
            var a = MakeFileAnomaly(3);
            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(new List<AnomalyRow> { a });
            _mockDb.Setup(x => x.GetTransactionFileUploadsByAnomalyId(3))
                .Returns(new List<TransactionFileUploadRow>
                {
                    new() { Id = 1, FileOriginalName = "file.xlsx", FileHashSha256 = "hash123" }
                });
            _mockDb.Setup(x => x.GetTransactionFileUploadsByHash(5, "hash123", null))
                .Returns(new List<TransactionFileUploadRow>
                {
                    new() { Id = 1, FileOriginalName = "file.xlsx", FileHashSha256 = "hash123", CreatedAt = new DateTime(2026, 6, 3) },
                    new() { Id = 2, FileOriginalName = "file2.xlsx", FileHashSha256 = "hash123", CreatedAt = new DateTime(2026, 6, 1) },
                });
            _mockDupFile.Setup(x => x.BuildFileGroupKey(5, "hash123")).Returns("file:abc");

            var result = _service.GetByCompany(5);

            Assert.Single(result);
            Assert.Equal(2, result[0].RelatedItemsCount);
            Assert.Equal("file:abc", result[0].GroupKey);
        }

        [Fact]
        public void GetByCompany_NonDuplicateType_BuildsSingleItemFallback()
        {
            var a = new AnomalyRow
            {
                Id = 4,
                CompanyId = 5,
                AnomalyType = "fraud",
                Title = "Suspicious activity",
                RelatedInvoiceId = 10,
                RelatedTransactionId = 20,
                RelatedMatchId = 30,
                Amount = 500m,
                CreatedAt = new DateTime(2026, 6, 4),
            };
            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(new List<AnomalyRow> { a });

            var result = _service.GetByCompany(5);

            Assert.Single(result);
            Assert.Equal(3, result[0].RelatedItemsCount);
        }

        [Fact]
        public void GetByCompany_EmptyList_ReturnsEmpty()
        {
            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(new List<AnomalyRow>());

            var result = _service.GetByCompany(5);

            Assert.Empty(result);
        }

        [Fact]
        public void GetById_ReturnsAnomalyFromCrud()
        {
            var a = MakeDuplicateAnomaly(1, 10);
            _mockCrud.Setup(x => x.GetById(1)).Returns(a);
            var signature = new DuplicateInvoiceService.InvoiceSignature
            {
                InvoiceNumber = "INV-001",
                TotalAmount = 1000m,
                InvoiceDate = new DateTime(2026, 6, 1),
            };
            _mockDupInvoice.Setup(x => x.TryGetInvoiceSignature(10)).Returns(signature);
            _mockDupInvoice.Setup(x => x.BuildInvoiceGroupKey(5, "INV-001", 1000m, new DateTime(2026, 6, 1)))
                .Returns("inv:abc");
            _mockDb.Setup(x => x.GetDuplicateInvoicesBySignature(5, "INV-001", 1000m, new DateTime(2026, 6, 1), false, null))
                .Returns(new List<InvoiceRow> { MakeInvoiceRow() });

            var result = _service.GetById(1);

            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
        }

        [Fact]
        public void GetById_CrudReturnsNull_ReturnsNull()
        {
            _mockCrud.Setup(x => x.GetById(99)).Returns((AnomalyRow?)null);

            var result = _service.GetById(99);

            Assert.Null(result);
        }

        [Fact]
        public void GetStats_CallsCrud()
        {
            var groupedRows = new List<AnomalyRow>();
            _mockCrud.Setup(x => x.GetByCompany(5, null, null, null)).Returns(groupedRows);
            var stats = new AnomalyStatsRow();
            _mockCrud.Setup(x => x.GetStats(groupedRows)).Returns(stats);

            var result = _service.GetStats(5);

            Assert.Same(stats, result);
        }

        [Fact]
        public void Create_Success_ReturnsId()
        {
            var req = new CreateAnomalyRequest { CompanyId = 5, AnomalyType = "fraud", Title = "Test" };
            _mockCrud.Setup(x => x.Create(req)).Returns((true, 42L, ""));

            var (success, id, error) = _service.Create(req);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
        }

        [Fact]
        public void Create_Failure_ReturnsError()
        {
            var req = new CreateAnomalyRequest();
            _mockCrud.Setup(x => x.Create(req)).Returns((false, 0L, "Invalid"));

            var (success, id, error) = _service.Create(req);

            Assert.False(success);
            Assert.Equal("Invalid", error);
        }

        [Fact]
        public void Resolve_Success_ReturnsOk()
        {
            var req = new ResolveAnomalyRequest { Status = "resolved" };
            _mockCrud.Setup(x => x.Resolve(1, 10, req)).Returns((true, ""));

            var (success, error) = _service.Resolve(1, 10, req);

            Assert.True(success);
            Assert.Empty(error);
        }

        [Fact]
        public void Resolve_Failure_ReturnsError()
        {
            var req = new ResolveAnomalyRequest { Status = "resolved" };
            _mockCrud.Setup(x => x.Resolve(99, 10, req)).Returns((false, "Not found"));

            var (success, error) = _service.Resolve(99, 10, req);

            Assert.False(success);
            Assert.Equal("Not found", error);
        }

        [Fact]
        public void KeepDuplicateInvoice_Delegates()
        {
            var req = new KeepDuplicateInvoiceRequest { KeepInvoiceId = 10 };
            _mockDupInvoice.Setup(x => x.KeepDuplicateInvoice(1, 5, req)).Returns((true, ""));

            var (success, error) = _service.KeepDuplicateInvoice(1, 5, req);

            Assert.True(success);
            Assert.Empty(error);
        }

        [Fact]
        public void EnsureDuplicateInvoiceAnomaly_Delegates()
        {
            var date = new DateTime(2026, 6, 1);
            _mockDupInvoice.Setup(x => x.EnsureDuplicateInvoiceAnomaly(5, 10, "INV-001", "Acme", 1000m, date, "USD"))
                .Returns((true, 42L, ""));

            var (success, id, error) = _service.EnsureDuplicateInvoiceAnomaly(5, 10, "INV-001", "Acme", 1000m, date, "USD");

            Assert.True(success);
            Assert.Equal(42, id);
        }

        [Fact]
        public void RegisterTransactionFileUpload_Delegates()
        {
            var date1 = new DateTime(2026, 6, 1);
            var date2 = new DateTime(2026, 6, 30);
            _mockDupFile.Setup(x => x.RegisterTransactionFileUpload(5, "file.xlsx", "/path", 1024L, 10L, "hash123", date1, date2))
                .Returns((true, 1L, 42L, true, ""));

            var (success, uploadId, anomalyId, isDuplicate, error) = _service.RegisterTransactionFileUpload(5, "file.xlsx", "/path", 1024L, 10L, "hash123", date1, date2);

            Assert.True(success);
            Assert.Equal(1, uploadId);
            Assert.Equal(42, anomalyId);
            Assert.True(isDuplicate);
        }
    }
}
