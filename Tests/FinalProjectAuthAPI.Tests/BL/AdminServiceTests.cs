using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class AdminServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly AdminService _service;

        public AdminServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _service = new AdminService(_mockDb.Object);
        }

        [Fact]
        public void GetStats_ReturnsStats()
        {
            var stats = new AdminStatsRow { TotalUsers = 10, ActiveUsers = 8 };
            _mockDb.Setup(x => x.GetAdminStats()).Returns(stats);

            Assert.Same(stats, _service.GetStats());
        }

        [Fact]
        public void GetUsers_DefaultParams_ReturnsUsers()
        {
            var result = new PagedResult<AdminUserRow>();
            _mockDb.Setup(x => x.GetAdminUsers(1, 20, null, null)).Returns(result);

            Assert.Same(result, _service.GetUsers());
        }

        [Fact]
        public void GetUsers_ClampsPageAndLimit()
        {
            var result = new PagedResult<AdminUserRow>();
            _mockDb.Setup(x => x.GetAdminUsers(1, 100, "admin", null)).Returns(result);

            var actual = _service.GetUsers(-1, 999, "admin", null);

            Assert.Same(result, actual);
        }

        [Fact]
        public void GetUsers_ClampsMinimumLimit()
        {
            var result = new PagedResult<AdminUserRow>();
            _mockDb.Setup(x => x.GetAdminUsers(1, 1, null, null)).Returns(result);

            var actual = _service.GetUsers(1, -5, null, null);

            Assert.Same(result, actual);
        }

        [Fact]
        public void ToggleUserBan_ReturnsResult()
        {
            _mockDb.Setup(x => x.ToggleUserBan(5)).Returns((5, true));

            var (id, isBanned) = _service.ToggleUserBan(5);

            Assert.Equal(5, id);
            Assert.True(isBanned);
        }

        [Fact]
        public void GetLogs_DefaultParams_ReturnsLogs()
        {
            var result = new PagedResult<SystemLogRow>();
            _mockDb.Setup(x => x.GetSystemLogs(1, 50, null, null)).Returns(result);

            Assert.Same(result, _service.GetLogs());
        }

        [Fact]
        public void GetLogs_ClampsLimit()
        {
            var result = new PagedResult<SystemLogRow>();
            _mockDb.Setup(x => x.GetSystemLogs(1, 200, "error", null)).Returns(result);

            var actual = _service.GetLogs(1, 999, "error", null);

            Assert.Same(result, actual);
        }

        [Fact]
        public void GetLogs_ClampsMinimum()
        {
            var result = new PagedResult<SystemLogRow>();
            _mockDb.Setup(x => x.GetSystemLogs(1, 1, null, null)).Returns(result);

            var actual = _service.GetLogs(-1, -1, null, null);

            Assert.Same(result, actual);
        }

        [Fact]
        public void GetAuditLogs_DefaultParams()
        {
            var result = new PagedResult<AuditLogRow>();
            _mockDb.Setup(x => x.GetAuditLogs(1, 50, null)).Returns(result);

            Assert.Same(result, _service.GetAuditLogs());
        }

        [Fact]
        public void GetAuditLogs_ClampsLimit()
        {
            var result = new PagedResult<AuditLogRow>();
            _mockDb.Setup(x => x.GetAuditLogs(2, 200, 5L)).Returns(result);

            var actual = _service.GetAuditLogs(2, 999, 5);

            Assert.Same(result, actual);
        }

        [Fact]
        public void ClearSystemLogs_ReturnsCount()
        {
            _mockDb.Setup(x => x.ClearSystemLogs()).Returns(42);

            Assert.Equal(42, _service.ClearSystemLogs());
        }

        [Fact]
        public void ClearAuditLogs_ReturnsCount()
        {
            _mockDb.Setup(x => x.ClearAuditLogs()).Returns(10);

            Assert.Equal(10, _service.ClearAuditLogs());
        }

        [Fact]
        public void DeleteSystemLog_ValidId_ReturnsTrue()
        {
            _mockDb.Setup(x => x.DeleteSystemLog(5)).Returns(true);

            Assert.True(_service.DeleteSystemLog(5));
        }

        [Fact]
        public void DeleteSystemLog_InvalidId_ReturnsFalse()
        {
            Assert.False(_service.DeleteSystemLog(0));
            _mockDb.Verify(x => x.DeleteSystemLog(It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public void DeleteAuditLog_ValidId_ReturnsTrue()
        {
            _mockDb.Setup(x => x.DeleteAuditLog(5)).Returns(true);

            Assert.True(_service.DeleteAuditLog(5));
        }

        [Fact]
        public void DeleteAuditLog_InvalidId_ReturnsFalse()
        {
            Assert.False(_service.DeleteAuditLog(0));
            _mockDb.Verify(x => x.DeleteAuditLog(It.IsAny<long>()), Times.Never);
        }
    }
}
