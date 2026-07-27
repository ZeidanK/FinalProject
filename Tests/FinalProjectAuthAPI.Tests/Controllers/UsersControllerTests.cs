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
    public class UsersControllerTests
    {
        private readonly Mock<IUserService> _mockSvc;
        private readonly Mock<IFileStorageService> _mockFile;
        private readonly UsersController _controller;

        public UsersControllerTests()
        {
            _mockSvc = new Mock<IUserService>();
            _mockFile = new Mock<IFileStorageService>();
            _controller = new UsersController(_mockSvc.Object, _mockFile.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "10"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(10)).Returns(new User { Id = 10 });

            var result = _controller.GetById(10);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((User?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Update_OwnProfile_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Update(10, "NewName", null, null)).Returns(true);

            var result = _controller.Update(10, new UpdateUserRequest { Name = "NewName" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Update_OtherUser_ReturnsForbid()
        {
            var result = _controller.Update(99, new UpdateUserRequest { Name = "Hack" });

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void ChangePassword_Own_ReturnsOk()
        {
            _mockSvc.Setup(x => x.ChangePassword(10, "old", "new")).Returns(true);

            var result = _controller.ChangePassword(10, new ChangePasswordRequest
            {
                CurrentPassword = "old", NewPassword = "new"
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void ChangePassword_OtherUser_ReturnsForbid()
        {
            var result = _controller.ChangePassword(99, new ChangePasswordRequest());

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void UpdateVisibility_OwnProfile_ReturnsOk()
        {
            _mockSvc.Setup(x => x.UpdateVisibility(10, true)).Returns(true);

            var result = _controller.UpdateVisibility(10, new UpdateVisibilityRequest { IsPublic = true });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void VerifyPassword_Correct_ReturnsOk()
        {
            _mockSvc.Setup(x => x.VerifyPassword(10, "password")).Returns(true);

            var result = _controller.VerifyPassword(new VerifyPasswordRequest { Password = "password" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void VerifyPassword_Wrong_ReturnsUnauthorized()
        {
            _mockSvc.Setup(x => x.VerifyPassword(10, "wrong")).Returns(false);

            var result = _controller.VerifyPassword(new VerifyPasswordRequest { Password = "wrong" });

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public void DeleteAccount_Own_ReturnsOk()
        {
            _mockSvc.Setup(x => x.DeleteUserAccount(10)).Returns(true);

            var result = _controller.DeleteAccount(10);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void DeleteAccount_OtherUser_ReturnsForbid()
        {
            var result = _controller.DeleteAccount(99);

            Assert.IsType<ForbidResult>(result);
        }
    }
}
