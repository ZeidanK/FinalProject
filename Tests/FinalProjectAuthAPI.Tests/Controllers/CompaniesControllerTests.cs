using System.Security.Claims;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class CompaniesControllerTests
    {
        private readonly Mock<ICompanyService> _mockSvc;
        private readonly CompaniesController _controller;

        public CompaniesControllerTests()
        {
            _mockSvc = new Mock<ICompanyService>();
            _controller = new CompaniesController(_mockSvc.Object);
            _controller.ControllerContext = MakeContext(1, "business_owner");
        }

        private static ControllerContext MakeContext(long userId, string role)
        {
            var httpContext = new DefaultHttpContext();
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("id", userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "test"));
            return new ControllerContext { HttpContext = httpContext };
        }

        [Fact]
        public void GetAll_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetAll()).Returns(new List<CompanyRow>());

            var result = _controller.GetAll();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new CompanyRow { Id = 1 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((CompanyRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void GetByUser_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetByUserId(5)).Returns(new List<CompanyRow>());

            var result = _controller.GetByUser(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Create_Valid_Returns201()
        {
            _mockSvc.Setup(x => x.Create("TestCo", 1,
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(),
                It.IsAny<string>()))
                .Returns((true, 10L, ""));

            var result = _controller.Create(new CreateCompanyRequest { Name = "TestCo" });

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(10L, created.RouteValues!["id"]);
        }

        [Fact]
        public void Create_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Create("TestCo", 1,
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(),
                It.IsAny<string>()))
                .Returns((false, 0L, "Name required"));

            var result = _controller.Create(new CreateCompanyRequest { Name = "TestCo" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void GrantAccess_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.EnsureUserHasFullCompanyAccess(1, 5)).Returns(true);

            var result = _controller.GrantAccess(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GrantAccess_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.EnsureUserHasFullCompanyAccess(1, 5)).Returns(false);

            var result = _controller.GrantAccess(5);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Update_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Update(1, "NewName",
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), // street, city, state
                It.IsAny<string?>(), It.IsAny<string?>(),                      // postalCode, country
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), // email, phone, website
                It.IsAny<string?>(), It.IsAny<string?>(),                      // taxId, vatNumber
                It.IsAny<bool?>()))                                            // isActive
                .Returns(true);

            var result = _controller.Update(1, new UpdateCompanyRequest { Name = "NewName" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Update_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.Update(1, "NewName",
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), // street, city, state
                It.IsAny<string?>(), It.IsAny<string?>(),                      // postalCode, country
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), // email, phone, website
                It.IsAny<string?>(), It.IsAny<string?>(),                      // taxId, vatNumber
                It.IsAny<bool?>()))                                            // isActive
                .Returns(false);

            var result = _controller.Update(1, new UpdateCompanyRequest { Name = "NewName" });

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Delete_AsAdmin_Deletes()
        {
            _controller.ControllerContext = MakeContext(1, "admin");
            _mockSvc.Setup(x => x.Delete(5)).Returns(true);

            var result = _controller.Delete(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_NonAdminWithAccess_Deletes()
        {
            _mockSvc.Setup(x => x.GetByUserId(1)).Returns(new List<CompanyRow> { new() { Id = 5 } });
            _mockSvc.Setup(x => x.Delete(5)).Returns(true);

            var result = _controller.Delete(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_NonAdminNoAccess_ReturnsForbid()
        {
            _mockSvc.Setup(x => x.GetByUserId(1)).Returns(new List<CompanyRow>());

            var result = _controller.Delete(5);

            Assert.IsType<ForbidResult>(result);
        }
    }
}
