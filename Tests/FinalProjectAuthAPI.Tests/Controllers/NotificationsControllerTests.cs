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
    public class NotificationsControllerTests
    {
        private readonly Mock<INotificationService> _mockSvc;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly Mock<IDBservices> _mockDb;
        private readonly NotificationsController _controller;

        public NotificationsControllerTests()
        {
            _mockSvc = new Mock<INotificationService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _mockDb = new Mock<IDBservices>();
            _controller = new NotificationsController(_mockSvc.Object, _mockRealtime.Object, _mockDb.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "3"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetMine_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetInbox(3, NotificationViews.Combined, null, null, 50))
                .Returns(new NotificationInboxResult());

            var result = _controller.GetMine(50);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetInbox_Combined_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetInbox(3, NotificationViews.Combined, null, null, 25))
                .Returns(new NotificationInboxResult());

            var result = _controller.GetInbox(NotificationViews.Combined, null, null, 25);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetInbox_Company_NoCompanyId_ReturnsBadRequest()
        {
            var result = _controller.GetInbox(NotificationViews.Company, null, null, 25);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void GetInbox_Company_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(3, 5)).Returns(false);

            var result = _controller.GetInbox(NotificationViews.Company, 5, null, 25);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void GetInbox_Company_ReturnsOk()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(3, 5)).Returns(true);
            _mockSvc.Setup(x => x.GetInbox(3, NotificationViews.Company, 5, null, 25))
                .Returns(new NotificationInboxResult());

            var result = _controller.GetInbox(NotificationViews.Company, 5, null, 25);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task MarkRead_Found_ReturnsOk()
        {
            _mockDb.Setup(x => x.GetNotificationById(1, 3)).Returns(new NotificationRow
            {
                Id = 1,
                IsRead = false
            });
            _mockSvc.Setup(x => x.GetUnreadCounts(3, null, NotificationViews.Combined))
                .Returns(new NotificationUnreadCounts());
            _mockRealtime.Setup(x => x.NotifyReadStateChangedAsync(3, It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.MarkRead(1, null, NotificationViews.Combined);

            Assert.IsType<OkObjectResult>(result);
            _mockSvc.Verify(x => x.MarkRead(1, 3), Times.Once);
        }

        [Fact]
        public async Task MarkRead_NotFound_ReturnsNotFound()
        {
            _mockDb.Setup(x => x.GetNotificationById(99, 3)).Returns((NotificationRow?)null);

            var result = await _controller.MarkRead(99, null, NotificationViews.Combined);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task MarkRead_AlreadyRead_SkipsMarkRead()
        {
            _mockDb.Setup(x => x.GetNotificationById(1, 3)).Returns(new NotificationRow
            {
                Id = 1,
                IsRead = true
            });
            _mockSvc.Setup(x => x.GetUnreadCounts(3, null, NotificationViews.Combined))
                .Returns(new NotificationUnreadCounts());
            _mockRealtime.Setup(x => x.NotifyReadStateChangedAsync(3, It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.MarkRead(1, null, NotificationViews.Combined);

            Assert.IsType<OkObjectResult>(result);
            _mockSvc.Verify(x => x.MarkRead(It.IsAny<long>(), It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public async Task MarkAllRead_Combined_ReturnsOk()
        {
            _mockSvc.Setup(x => x.MarkAllRead(3, NotificationViews.Combined, null)).Returns(5);
            _mockSvc.Setup(x => x.GetUnreadCounts(3, null, NotificationViews.Combined))
                .Returns(new NotificationUnreadCounts());
            _mockRealtime.Setup(x => x.NotifyReadStateChangedAsync(3, It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.MarkAllRead(NotificationViews.Combined, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task MarkAllRead_Company_NoCompanyId_ReturnsBadRequest()
        {
            var result = await _controller.MarkAllRead(NotificationViews.Company, null);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task MarkAllRead_Company_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(3, 5)).Returns(false);

            var result = await _controller.MarkAllRead(NotificationViews.Company, 5);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task MarkAllRead_Company_ReturnsOk()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(3, 5)).Returns(true);
            _mockSvc.Setup(x => x.MarkAllRead(3, NotificationViews.Company, 5)).Returns(3);
            _mockSvc.Setup(x => x.GetUnreadCounts(3, 5, NotificationViews.Company))
                .Returns(new NotificationUnreadCounts());
            _mockRealtime.Setup(x => x.NotifyReadStateChangedAsync(3, It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.MarkAllRead(NotificationViews.Company, 5);

            Assert.IsType<OkObjectResult>(result);
        }
    }
}
