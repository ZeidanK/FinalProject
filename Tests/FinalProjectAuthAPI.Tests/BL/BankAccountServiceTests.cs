using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class BankAccountServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly BankAccountService _service;

        public BankAccountServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _service = new BankAccountService(_mockDb.Object);
        }

        [Fact]
        public void GetByCompany_ReturnsAccounts()
        {
            var accounts = new List<BankAccountRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetBankAccountsByCompany(5)).Returns(accounts);

            Assert.Same(accounts, _service.GetByCompany(5));
        }

        [Fact]
        public void GetById_ReturnsAccount()
        {
            var account = new BankAccountRow { Id = 1 };
            _mockDb.Setup(x => x.GetBankAccountById(1)).Returns(account);

            Assert.Same(account, _service.GetById(1));
        }

        [Fact]
        public void GetById_ReturnsNull_WhenNotFound()
        {
            _mockDb.Setup(x => x.GetBankAccountById(99)).Returns((BankAccountRow?)null);

            Assert.Null(_service.GetById(99));
        }

        [Fact]
        public void Create_Valid_ReturnsSuccess()
        {
            _mockDb.Setup(x => x.CreateBankAccount(1, "Chase", "checking", 10, null, null, "USD", 0m)).Returns(42);

            var (success, id, error) = _service.Create(1, "Chase", "checking", 10);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
        }

        [Fact]
        public void Create_EmptyBankName_ReturnsFailure()
        {
            var (success, id, error) = _service.Create(1, "  ", "checking", 10);

            Assert.False(success);
            Assert.Contains("Bank name", error);
            _mockDb.Verify(x => x.CreateBankAccount(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<long?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<decimal>()), Times.Never);
        }

        [Fact]
        public void Create_EmptyAccountType_ReturnsFailure()
        {
            var (success, id, error) = _service.Create(1, "Chase", "  ", 10);

            Assert.False(success);
            Assert.Contains("Account type", error);
        }

        [Fact]
        public void Create_DbReturnsZero_ReturnsFailure()
        {
            _mockDb.Setup(x => x.CreateBankAccount(It.IsAny<long>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<long?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string>(), It.IsAny<decimal>())).Returns(0);

            var (success, id, error) = _service.Create(1, "Chase", "checking", 10);

            Assert.False(success);
            Assert.Equal(0, id);
        }

        [Fact]
        public void Update_ReturnsTrue()
        {
            _mockDb.Setup(x => x.UpdateBankAccount(1, "Wells Fargo", null, null, null, null, null, null, null)).Returns(true);

            Assert.True(_service.Update(1, "Wells Fargo", null, null, null, null, null, null, null));
        }

        [Fact]
        public void Update_ReturnsFalse()
        {
            _mockDb.Setup(x => x.UpdateBankAccount(It.IsAny<long>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<bool?>(), It.IsAny<decimal?>(),
                It.IsAny<DateTime?>())).Returns(false);

            Assert.False(_service.Update(1, "Wells Fargo", null, null, null, null, null, null, null));
        }

        [Fact]
        public void Delete_ReturnsTrue()
        {
            _mockDb.Setup(x => x.SoftDeleteBankAccount(1)).Returns(true);

            Assert.True(_service.Delete(1));
        }

        [Fact]
        public void Delete_ReturnsFalse()
        {
            _mockDb.Setup(x => x.SoftDeleteBankAccount(1)).Returns(false);

            Assert.False(_service.Delete(1));
        }
    }
}
