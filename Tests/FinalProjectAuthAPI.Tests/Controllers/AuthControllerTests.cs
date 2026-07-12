using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _mockAuth;
        private readonly Mock<IActivityLogService> _mockActivityLog;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _mockAuth = new Mock<IAuthService>();
            _mockActivityLog = new Mock<IActivityLogService>();
            _controller = new AuthController(_mockAuth.Object, _mockActivityLog.Object);

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["X-Forwarded-For"] = "127.0.0.1";
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }

        [Fact]
        public void Login_ValidCredentials_ReturnsOk()
        {
            _mockAuth.Setup(x => x.LogIn("test@test.com", "password"))
                .Returns(("jwt_token", 1, "John", "test@test.com", "business_owner"));

            var result = _controller.Login(new LoginRequest { Email = "test@test.com", Password = "password" });

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void Login_InvalidCredentials_ReturnsUnauthorized()
        {
            _mockAuth.Setup(x => x.LogIn("bad@test.com", "wrong"))
                .Returns(((string?)null, 0L, "", "", ""));

            var result = _controller.Login(new LoginRequest { Email = "bad@test.com", Password = "wrong" });

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public void Register_ValidRequest_Returns201()
        {
            _mockAuth.Setup(x => x.Register("John", "john@test.com", "password123", "business_owner"))
                .Returns((true, 1, ""));

            var result = _controller.Register(new RegisterRequest
            {
                Name = "John",
                Email = "john@test.com",
                Password = "password123",
                Role = "business_owner"
            });

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(201, statusResult.StatusCode);
        }

        [Fact]
        public void Register_InvalidRole_ReturnsBadRequest()
        {
            var result = _controller.Register(new RegisterRequest
            {
                Name = "John",
                Email = "john@test.com",
                Password = "password123",
                Role = "accountant_business_owner"
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Register_DuplicateUser_ReturnsBadRequest()
        {
            _mockAuth.Setup(x => x.Register("John", "existing@test.com", "password123", "business_owner"))
                .Returns((false, 0, "A user with this email may already exist."));

            var result = _controller.Register(new RegisterRequest
            {
                Name = "John",
                Email = "existing@test.com",
                Password = "password123",
                Role = "business_owner"
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Validate_MissingHeader_ReturnsUnauthorized()
        {
            var result = _controller.Validate(null);
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public void Validate_InvalidHeader_ReturnsUnauthorized()
        {
            var result = _controller.Validate("InvalidHeader");
            Assert.IsType<UnauthorizedObjectResult>(result);
        }
    }
}
