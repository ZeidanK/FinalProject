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
    public class AdminControllerTests
    {
        private readonly Mock<IAdminService> _mockSvc;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly AdminController _controller;

        public AdminControllerTests()
        {
            _mockSvc = new Mock<IAdminService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _controller = new AdminController(_mockSvc.Object, _mockRealtime.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "1"),
                        new Claim(ClaimTypes.Role, "admin")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetStats_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetStats()).Returns(new AdminStatsRow());

            var result = _controller.GetStats();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetUsers_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetUsers(1, 20, null, null)).Returns(new PagedResult<AdminUserRow>());

            var result = _controller.GetUsers(1, 20, null, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ToggleUserBan_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.ToggleUserBan(5)).Returns((5L, true));
            _mockRealtime.Setup(x => x.CreateUserNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>()))
                .Returns(Task.CompletedTask);
            _mockRealtime.Setup(x => x.NotifyAdminsEventAsync(
                It.IsAny<string>(), It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.ToggleUserBan(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ToggleUserBan_Self_ReturnsBadRequest()
        {
            var result = await _controller.ToggleUserBan(1);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void GetLogs_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetLogs(1, 50, null, null)).Returns(new PagedResult<SystemLogRow>());

            var result = _controller.GetLogs(1, 50, null, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void ClearLogs_ReturnsOk()
        {
            _mockSvc.Setup(x => x.ClearSystemLogs()).Returns(5);

            var result = _controller.ClearLogs();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void DeleteLog_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.DeleteSystemLog(1)).Returns(true);

            var result = _controller.DeleteLog(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void DeleteLog_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.DeleteSystemLog(99)).Returns(false);

            var result = _controller.DeleteLog(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void GetAuditLogs_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetAuditLogs(1, 50, null)).Returns(new PagedResult<AuditLogRow>());

            var result = _controller.GetAuditLogs(1, 50, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void ClearAuditLogs_ReturnsOk()
        {
            _mockSvc.Setup(x => x.ClearAuditLogs()).Returns(3);

            var result = _controller.ClearAuditLogs();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void DeleteAuditLog_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.DeleteAuditLog(1)).Returns(true);

            var result = _controller.DeleteAuditLog(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void DeleteAuditLog_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.DeleteAuditLog(99)).Returns(false);

            var result = _controller.DeleteAuditLog(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
