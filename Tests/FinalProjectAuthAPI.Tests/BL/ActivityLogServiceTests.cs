using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class ActivityLogServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly Mock<ILogger<ActivityLogService>> _mockLogger;
        private readonly ActivityLogService _service;

        public ActivityLogServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _mockLogger = new Mock<ILogger<ActivityLogService>>();
            _service = new ActivityLogService(_mockDb.Object, _mockLogger.Object);
        }

        [Fact]
        public void LogSystem_ValidRequest_WritesLog()
        {
            var req = new CreateSystemLogRequest
            {
                Level = "WARN",
                Category = "test",
                Message = "Something happened",
                IpAddress = "127.0.0.1",
                UserAgent = "test-agent",
            };

            _service.LogSystem(req);

            _mockDb.Verify(x => x.InsertSystemLog(It.Is<CreateSystemLogRequest>(
                r => r.Message == "Something happened" && r.Level == "WARN")), Times.Once);
        }

        [Fact]
        public void LogSystem_EmptyMessage_Skips()
        {
            _service.LogSystem(new CreateSystemLogRequest { Message = "  " });
            _mockDb.Verify(x => x.InsertSystemLog(It.IsAny<CreateSystemLogRequest>()), Times.Never);
        }

        [Fact]
        public void LogSystem_InvalidLevel_NormalizesToInfo()
        {
            var req = new CreateSystemLogRequest
            {
                Level = "invalid",
                Message = "test"
            };

            _service.LogSystem(req);

            _mockDb.Verify(x => x.InsertSystemLog(It.Is<CreateSystemLogRequest>(
                r => r.Level == "INFO")), Times.Once);
        }

        [Fact]
        public void LogSystem_NullLevel_NormalizesToInfo()
        {
            _service.LogSystem(new CreateSystemLogRequest { Message = "test" });
            _mockDb.Verify(x => x.InsertSystemLog(It.Is<CreateSystemLogRequest>(
                r => r.Level == "INFO")), Times.Once);
        }

        [Fact]
        public void LogSystem_LongCategory_Truncates()
        {
            var req = new CreateSystemLogRequest
            {
                Message = "test",
                Category = new string('x', 200),
            };

            _service.LogSystem(req);

            _mockDb.Verify(x => x.InsertSystemLog(It.Is<CreateSystemLogRequest>(
                r => r.Category!.Length == 100)), Times.Once);
        }

        [Fact]
        public void LogSystem_LongIpAddress_Truncates()
        {
            var req = new CreateSystemLogRequest
            {
                Message = "test",
                IpAddress = new string('x', 200),
            };

            _service.LogSystem(req);

            _mockDb.Verify(x => x.InsertSystemLog(It.Is<CreateSystemLogRequest>(
                r => r.IpAddress!.Length == 50)), Times.Once);
        }

        [Fact]
        public void LogSystem_LongUserAgent_Truncates()
        {
            var req = new CreateSystemLogRequest
            {
                Message = "test",
                UserAgent = new string('x', 1000),
            };

            _service.LogSystem(req);

            _mockDb.Verify(x => x.InsertSystemLog(It.Is<CreateSystemLogRequest>(
                r => r.UserAgent!.Length == 500)), Times.Once);
        }

        [Fact]
        public void LogSystem_DbException_CaughtAndLogged()
        {
            _mockDb.Setup(x => x.InsertSystemLog(It.IsAny<CreateSystemLogRequest>()))
                .Throws(new InvalidOperationException("DB error"));

            _service.LogSystem(new CreateSystemLogRequest { Message = "test" });

            _mockLogger.Verify(x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public void LogAudit_ValidRequest_WritesLog()
        {
            var req = new CreateAuditLogRequest
            {
                Action = "login",
                EntityType = "user",
                IpAddress = "127.0.0.1",
            };

            _service.LogAudit(req);

            _mockDb.Verify(x => x.InsertAuditLog(It.Is<CreateAuditLogRequest>(
                r => r.Action == "login")), Times.Once);
        }

        [Fact]
        public void LogAudit_EmptyAction_Skips()
        {
            _service.LogAudit(new CreateAuditLogRequest { Action = "" });
            _mockDb.Verify(x => x.InsertAuditLog(It.IsAny<CreateAuditLogRequest>()), Times.Never);
        }

        [Fact]
        public void LogAudit_LongAction_Truncates()
        {
            var req = new CreateAuditLogRequest
            {
                Action = new string('x', 200),
            };

            _service.LogAudit(req);

            _mockDb.Verify(x => x.InsertAuditLog(It.Is<CreateAuditLogRequest>(
                r => r.Action.Length == 100)), Times.Once);
        }

        [Fact]
        public void LogAudit_LongEntityType_Truncates()
        {
            var req = new CreateAuditLogRequest
            {
                Action = "login",
                EntityType = new string('x', 200),
            };

            _service.LogAudit(req);

            _mockDb.Verify(x => x.InsertAuditLog(It.Is<CreateAuditLogRequest>(
                r => r.EntityType!.Length == 100)), Times.Once);
        }

        [Fact]
        public void LogAudit_DbException_CaughtAndLogged()
        {
            _mockDb.Setup(x => x.InsertAuditLog(It.IsAny<CreateAuditLogRequest>()))
                .Throws(new InvalidOperationException("DB error"));

            _service.LogAudit(new CreateAuditLogRequest { Action = "login" });

            _mockLogger.Verify(x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }
    }
}
