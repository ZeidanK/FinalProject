using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class AuthServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly Mock<IConfiguration> _mockConfig;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _mockConfig = new Mock<IConfiguration>();

            var configSection = new Mock<IConfigurationSection>();
            configSection.Setup(x => x.Value).Returns("ThisIsASuperSecretKeyForJwtTokenGeneration123!");
            _mockConfig.Setup(x => x["Jwt:Key"]).Returns("ThisIsASuperSecretKeyForJwtTokenGeneration123!");
            _mockConfig.Setup(x => x["Jwt:Issuer"]).Returns("TestIssuer");
            _mockConfig.Setup(x => x["Jwt:Audience"]).Returns("TestAudience");

            _service = new AuthService(_mockDb.Object, _mockConfig.Object);
        }

        [Fact]
        public void LogIn_ValidCredentials_ReturnsToken()
        {
            var password = "test123";
            var hashedPassword = User.HashPassword(password);
            var user = new User
            {
                Id = 1,
                Name = "John Doe",
                Email = "john@test.com",
                PasswordHash = hashedPassword,
                Role = "business_owner",
                IsActive = true
            };

            _mockDb.Setup(x => x.GetUserByEmail("john@test.com")).Returns(user);

            var (token, id, name, email, role) = _service.LogIn("john@test.com", password);

            Assert.NotNull(token);
            Assert.Equal(1, id);
            Assert.Equal("John Doe", name);
            Assert.Equal("john@test.com", email);
            Assert.Equal("business_owner", role);
        }

        [Fact]
        public void LogIn_WrongPassword_ReturnsNullToken()
        {
            var user = new User
            {
                Id = 1,
                Email = "john@test.com",
                PasswordHash = User.HashPassword("correctpassword"),
                IsActive = true
            };

            _mockDb.Setup(x => x.GetUserByEmail("john@test.com")).Returns(user);

            var (token, id, _, _, _) = _service.LogIn("john@test.com", "wrongpassword");

            Assert.Null(token);
            Assert.Equal(0, id);
        }

        [Fact]
        public void LogIn_UnknownEmail_ReturnsNullToken()
        {
            _mockDb.Setup(x => x.GetUserByEmail("unknown@test.com")).Returns((User?)null);

            var (token, id, _, _, _) = _service.LogIn("unknown@test.com", "password");

            Assert.Null(token);
            Assert.Equal(0, id);
        }

        [Fact]
        public void LogIn_InactiveUser_Reactivates()
        {
            var password = "test123";
            var hashedPassword = User.HashPassword(password);
            var user = new User
            {
                Id = 1,
                Name = "John",
                Email = "john@test.com",
                PasswordHash = hashedPassword,
                Role = "business_owner",
                IsActive = false
            };

            _mockDb.Setup(x => x.GetUserByEmail("john@test.com")).Returns(user);
            _mockDb.Setup(x => x.GetUserById(1)).Returns(new User
            {
                Id = 1,
                Name = "John",
                Email = "john@test.com",
                PasswordHash = hashedPassword,
                Role = "business_owner",
                IsActive = true
            });

            var (token, id, _, _, _) = _service.LogIn("john@test.com", password);

            Assert.NotNull(token);
            Assert.Equal(1, id);
            _mockDb.Verify(x => x.ReactivateUserAccount(1), Times.Once);
        }

        [Fact]
        public void Register_NewUser_ReturnsSuccess()
        {
            _mockDb.Setup(x => x.GetUserByEmail("new@test.com")).Returns((User?)null);
            _mockDb.Setup(x => x.CreateUser(It.IsAny<User>()))
                   .Callback<User>(u => u.Id = 1)
                   .Returns(true);

            var (success, id, error) = _service.Register("New User", "new@test.com", "password123");

            Assert.True(success);
            Assert.True(id > 0);
            Assert.Empty(error);
        }

        [Fact]
        public void Register_DuplicateEmail_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetUserByEmail("existing@test.com")).Returns(new User { Id = 1 });

            var (success, id, error) = _service.Register("User", "existing@test.com", "password123");

            Assert.False(success);
            Assert.Equal(0, id);
            Assert.Contains("already exist", error);
        }

        [Fact]
        public void Register_DbFailure_ReturnsFailure()
        {
            _mockDb.Setup(x => x.GetUserByEmail("new@test.com")).Returns((User?)null);
            _mockDb.Setup(x => x.CreateUser(It.IsAny<User>())).Returns(false);

            var (success, id, error) = _service.Register("New User", "new@test.com", "password123");

            Assert.False(success);
            Assert.Contains("already exist", error);
        }
    }
}
