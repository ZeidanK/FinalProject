using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using System.Data.SqlClient;
using System.Reflection;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class InvoiceServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly Mock<IMatchService> _mockMatch;
        private readonly Mock<IAnomalyService> _mockAnomaly;
        private readonly InvoiceService _service;

        public InvoiceServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _mockMatch = new Mock<IMatchService>();
            _mockAnomaly = new Mock<IAnomalyService>();
            _service = new InvoiceService(_mockDb.Object, _mockMatch.Object, _mockAnomaly.Object);
        }

        private static CreateInvoiceRequest MakeReq(long companyId = 1) => new()
        {
            CompanyId = companyId,
            InvoiceNumber = "INV-001",
            VendorName = "Acme",
            InvoiceDate = new DateTime(2026, 6, 1),
            TotalAmount = 1000m,
            Currency = "USD"
        };

        private static CreateLineItemRequest MakeLineItem(int lineNum = 1) => new()
        {
            LineNumber = lineNum,
            Description = "Item",
            UnitPrice = 500m,
            TotalAmount = 500m,
            Quantity = 1
        };

        [Fact]
        public void GetByCompany_ReturnsInvoices()
        {
            var list = new List<InvoiceRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetInvoicesByCompany(5, null, null, null, null)).Returns(list);

            Assert.Same(list, _service.GetByCompany(5));
        }

        [Fact]
        public void GetById_ReturnsInvoice()
        {
            var inv = new InvoiceRow { Id = 1 };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(inv);

            Assert.Same(inv, _service.GetById(1));
        }

        [Fact]
        public void Create_Valid_ReturnsSuccess()
        {
            var req = MakeReq();
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            _mockDb.Setup(x => x.CreateInvoice(
                It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<DateTime>(), It.IsAny<decimal>(), It.IsAny<long?>(),
                It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<long?>(), It.IsAny<decimal?>(),
                It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<int?>(),
                It.IsAny<decimal?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<int?>(), false)).Returns(42);

            var (success, id, error, isDuplicate) = _service.Create(req, 10);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
            Assert.False(isDuplicate);
        }

        [Fact]
        public void Create_NoAccess_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(false);

            var (success, id, error, isDuplicate) = _service.Create(MakeReq(), 10);

            Assert.False(success);
            Assert.Contains("access", error);
        }

        [Fact]
        public void Create_EmptyInvoiceNumber_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            var req = MakeReq();
            req.InvoiceNumber = "  ";

            var (success, id, error, isDuplicate) = _service.Create(req, 10);

            Assert.False(success);
            Assert.Contains("Invoice number", error);
        }

        [Fact]
        public void Create_EmptyVendorName_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            var req = MakeReq();
            req.VendorName = "";

            var (success, id, error, isDuplicate) = _service.Create(req, 10);

            Assert.False(success);
            Assert.Contains("Vendor name", error);
        }

        [Fact]
        public void Create_DbReturnsZero_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            _mockDb.Setup(x => x.CreateInvoice(
                It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<DateTime>(), It.IsAny<decimal>(), It.IsAny<long?>(),
                It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<long?>(), It.IsAny<decimal?>(),
                It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<int?>(),
                It.IsAny<decimal?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<int?>(), false)).Returns(0);

            var (success, id, error, isDuplicate) = _service.Create(MakeReq(), 10);

            Assert.False(success);
            Assert.Equal(0, id);
        }

        [Fact]
        public void Create_WithLineItems_CreatesLineItems()
        {
            var req = MakeReq();
            req.LineItems = new List<CreateLineItemRequest> { MakeLineItem(), MakeLineItem(2) };
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            _mockDb.Setup(x => x.CreateInvoice(
                It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<DateTime>(), It.IsAny<decimal>(), It.IsAny<long?>(),
                It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<long?>(), It.IsAny<decimal?>(),
                It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<int?>(),
                It.IsAny<decimal?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<int?>(), false)).Returns(42);
            _mockDb.Setup(x => x.CreateLineItem(
                It.IsAny<long>(), It.IsAny<string>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<int?>(), It.IsAny<string?>(),
                It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<decimal?>()))
                .Returns(1);

            var (success, id, error, isDuplicate) = _service.Create(req, 10);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.False(isDuplicate);
            _mockDb.Verify(x => x.CreateLineItem(
                It.IsAny<long>(), It.IsAny<string>(), It.IsAny<decimal>(),
                It.IsAny<decimal>(), It.IsAny<int?>(), It.IsAny<string?>(),
                It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<decimal?>()),
                Times.Exactly(2));
        }

        [Fact]
        public void Update_Valid_ReturnsSuccess()
        {
            var existing = new InvoiceRow { Id = 1 };
            _mockDb.Setup(x => x.GetInvoiceById(1)).Returns(existing);
            _mockDb.Setup(x => x.UpdateInvoice(
                It.IsAny<long>(), It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<DateTime>(), It.IsAny<decimal>(),
                It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<decimal?>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<long?>(), It.IsAny<decimal?>(),
                It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<int?>(),
                It.IsAny<decimal?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<int?>(), It.IsAny<long?>(), It.IsAny<List<CreateLineItemRequest>>()))
                .Returns(true);

            var (success, error, notFound) = _service.Update(1, MakeReq(), 5);

            Assert.True(success);
            Assert.Empty(error);
            Assert.False(notFound);
        }

        [Fact]
        public void Update_NotFound_ReturnsNotFound()
        {
            _mockDb.Setup(x => x.GetInvoiceById(99)).Returns((InvoiceRow?)null);

            var (success, error, notFound) = _service.Update(99, MakeReq(), 5);

            Assert.False(success);
            Assert.True(notFound);
        }

        [Fact]
        public void UpdateStatus_ValidStatus_ReturnsTrue()
        {
            _mockDb.Setup(x => x.UpdateInvoiceStatus(1, "verified")).Returns(true);

            Assert.True(_service.UpdateStatus(1, "verified"));
        }

        [Fact]
        public void UpdateStatus_InvalidStatus_ReturnsFalse()
        {
            Assert.False(_service.UpdateStatus(1, "invalid_status"));
            _mockDb.Verify(x => x.UpdateInvoiceStatus(It.IsAny<long>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void MarkVerified_ValidIds_ReturnsTrue()
        {
            _mockDb.Setup(x => x.MarkInvoiceVerified(1, 5)).Returns(true);

            Assert.True(_service.MarkVerified(1, 5));
        }

        [Fact]
        public void MarkVerified_InvalidIds_ReturnsFalse()
        {
            Assert.False(_service.MarkVerified(0, 5));
            Assert.False(_service.MarkVerified(1, 0));
            _mockDb.Verify(x => x.MarkInvoiceVerified(It.IsAny<long>(), It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public void Delete_ValidId_ReturnsTrue()
        {
            _mockDb.Setup(x => x.DeleteInvoice(1)).Returns(true);

            Assert.True(_service.Delete(1));
        }

        [Fact]
        public void Delete_InvalidId_ReturnsFalse()
        {
            Assert.False(_service.Delete(0));
            _mockDb.Verify(x => x.DeleteInvoice(It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public void BulkDelete_EmptyList_ReturnsEmpty()
        {
            var (deleted, notFound) = _service.BulkDelete(new List<long>());

            Assert.Empty(deleted);
            Assert.Empty(notFound);
            _mockDb.Verify(x => x.BulkDeleteInvoices(It.IsAny<IEnumerable<long>>()), Times.Never);
        }

        [Fact]
        public void BulkDelete_ValidIds_ReturnsResult()
        {
            _mockDb.Setup(x => x.BulkDeleteInvoices(new List<long> { 1, 2 }))
                .Returns((new List<long> { 1, 2 }, new List<long>()));

            var (deleted, notFound) = _service.BulkDelete(new List<long> { 1, 2 });

            Assert.Equal(2, deleted.Count);
            Assert.Empty(notFound);
        }

        [Fact]
        public void BulkDelete_FiltersInvalidIds()
        {
            _mockDb.Setup(x => x.BulkDeleteInvoices(new List<long> { 2 }))
                .Returns((new List<long> { 2 }, new List<long>()));

            var (deleted, notFound) = _service.BulkDelete(new List<long> { 0, -1, 2 });

            Assert.Single(deleted);
            _mockDb.Verify(x => x.BulkDeleteInvoices(It.Is<IEnumerable<long>>(ids => !ids.Contains(0))), Times.Once);
        }

        [Fact]
        public void BulkDelete_NullList_ReturnsEmpty()
        {
            var (deleted, notFound) = _service.BulkDelete(null!);

            Assert.Empty(deleted);
            Assert.Empty(notFound);
        }

        [Fact]
        public void UpdateFileInfo_ReturnsTrue()
        {
            _mockDb.Setup(x => x.UpdateInvoiceFileInfo(1, "file.pdf", null, null, null, null)).Returns(true);

            Assert.True(_service.UpdateFileInfo(1, "file.pdf", null, null, null, null));
        }

        [Fact]
        public async Task AutoMatchAfterCreateAsync_MatchServiceAvailable_ReturnsResult()
        {
            _mockMatch.Setup(x => x.AutoMatchAsync(1, 10, 70m))
                .ReturnsAsync((true, 5L, "Matched", 85m));

            var (success, matchId, message, score) = await _service.AutoMatchAfterCreateAsync(1, 10);

            Assert.True(success);
            Assert.Equal(5, matchId);
            Assert.Equal(85m, score);
        }

        [Fact]
        public async Task AutoMatchAfterCreateAsync_MatchServiceNull_ReturnsFailure()
        {
            var serviceNoMatch = new InvoiceService(_mockDb.Object);

            var (success, matchId, message, score) = await serviceNoMatch.AutoMatchAfterCreateAsync(1, 10);

            Assert.False(success);
            Assert.Null(matchId);
            Assert.Contains("not available", message);
        }
    }
}
