using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class BankAccountsControllerTests
    {
        private readonly Mock<IBankAccountService> _mockSvc;
        private readonly BankAccountsController _controller;

        public BankAccountsControllerTests()
        {
            _mockSvc = new Mock<IBankAccountService>();
            _controller = new BankAccountsController(_mockSvc.Object);
        }

        [Fact]
        public void GetByCompany_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetByCompany(5)).Returns(new List<BankAccountRow>());

            var result = _controller.GetByCompany(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new BankAccountRow { Id = 1 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((BankAccountRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Create_Valid_Returns201()
        {
            _mockSvc.Setup(x => x.Create(1, "Bank", "checking", 10,
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<decimal>()))
                .Returns((true, 5L, ""));

            var result = _controller.Create(new CreateBankAccountRequest
            {
                CompanyId = 1, BankName = "Bank", AccountType = "checking", CreatedByUserId = 10
            });

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(5L, created.RouteValues!["id"]);
        }

        [Fact]
        public void Create_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Create(1, "Bank", "checking", 10,
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<decimal>()))
                .Returns((false, 0L, "error"));

            var result = _controller.Create(new CreateBankAccountRequest
            {
                CompanyId = 1, BankName = "Bank", AccountType = "checking", CreatedByUserId = 10
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Update_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Update(1, "NewBank",
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<bool?>(), It.IsAny<decimal?>(),
                It.IsAny<DateTime?>()))
                .Returns(true);

            var result = _controller.Update(1, new UpdateBankAccountRequest { BankName = "NewBank" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Update_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.Update(1, "NewBank",
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<bool?>(), It.IsAny<decimal?>(),
                It.IsAny<DateTime?>()))
                .Returns(false);

            var result = _controller.Update(1, new UpdateBankAccountRequest { BankName = "NewBank" });

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Delete_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Delete(1)).Returns(true);

            var result = _controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.Delete(99)).Returns(false);

            var result = _controller.Delete(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
