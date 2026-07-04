using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class AccountantServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly AccountantService _service;

        public AccountantServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _service = new AccountantService(_mockDb.Object);
        }

        [Fact]
        public void GetPublicAccountants_Delegates()
        {
            var list = new List<AccountantInfo> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetPublicAccountants(5)).Returns(list);

            Assert.Same(list, _service.GetPublicAccountants(5));
        }

        [Fact]
        public void GetPublicAccountants_NullCompanyId_Delegates()
        {
            var list = new List<AccountantInfo> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetPublicAccountants(null)).Returns(list);

            Assert.Same(list, _service.GetPublicAccountants(null));
        }

        [Fact]
        public void SendRequest_Delegates()
        {
            _mockDb.Setup(x => x.CreatePendingAccessRequest(1, 5, 10)).Returns((true, ""));

            var (success, error) = _service.SendRequest(1, 5, 10);

            Assert.True(success);
            Assert.Empty(error);
        }

        [Fact]
        public void SendRequest_Failure_ReturnsError()
        {
            _mockDb.Setup(x => x.CreatePendingAccessRequest(99, 5, 10)).Returns((false, "Not found"));

            var (success, error) = _service.SendRequest(99, 5, 10);

            Assert.False(success);
            Assert.Equal("Not found", error);
        }

        [Fact]
        public void GetPendingRequests_Delegates()
        {
            var list = new List<AccessRequestRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetPendingRequestsByAccountant(1)).Returns(list);

            Assert.Same(list, _service.GetPendingRequests(1));
        }

        [Fact]
        public void GetActiveCompanies_Delegates()
        {
            var list = new List<CompanyRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetActiveCompaniesByAccountant(1)).Returns(list);

            Assert.Same(list, _service.GetActiveCompanies(1));
        }

        [Fact]
        public void RespondToRequest_Accept_ReturnsTrue()
        {
            _mockDb.Setup(x => x.RespondToAccessRequest(1, 10, true)).Returns(true);

            Assert.True(_service.RespondToRequest(1, 10, true));
        }

        [Fact]
        public void RespondToRequest_Reject_ReturnsFalse()
        {
            _mockDb.Setup(x => x.RespondToAccessRequest(99, 10, false)).Returns(false);

            Assert.False(_service.RespondToRequest(99, 10, false));
        }

        [Fact]
        public void DisconnectAccountant_ReturnsTrue()
        {
            _mockDb.Setup(x => x.DisconnectAccountantFromCompany(1, 5, 10)).Returns(true);

            Assert.True(_service.DisconnectAccountant(1, 5, 10));
        }

        [Fact]
        public void DisconnectAccountant_ReturnsFalse()
        {
            _mockDb.Setup(x => x.DisconnectAccountantFromCompany(99, 5, 10)).Returns(false);

            Assert.False(_service.DisconnectAccountant(99, 5, 10));
        }
    }
}
