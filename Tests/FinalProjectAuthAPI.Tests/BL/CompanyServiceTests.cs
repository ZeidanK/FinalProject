using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class CompanyServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly CompanyService _service;

        public CompanyServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _service = new CompanyService(_mockDb.Object);
        }

        [Fact]
        public void GetAll_ReturnsCompanies()
        {
            var companies = new List<CompanyRow> { new() { Id = 1, Name = "Acme" } };
            _mockDb.Setup(x => x.GetAllCompanies()).Returns(companies);

            var result = _service.GetAll();

            Assert.Same(companies, result);
        }

        [Fact]
        public void GetById_ReturnsCompany()
        {
            var company = new CompanyRow { Id = 1 };
            _mockDb.Setup(x => x.GetCompanyById(1)).Returns(company);

            var result = _service.GetById(1);

            Assert.Same(company, result);
        }

        [Fact]
        public void GetById_ReturnsNull_WhenNotFound()
        {
            _mockDb.Setup(x => x.GetCompanyById(99)).Returns((CompanyRow?)null);

            Assert.Null(_service.GetById(99));
        }

        [Fact]
        public void GetByUserId_ReturnsCompanies()
        {
            var companies = new List<CompanyRow> { new() { Id = 2 } };
            _mockDb.Setup(x => x.GetCompaniesByUserId(10)).Returns(companies);

            var result = _service.GetByUserId(10);

            Assert.Same(companies, result);
        }

        [Fact]
        public void Create_Valid_ReturnsSuccess()
        {
            _mockDb.Setup(x => x.CreateCompany("Acme", 1, null, null, null, null, null, "USA",
                null, null, null, null, null, null, "USD")).Returns(42);

            var (success, id, error) = _service.Create("Acme", 1);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.Empty(error);
        }

        [Fact]
        public void Create_WhitespaceName_ReturnsFailure()
        {
            var (success, id, error) = _service.Create("   ", 1);

            Assert.False(success);
            Assert.Contains("required", error);
            _mockDb.Verify(x => x.CreateCompany(It.IsAny<string>(), It.IsAny<long>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(),
                It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void Create_DbReturnsZero_ReturnsFailure()
        {
            _mockDb.Setup(x => x.CreateCompany(It.IsAny<string>(), It.IsAny<long>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(),
                It.IsAny<string>())).Returns(0);

            var (success, id, error) = _service.Create("Acme", 1);

            Assert.False(success);
            Assert.Equal(0, id);
        }

        [Fact]
        public void Create_DbException_ReturnsFailure()
        {
            _mockDb.Setup(x => x.CreateCompany(It.IsAny<string>(), It.IsAny<long>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(),
                It.IsAny<string>())).Throws(new InvalidOperationException("DB error"));

            var (success, id, error) = _service.Create("Acme", 1);

            Assert.False(success);
            Assert.Equal(0, id);
        }

        [Fact]
        public void Update_ReturnsTrue()
        {
            _mockDb.Setup(x => x.UpdateCompany(1, "NewName", null, null, null, null, null,
                null, null, null, null, null, null)).Returns(true);

            Assert.True(_service.Update(1, "NewName", null, null, null, null, null,
                null, null, null, null, null, null));
        }

        [Fact]
        public void Update_ReturnsFalse()
        {
            _mockDb.Setup(x => x.UpdateCompany(It.IsAny<long>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<bool?>())).Returns(false);

            Assert.False(_service.Update(1, "NewName", null, null, null, null, null,
                null, null, null, null, null, null));
        }

        [Fact]
        public void EnsureUserHasFullCompanyAccess_ReturnsTrue()
        {
            _mockDb.Setup(x => x.EnsureUserHasFullCompanyAccess(5, 10)).Returns(true);

            Assert.True(_service.EnsureUserHasFullCompanyAccess(5, 10));
        }

        [Fact]
        public void Delete_CallsUpdateWithIsActiveFalse()
        {
            _mockDb.Setup(x => x.UpdateCompany(1, null, null, null, null, null, null,
                null, null, null, null, null, false)).Returns(true);

            Assert.True(_service.Delete(1));
        }
    }
}
