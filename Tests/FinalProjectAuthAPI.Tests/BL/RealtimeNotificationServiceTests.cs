using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using FinalProjectAuthAPI.Realtime;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class RealtimeNotificationServiceTests
    {
        private readonly Mock<IHubContext<NotificationHub>> _mockHub;
        private readonly Mock<IHubClients> _mockClients;
        private readonly Mock<IClientProxy> _mockClientProxy;
        private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;
        private readonly Mock<IGroupManager> _mockGroupManager;
        private readonly Mock<IDBservices> _mockDb;
        private readonly RealtimeConnectionRegistry _registry;
        private readonly Mock<ILogger<RealtimeNotificationService>> _mockLogger;
        private readonly Mock<IActivityLogService> _mockActivityLog;
        private readonly RealtimeNotificationService _service;

        public RealtimeNotificationServiceTests()
        {
            _mockHub = new Mock<IHubContext<NotificationHub>>();
            _mockClients = new Mock<IHubClients>();
            _mockClientProxy = new Mock<IClientProxy>();
            _mockSingleClientProxy = new Mock<ISingleClientProxy>();
            _mockGroupManager = new Mock<IGroupManager>();
            _mockDb = new Mock<IDBservices>();
            _registry = new RealtimeConnectionRegistry();
            _mockLogger = new Mock<ILogger<RealtimeNotificationService>>();
            _mockActivityLog = new Mock<IActivityLogService>();

            _mockHub.Setup(x => x.Clients).Returns(_mockClients.Object);
            _mockHub.Setup(x => x.Groups).Returns(_mockGroupManager.Object);
            _mockClients.Setup(x => x.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
            _mockClients.Setup(x => x.Client(It.IsAny<string>())).Returns(_mockSingleClientProxy.Object);
            _mockClients.As<IHubClients<IClientProxy>>()
                .Setup(x => x.Client(It.IsAny<string>()))
                .Returns(_mockClientProxy.Object);

            _service = new RealtimeNotificationService(
                _mockHub.Object, _mockDb.Object, _registry,
                _mockLogger.Object, _mockActivityLog.Object);
        }

        [Fact]
        public async Task NotifyCompanyEventAsync_Valid_CallsSendCoreAsync()
        {
            await _service.NotifyCompanyEventAsync(5, "test.event", new { msg = "hello" });

            _mockClients.Verify(x => x.Group("company_5"), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationEvent",
                It.IsAny<object?[]?>(), default), Times.Once);
        }

        [Fact]
        public async Task NotifyCompanyEventAsync_ZeroCompanyId_DoesNothing()
        {
            await _service.NotifyCompanyEventAsync(0, "test.event", new { });

            _mockClientProxy.Verify(x => x.SendCoreAsync(It.IsAny<string>(),
                It.IsAny<object?[]?>(), default), Times.Never);
        }

        [Fact]
        public async Task NotifyUserEventAsync_Valid_CallsSendCoreAsync()
        {
            await _service.NotifyUserEventAsync(10, "user.event", "payload");

            _mockClients.Verify(x => x.Group("user_10"), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationEvent",
                It.IsAny<object?[]?>(), default), Times.Once);
        }

        [Fact]
        public async Task NotifyGroupEventAsync_Valid_CallsSendCoreAsync()
        {
            await _service.NotifyGroupEventAsync("custom-group", "evt", new { });

            _mockClients.Verify(x => x.Group("custom-group"), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationEvent",
                It.IsAny<object?[]?>(), default), Times.Once);
        }

        [Fact]
        public async Task NotifyAdminsEventAsync_CallsAdminGroup()
        {
            await _service.NotifyAdminsEventAsync("admin.event", "data");

            _mockClients.Verify(x => x.Group("admins"), Times.Once);
        }

        [Fact]
        public async Task NotifyReadStateChangedAsync_CallsSendCoreAsync()
        {
            await _service.NotifyReadStateChangedAsync(7, new { read = true });

            _mockClients.Verify(x => x.Group("user_7"), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationReadStateChanged",
                It.IsAny<object?[]?>(), default), Times.Once);
        }

        [Fact]
        public async Task NotifyUploadJobUpdatedAsync_CallsSendCoreAsync()
        {
            var job = new UploadJobRow
            {
                Id = 1,
                JobType = "invoice_upload_pdf",
                Status = "completed",
                CompanyId = 5,
                UserId = 10,
                FileOriginalName = "test.pdf"
            };

            await _service.NotifyUploadJobUpdatedAsync(job);

            _mockClients.Verify(x => x.Group("user_10"), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("uploadJobUpdated",
                It.IsAny<object?[]?>(), default), Times.Once);
        }

        [Fact]
        public async Task CreateUserNotificationAsync_Valid_CreatesAndSends()
        {
            var row = new NotificationRow { Id = 99, EventType = NotificationEventTypes.UploadCompleted, UserId = 10 };
            _mockDb.Setup(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>())).Returns(99);
            _mockDb.Setup(x => x.GetNotificationById(99, 10)).Returns(row);

            await _service.CreateUserNotificationAsync(10, new NotificationMessage
            {
                EventType = NotificationEventTypes.UploadCompleted,
                Title = "Done",
                Severity = "info",
                TargetType = NotificationTargetTypes.InvoiceUploadJob,
                TargetId = "5"
            }, new { });

            _mockDb.Verify(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>()), Times.Once);
            _mockDb.Verify(x => x.GetNotificationById(99, 10), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationCreated",
                It.IsAny<object?[]?>(), default), Times.Once);
        }

        [Fact]
        public async Task CreateUserNotificationAsync_ZeroUserId_DoesNothing()
        {
            await _service.CreateUserNotificationAsync(0, new NotificationMessage(), new { });

            _mockDb.Verify(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>()), Times.Never);
        }

        [Fact]
        public async Task CreateUserNotificationAsync_ValidateFails_CaughtAndLogged()
        {
            await _service.CreateUserNotificationAsync(10, new NotificationMessage
            {
                EventType = "",
                Title = "",
                Severity = "bad"
            }, new { });

            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                l => l.Level == "WARN")), Times.AtLeastOnce);
        }

        [Fact]
        public async Task CreateUserNotificationAsync_DbReturnsZero_DoesNotSend()
        {
            _mockDb.Setup(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>())).Returns(0);

            await _service.CreateUserNotificationAsync(10, new NotificationMessage
            {
                EventType = NotificationEventTypes.UploadCompleted,
                Title = "Done",
                Severity = "info",
                TargetType = NotificationTargetTypes.InvoiceUploadJob,
                TargetId = "5"
            }, new { });

            _mockDb.Verify(x => x.GetNotificationById(It.IsAny<long>(), It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public async Task CreateCompanyNotificationAsync_Valid_CreatesAndSends()
        {
            var rows = new List<NotificationRow>
            {
                new() { Id = 10, EventType = NotificationEventTypes.AnomalyCreated, UserId = 1 },
                new() { Id = 11, EventType = NotificationEventTypes.AnomalyCreated, UserId = 2 }
            };
            _mockDb.Setup(x => x.CreateCompanyNotifications(5, It.IsAny<Guid>(),
                It.IsAny<NotificationMessage>(), null, null)).Returns(rows);

            await _service.CreateCompanyNotificationAsync(5, new NotificationMessage
            {
                EventType = NotificationEventTypes.AnomalyCreated,
                Title = "Alert",
                Severity = "warning",
                TargetType = NotificationTargetTypes.Anomaly,
                TargetId = "42"
            }, new { });

            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationCreated",
                It.IsAny<object?[]?>(), default), Times.Exactly(rows.Count));
        }

        [Fact]
        public async Task CreateCompanyNotificationAsync_ZeroCompanyId_DoesNothing()
        {
            await _service.CreateCompanyNotificationAsync(0, new NotificationMessage(), new { });

            _mockDb.Verify(x => x.CreateCompanyNotifications(It.IsAny<long>(), It.IsAny<Guid>(),
                It.IsAny<NotificationMessage>(), null, null), Times.Never);
        }

        [Fact]
        public async Task CreateCompanyNotificationAsync_ValidateFails_CaughtAndLogged()
        {
            await _service.CreateCompanyNotificationAsync(5, new NotificationMessage(), new { });

            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                l => l.Level == "WARN")), Times.AtLeastOnce);
        }

        [Fact]
        public async Task RevokeCompanyAccessAsync_RemovesFromGroups()
        {
            _registry.Register("conn1", 10);
            _registry.JoinCompany("conn1", 5);

            await _service.RevokeCompanyAccessAsync(10, 5);

            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "company_5"), Times.Once);
            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "company_5_owners"), Times.Once);
            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "company_5_accountants"), Times.Once);
        }

        [Fact]
        public async Task RevokeUserAccessAsync_RevokesAllCompaniesAndUser()
        {
            _registry.Register("conn1", 10);
            _registry.JoinCompany("conn1", 5);
            _registry.JoinCompany("conn1", 7);

            await _service.RevokeUserAccessAsync(10);

            _mockClients.As<IHubClients<IClientProxy>>()
                .Verify(x => x.Client("conn1"), Times.Once);
            _mockClientProxy.Verify(x => x.SendCoreAsync("accessRevoked",
                It.IsAny<object?[]?>(), default), Times.Once);
            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "user_10"), Times.Once);
            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "admins"), Times.Once);
            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "company_5"), Times.Once);
            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync("conn1", "company_7"), Times.Once);
        }

        [Fact]
        public async Task RevokeUserAccessAsync_NoConnections_DoesNothing()
        {
            await _service.RevokeUserAccessAsync(99);

            _mockGroupManager.Verify(x => x.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task SendFailure_LogsWarning()
        {
            _mockClientProxy.Setup(x => x.SendCoreAsync("notificationEvent",
                It.IsAny<object?[]?>(), default))
                .ThrowsAsync(new InvalidOperationException("connection lost"));

            await _service.NotifyCompanyEventAsync(5, "test.event", new { });

            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                l => l.Level == "WARN" && l.Category == "realtime")), Times.AtLeastOnce);
        }

        [Fact]
        public async Task RevokeFailure_CatchesAndLogsWarning()
        {
            _registry.Register("conn1", 10);
            _registry.JoinCompany("conn1", 5);
            _mockGroupManager.Setup(x => x.RemoveFromGroupAsync("conn1", "company_5"))
                .ThrowsAsync(new InvalidOperationException("group error"));

            await _service.RevokeCompanyAccessAsync(10, 5);

            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                l => l.Level == "WARN" && l.Category == "realtime")), Times.AtLeastOnce);
        }

        [Fact]
        public async Task CreateCompanyNotificationAsync_ExcludeUsers_Passed()
        {
            var rows = new List<NotificationRow>();
            _mockDb.Setup(x => x.CreateCompanyNotifications(5, It.IsAny<Guid>(),
                It.IsAny<NotificationMessage>(), 10, 20)).Returns(rows);

            await _service.CreateCompanyNotificationAsync(5, new NotificationMessage
            {
                EventType = NotificationEventTypes.AnomalyCreated,
                Title = "Alert",
                Severity = "warning",
                TargetType = NotificationTargetTypes.Anomaly,
                TargetId = "42"
            }, new { }, excludeUserId: 10, excludeUserId2: 20);

            _mockDb.Verify(x => x.CreateCompanyNotifications(5, It.IsAny<Guid>(),
                It.IsAny<NotificationMessage>(), 10, 20), Times.Once);
        }

        [Fact]
        public async Task CreateUserNotificationAsync_DbThrows_RetriesThenFails()
        {
            _mockDb.Setup(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>()))
                .Throws(new InvalidOperationException("DB down"));

            await _service.CreateUserNotificationAsync(10, new NotificationMessage
            {
                EventType = NotificationEventTypes.UploadCompleted,
                Title = "Done",
                Severity = "info",
                TargetType = NotificationTargetTypes.InvoiceUploadJob,
                TargetId = "5"
            }, new { });

            _mockDb.Verify(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>()),
                Times.Exactly(3));
            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                l => l.Level == "WARN")), Times.AtLeastOnce);
        }

        [Fact]
        public async Task CreateUserNotificationAsync_NotificationRowNull_DoesNotSend()
        {
            _mockDb.Setup(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>())).Returns(99);
            _mockDb.Setup(x => x.GetNotificationById(99, 10)).Returns((NotificationRow?)null);

            await _service.CreateUserNotificationAsync(10, new NotificationMessage
            {
                EventType = NotificationEventTypes.UploadCompleted,
                Title = "Done",
                Severity = "info",
                TargetType = NotificationTargetTypes.InvoiceUploadJob,
                TargetId = "5"
            }, new { });

            _mockClientProxy.Verify(x => x.SendCoreAsync("notificationCreated",
                It.IsAny<object?[]?>(), default), Times.Never);
        }
    }
}
