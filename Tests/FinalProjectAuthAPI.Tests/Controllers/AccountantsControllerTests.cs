using System.Security.Claims;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.Models;
using FinalProjectAuthAPI.Realtime;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class AccountantsControllerTests
    {
        private readonly Mock<IAccountantService> _mockSvc;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly AccountantsController _controller;

        public AccountantsControllerTests()
        {
            _mockSvc = new Mock<IAccountantService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _controller = new AccountantsController(_mockSvc.Object, _mockRealtime.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "2"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetPublic_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetPublicAccountants(null)).Returns(new List<AccountantInfo>());

            var result = _controller.GetPublic(null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetPublic_WithCompany_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetPublicAccountants(5)).Returns(new List<AccountantInfo>());

            var result = _controller.GetPublic(5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task SendRequest_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.SendRequest(3, 5, 2)).Returns((true, ""));
            _mockSvc.Setup(x => x.GetPendingRequests(3)).Returns(new List<AccessRequestRow>());
            _mockRealtime.Setup(x => x.CreateUserNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);
            _mockRealtime.Setup(x => x.NotifyGroupEventAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.SendRequest(3, new SendWorkRequestRequest { CompanyId = 5 });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task SendRequest_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.SendRequest(3, 5, 2)).Returns((false, "error"));

            var result = await _controller.SendRequest(3, new SendWorkRequestRequest { CompanyId = 5 });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void GetRequests_Own_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetPendingRequests(2)).Returns(new List<AccessRequestRow>());

            var result = _controller.GetRequests(2);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetRequests_Other_ReturnsForbid()
        {
            var result = _controller.GetRequests(99);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void GetCompanies_Own_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetActiveCompanies(2)).Returns(new List<CompanyRow>());

            var result = _controller.GetCompanies(2);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetCompanies_Other_ReturnsForbid()
        {
            var result = _controller.GetCompanies(99);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Respond_Accept_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetPendingRequests(2)).Returns(new List<AccessRequestRow>
            {
                new() { Id = 1, CompanyId = 5, CompanyName = "Acme", RequestedByUserId = 10 }
            });
            _mockSvc.Setup(x => x.RespondToRequest(1, 2, true)).Returns(true);
            _mockRealtime.Setup(x => x.CreateUserNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);
            _mockRealtime.Setup(x => x.CreateCompanyNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.Respond(1, new RespondToRequestRequest { Accept = true });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Respond_Decline_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetPendingRequests(2)).Returns(new List<AccessRequestRow>
            {
                new() { Id = 1, CompanyId = 5, CompanyName = "Acme", RequestedByUserId = 10 }
            });
            _mockSvc.Setup(x => x.RespondToRequest(1, 2, false)).Returns(true);
            _mockRealtime.Setup(x => x.CreateUserNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);
            _mockRealtime.Setup(x => x.CreateCompanyNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.Respond(1, new RespondToRequestRequest { Accept = false });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Respond_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.GetPendingRequests(2)).Returns(new List<AccessRequestRow>
            {
                new() { Id = 1, CompanyId = 5, RequestedByUserId = 10 }
            });
            _mockSvc.Setup(x => x.RespondToRequest(1, 2, true)).Returns(false);

            var result = await _controller.Respond(1, new RespondToRequestRequest { Accept = true });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Disconnect_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.DisconnectAccountant(3, 5, 2)).Returns(true);
            _mockRealtime.Setup(x => x.RevokeCompanyAccessAsync(3, 5)).Returns(Task.CompletedTask);
            _mockRealtime.Setup(x => x.CreateUserNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);
            _mockRealtime.Setup(x => x.CreateCompanyNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(), It.IsAny<long?>(), It.IsAny<long?>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.Disconnect(3, 5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Disconnect_NoCompanyId_ReturnsBadRequest()
        {
            var result = await _controller.Disconnect(3, 0);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Disconnect_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.DisconnectAccountant(3, 5, 2)).Returns(false);

            var result = await _controller.Disconnect(3, 5);

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
