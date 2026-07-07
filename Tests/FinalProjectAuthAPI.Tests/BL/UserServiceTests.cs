using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class UserServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly UserService _service;

        public UserServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _service = new UserService(_mockDb.Object);
        }

        [Fact]
        public void GetById_ReturnsUser()
        {
            var user = new User { Id = 1, Name = "John", Email = "john@test.com" };
            _mockDb.Setup(x => x.GetUserById(1)).Returns(user);

            var result = _service.GetById(1);

            Assert.Same(user, result);
        }

        [Fact]
        public void GetById_ReturnsNull_WhenNotFound()
        {
            _mockDb.Setup(x => x.GetUserById(99)).Returns((User?)null);

            Assert.Null(_service.GetById(99));
        }

        [Fact]
        public void GetAll_ReturnsUsers()
        {
            var users = new List<User> { new() { Id = 1 }, new() { Id = 2 } };
            _mockDb.Setup(x => x.GetAllUsers()).Returns(users);

            var result = _service.GetAll();

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public void GetAll_ReturnsEmptyList()
        {
            _mockDb.Setup(x => x.GetAllUsers()).Returns(new List<User>());

            var result = _service.GetAll();

            Assert.Empty(result);
        }

        [Fact]
        public void Update_ValidFields_ReturnsTrue()
        {
            _mockDb.Setup(x => x.UpdateUser(1, "John", "555-0100", null)).Returns(true);

            var result = _service.Update(1, "John", "555-0100", null);

            Assert.True(result);
        }

        [Fact]
        public void Update_WhitespaceName_ReturnsFalse()
        {
            var result = _service.Update(1, "   ", "555-0100", null);

            Assert.False(result);
            _mockDb.Verify(x => x.UpdateUser(It.IsAny<long>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public void Update_NullName_Proceeds()
        {
            _mockDb.Setup(x => x.UpdateUser(1, null, null, null)).Returns(true);

            var result = _service.Update(1, null, null, null);

            Assert.True(result);
        }

        [Fact]
        public void ChangePassword_ValidCurrent_ReturnsTrue()
        {
            var password = "test123";
            var hash = User.HashPassword(password);
            _mockDb.Setup(x => x.GetPasswordHash(1)).Returns(hash);
            _mockDb.Setup(x => x.ChangePassword(1, It.IsAny<string>())).Returns(true);

            var result = _service.ChangePassword(1, password, "new456");

            Assert.True(result);
        }

        [Fact]
        public void ChangePassword_WrongCurrent_ReturnsFalse()
        {
            _mockDb.Setup(x => x.GetPasswordHash(1)).Returns(User.HashPassword("correct"));

            var result = _service.ChangePassword(1, "wrong", "new456");

            Assert.False(result);
            _mockDb.Verify(x => x.ChangePassword(It.IsAny<long>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public void ChangePassword_UserNotFound_ReturnsFalse()
        {
            _mockDb.Setup(x => x.GetPasswordHash(99)).Returns((string?)null);

            var result = _service.ChangePassword(99, "pass", "new456");

            Assert.False(result);
        }

        [Fact]
        public void UpdateVisibility_ReturnsTrue()
        {
            _mockDb.Setup(x => x.UpdateUserVisibility(1, true)).Returns(true);

            Assert.True(_service.UpdateVisibility(1, true));
        }

        [Fact]
        public void UpdateVisibility_ReturnsFalse()
        {
            _mockDb.Setup(x => x.UpdateUserVisibility(1, false)).Returns(false);

            Assert.False(_service.UpdateVisibility(1, false));
        }

        [Fact]
        public void VerifyPassword_Correct_ReturnsTrue()
        {
            var password = "test123";
            _mockDb.Setup(x => x.GetPasswordHash(1)).Returns(User.HashPassword(password));

            Assert.True(_service.VerifyPassword(1, password));
        }

        [Fact]
        public void VerifyPassword_Wrong_ReturnsFalse()
        {
            _mockDb.Setup(x => x.GetPasswordHash(1)).Returns(User.HashPassword("correct"));

            Assert.False(_service.VerifyPassword(1, "wrong"));
        }

        [Fact]
        public void VerifyPassword_UserNotFound_ReturnsFalse()
        {
            _mockDb.Setup(x => x.GetPasswordHash(99)).Returns((string?)null);

            Assert.False(_service.VerifyPassword(99, "pass"));
        }

        [Fact]
        public void DeleteUserAccount_ReturnsTrue()
        {
            _mockDb.Setup(x => x.DeleteUserAccount(1)).Returns(true);

            Assert.True(_service.DeleteUserAccount(1));
        }

        [Fact]
        public void DeleteUserAccount_ReturnsFalse()
        {
            _mockDb.Setup(x => x.DeleteUserAccount(1)).Returns(false);

            Assert.False(_service.DeleteUserAccount(1));
        }
    }
}
