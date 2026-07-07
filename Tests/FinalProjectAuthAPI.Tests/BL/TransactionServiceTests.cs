using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class TransactionServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IMatchService> _mockMatch;
        private readonly TransactionService _service;

        public TransactionServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _mockMatch = new Mock<IMatchService>();
            _service = new TransactionService(_mockDb.Object, _mockMatch.Object);
        }

        private static CreateTransactionRequest MakeReq(long companyId = 1) => new()
        {
            CompanyId = companyId,
            Description = "Payment",
            Amount = 500m,
            TransactionDate = new DateTime(2026, 6, 15)
        };

        [Fact]
        public void GetByCompany_ReturnsTransactions()
        {
            var list = new List<TransactionRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetTransactionsByCompany(5, null, null, null, null)).Returns(list);

            Assert.Same(list, _service.GetByCompany(5));
        }

        [Fact]
        public void GetById_ReturnsTransaction()
        {
            var txn = new TransactionRow { Id = 1 };
            _mockDb.Setup(x => x.GetTransactionById(1)).Returns(txn);

            Assert.Same(txn, _service.GetById(1));
        }

        [Fact]
        public void GetById_ReturnsNull_WhenNotFound()
        {
            _mockDb.Setup(x => x.GetTransactionById(99)).Returns((TransactionRow?)null);

            Assert.Null(_service.GetById(99));
        }

        [Fact]
        public void Create_Valid_ReturnsSuccess()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            _mockDb.Setup(x => x.CreateTransaction(1, 10, It.IsAny<TransactionInsertData>())).Returns(42);

            var (success, id, error) = _service.Create(MakeReq(), 10);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
        }

        [Fact]
        public void Create_NoAccess_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(false);

            var (success, id, error) = _service.Create(MakeReq(), 10);

            Assert.False(success);
            Assert.Contains("access", error);
        }

        [Fact]
        public void Create_EmptyDescription_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            var req = MakeReq();
            req.Description = "  ";

            var (success, id, error) = _service.Create(req, 10);

            Assert.False(success);
            Assert.Contains("Description", error);
        }

        [Fact]
        public void Create_ZeroAmount_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            var req = MakeReq();
            req.Amount = 0;

            var (success, id, error) = _service.Create(req, 10);

            Assert.False(success);
            Assert.Contains("Amount", error);
        }

        [Fact]
        public void Create_DbReturnsZero_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            _mockDb.Setup(x => x.CreateTransaction(It.IsAny<long>(), It.IsAny<long?>(), It.IsAny<TransactionInsertData>())).Returns(0);

            var (success, id, error) = _service.Create(MakeReq(), 10);

            Assert.False(success);
        }

        [Fact]
        public void BulkCreate_Valid_ReturnsIds()
        {
            var req = new BulkCreateTransactionsRequest
            {
                CompanyId = 1,
                Transactions = new List<CreateTransactionRequest>
                {
                    new() { Description = "T1", Amount = 100m },
                    new() { Description = "T2", Amount = 200m }
                }
            };
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);
            _mockDb.Setup(x => x.BulkCreateTransactions(1, 10, It.IsAny<IEnumerable<TransactionInsertData>>()))
                .Returns(new List<long> { 1, 2 });

            var (success, ids, error) = _service.BulkCreate(req, 10);

            Assert.True(success);
            Assert.Equal(2, ids.Count);
        }

        [Fact]
        public void BulkCreate_NoAccess_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(false);

            var (success, ids, error) = _service.BulkCreate(
                new BulkCreateTransactionsRequest { CompanyId = 1, Transactions = new List<CreateTransactionRequest>() }, 10);

            Assert.False(success);
            Assert.Contains("access", error);
        }

        [Fact]
        public void BulkCreate_EmptyTransactions_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 1)).Returns(true);

            var (success, ids, error) = _service.BulkCreate(
                new BulkCreateTransactionsRequest { CompanyId = 1 }, 10);

            Assert.False(success);
            Assert.Contains("No transactions", error);
        }

        [Fact]
        public void Delete_ValidId_ReturnsTrue()
        {
            _mockDb.Setup(x => x.GetTransactionById(1)).Returns(new TransactionRow { Id = 1, CompanyId = 1 });
            _mockDb.Setup(x => x.DeleteTransaction(1)).Returns(true);

            Assert.True(_service.Delete(1));
        }

        [Fact]
        public void Delete_InvalidId_ReturnsFalse()
        {
            Assert.False(_service.Delete(0));
            _mockDb.Verify(x => x.DeleteTransaction(It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public void BulkDelete_ValidIds_ReturnsResult()
        {
            _mockDb.Setup(x => x.BulkDeleteTransactions(new List<long> { 1, 2 }))
                .Returns((new List<long> { 1, 2 }, new List<long>()));

            var (deleted, notFound) = _service.BulkDelete(new List<long> { 1, 2 });

            Assert.Equal(2, deleted.Count);
            Assert.Empty(notFound);
        }

        [Fact]
        public void BulkDelete_NullList_ReturnsEmpty()
        {
            var (deleted, notFound) = _service.BulkDelete(null!);

            Assert.Empty(deleted);
            Assert.Empty(notFound);
            _mockDb.Verify(x => x.BulkDeleteTransactions(It.IsAny<IEnumerable<long>>()), Times.Never);
        }

        [Fact]
        public void BulkDelete_FiltersInvalidIds()
        {
            _mockDb.Setup(x => x.BulkDeleteTransactions(new List<long> { 2 }))
                .Returns((new List<long> { 2 }, new List<long>()));

            var (deleted, notFound) = _service.BulkDelete(new List<long> { 0, -1, 2 });

            Assert.Single(deleted);
        }

        [Fact]
        public async Task AutoMatchBatchAfterImportAsync_ServiceAvailable_ReturnsResult()
        {
            var expected = new AutoMatchBatchResult { SuccessfulMatches = 5 };
            _mockMatch.Setup(x => x.AutoMatchBatchAsync(1, 10, 70m)).ReturnsAsync(expected);

            var result = await _service.AutoMatchBatchAfterImportAsync(1, 10);

            Assert.Same(expected, result);
        }

        [Fact]
        public async Task AutoMatchBatchAfterImportAsync_ServiceNull_ReturnsNull()
        {
            var serviceNoMatch = new TransactionService(_mockDb.Object);

            var result = await serviceNoMatch.AutoMatchBatchAfterImportAsync(1, 10);

            Assert.Null(result);
        }
    }
}
