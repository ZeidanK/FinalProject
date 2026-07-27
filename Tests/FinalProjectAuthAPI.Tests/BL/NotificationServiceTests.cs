using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class NotificationServiceTests
    {
        private readonly Mock<IDBservices> _mockDb;
        private readonly NotificationService _service;

        public NotificationServiceTests()
        {
            _mockDb = new Mock<IDBservices>();
            _service = new NotificationService(_mockDb.Object);
        }

        [Fact]
        public void Create_ValidRequest_ReturnsId()
        {
            var req = new CreateNotificationRequest
            {
                UserId = 1,
                EventType = "test.event",
                Title = "Test",
                Body = "Body"
            };
            _mockDb.Setup(x => x.CreateNotification(req)).Returns(42);

            var id = _service.Create(req);

            Assert.Equal(42, id);
        }

        [Fact]
        public void Create_InvalidUserId_ReturnsZero()
        {
            var req = new CreateNotificationRequest
            {
                UserId = 0,
                EventType = "test.event"
            };

            Assert.Equal(0, _service.Create(req));
            _mockDb.Verify(x => x.CreateNotification(It.IsAny<CreateNotificationRequest>()), Times.Never);
        }

        [Fact]
        public void Create_EmptyEventType_ReturnsZero()
        {
            var req = new CreateNotificationRequest
            {
                UserId = 1,
                EventType = "  "
            };

            Assert.Equal(0, _service.Create(req));
        }

        [Fact]
        public void GetInbox_ReturnsItems()
        {
            var items = new List<NotificationRow>
            {
                new() { Id = 1, CreatedAt = DateTime.UtcNow }
            };
            var dbResult = new NotificationInboxDbResult
            {
                Items = items,
                Counts = new NotificationUnreadCounts()
            };
            _mockDb.Setup(x => x.GetNotificationInbox(1, "combined", null, null, null, 26)).Returns(dbResult);

            var result = _service.GetInbox(1, "invalid_view", null, null, 25);

            Assert.Same(items, result.Items);
            Assert.Null(result.NextCursor);
        }

        [Fact]
        public void GetInbox_ExceedsTake_ProducesNextCursor()
        {
            var items = new List<NotificationRow>();
            for (int i = 0; i < 26; i++)
                items.Add(new NotificationRow { Id = i, CreatedAt = DateTime.UtcNow.AddMinutes(-i) });
            var dbResult = new NotificationInboxDbResult { Items = items, Counts = new NotificationUnreadCounts() };
            _mockDb.Setup(x => x.GetNotificationInbox(1, "personal", null, null, null, 11)).Returns(dbResult);

            var result = _service.GetInbox(1, "personal", null, null, 10);

            Assert.Equal(10, result.Items.Count);
            Assert.NotNull(result.NextCursor);
        }

        [Fact]
        public void GetInbox_NormalizesCompanyView()
        {
            var items = new List<NotificationRow>();
            var dbResult = new NotificationInboxDbResult { Items = items, Counts = new NotificationUnreadCounts() };
            _mockDb.Setup(x => x.GetNotificationInbox(1, "company", 5L, null, null, 26)).Returns(dbResult);

            var result = _service.GetInbox(1, "  COMPANY  ", 5, null, 25);

            Assert.NotNull(result);
        }

        [Fact]
        public void GetInbox_ClampsTake()
        {
            var dbResult = new NotificationInboxDbResult
            {
                Items = new List<NotificationRow>(),
                Counts = new NotificationUnreadCounts()
            };
            _mockDb.Setup(x => x.GetNotificationInbox(1, "combined", null, null, null, 101)).Returns(dbResult);

            _service.GetInbox(1, "any", null, null, 999);

            _mockDb.Verify(x => x.GetNotificationInbox(1, It.IsAny<string>(), null, null, null, 101), Times.Once);
        }

        [Fact]
        public void MarkRead_ReturnsTrue()
        {
            _mockDb.Setup(x => x.MarkNotificationRead(5, 1)).Returns(true);

            Assert.True(_service.MarkRead(5, 1));
        }

        [Fact]
        public void MarkRead_ReturnsFalse()
        {
            _mockDb.Setup(x => x.MarkNotificationRead(5, 1)).Returns(false);

            Assert.False(_service.MarkRead(5, 1));
        }

        [Fact]
        public void MarkAllRead_ReturnsCount()
        {
            _mockDb.Setup(x => x.MarkAllNotificationsRead(1, "company", 5)).Returns(3);

            var count = _service.MarkAllRead(1, "company", 5);

            Assert.Equal(3, count);
        }

        [Fact]
        public void GetUnreadCounts_ReturnsCounts()
        {
            var counts = new NotificationUnreadCounts { PersonalUnread = 2, CompanyUnread = 3 };
            _mockDb.Setup(x => x.GetNotificationUnreadCounts(1, 5, "combined")).Returns(counts);

            var result = _service.GetUnreadCounts(1, 5, "unknown");

            Assert.Equal(2, result.PersonalUnread);
            Assert.Equal(3, result.CompanyUnread);
        }

        [Fact]
        public void CleanupExpired_ClampsValues()
        {
            _mockDb.Setup(x => x.DeleteExpiredNotifications(1, 3650)).Returns(10);

            var count = _service.CleanupExpired(-5, 5000);

            Assert.Equal(10, count);
        }

        [Fact]
        public void CleanupExpired_DefaultValues_ClampsCorrectly()
        {
            _mockDb.Setup(x => x.DeleteExpiredNotifications(90, 365)).Returns(5);

            var count = _service.CleanupExpired();

            Assert.Equal(5, count);
        }
    }
}
