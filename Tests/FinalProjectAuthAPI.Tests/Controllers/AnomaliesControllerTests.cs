using System.Security.Claims;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class AnomaliesControllerTests
    {
        private readonly Mock<IAnomalyService> _mockSvc;
        private readonly Mock<DBservices> _mockDb;
        private readonly Mock<IFileStorageService> _mockFile;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly AnomaliesController _controller;

        public AnomaliesControllerTests()
        {
            _mockSvc = new Mock<IAnomalyService>();
            _mockDb = new Mock<DBservices>();
            _mockFile = new Mock<IFileStorageService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _controller = new AnomaliesController(_mockSvc.Object, _mockDb.Object, _mockFile.Object, _mockRealtime.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "1"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetByCompany_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetByCompany(5, null, null, null)).Returns(new List<AnomalyRow>());

            var result = _controller.GetByCompany(5, null, null, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new AnomalyRow { Id = 1 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((AnomalyRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void GetStats_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetStats(5)).Returns(new AnomalyStatsRow());

            var result = _controller.GetStats(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Create_Valid_Returns201()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateAnomalyRequest>()))
                .Returns((true, 10L, ""));
            _mockRealtime.Setup(x => x.CreateCompanyNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.Create(new CreateAnomalyRequest
            {
                CompanyId = 5,
                AnomalyType = "duplicate",
                Severity = "high",
                Title = "Test"
            });

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(10L, created.RouteValues!["id"]);
        }

        [Fact]
        public async Task Create_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateAnomalyRequest>()))
                .Returns((false, 0L, "error"));

            var result = await _controller.Create(new CreateAnomalyRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Resolve_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Resolve(1, 1, It.IsAny<ResolveAnomalyRequest>()))
                .Returns((true, ""));
            _mockSvc.Setup(x => x.GetById(1)).Returns(new AnomalyRow
            {
                Id = 1,
                CompanyId = 5,
                Title = "Test anomaly"
            });

            var result = await _controller.Resolve(1, new ResolveAnomalyRequest());

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Resolve_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Resolve(1, 1, It.IsAny<ResolveAnomalyRequest>()))
                .Returns((false, "not found"));

            var result = await _controller.Resolve(1, new ResolveAnomalyRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
