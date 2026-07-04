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
    public class ReportsControllerTests
    {
        private readonly Mock<IReportService> _mockSvc;
        private readonly Mock<DBservices> _mockDb;
        private readonly ReportsController _controller;

        public ReportsControllerTests()
        {
            _mockSvc = new Mock<IReportService>();
            _mockDb = new Mock<DBservices>();
            _controller = new ReportsController(_mockSvc.Object, _mockDb.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "1")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetDashboard_WithAccess_ReturnsOk()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(true);
            _mockSvc.Setup(x => x.GetDashboardStats(5)).Returns(new DashboardStatsRow());

            var result = _controller.GetDashboard(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetDashboard_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(false);

            var result = _controller.GetDashboard(5);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void GetReconciliation_WithAccess_ReturnsOk()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(true);
            _mockSvc.Setup(x => x.GetReconciliationReport(5, null, null)).Returns(new ReconciliationReport());

            var result = _controller.GetReconciliation(5, null, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetReconciliation_InvalidDateRange_ReturnsBadRequest()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(true);

            var result = _controller.GetReconciliation(5, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(-1));

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void GetReconciliation_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(false);

            var result = _controller.GetReconciliation(5, null, null);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void GetPayablesAging_WithAccess_ReturnsOk()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(true);
            _mockSvc.Setup(x => x.GetPayablesAgingReport(5, It.IsAny<DateTime>())).Returns(new PayablesAgingReport());

            var result = _controller.GetPayablesAging(5, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetPayablesAging_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(1, 5)).Returns(false);

            var result = _controller.GetPayablesAging(5, null);

            Assert.IsType<ForbidResult>(result);
        }
    }
}
