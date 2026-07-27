using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.UploadProcessing;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.UploadProcessing
{
    public class UploadJobNotificationServiceTests
    {
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly Mock<IActivityLogService> _mockActivityLog;
        private readonly UploadJobNotificationService _service;

        public UploadJobNotificationServiceTests()
        {
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _mockActivityLog = new Mock<IActivityLogService>();
            _service = new UploadJobNotificationService(_mockRealtime.Object, _mockActivityLog.Object);
        }

        [Fact]
        public async Task NotifyUploadJobUpdatedAsync_JobNotFound_DoesNothing()
        {
            var mockJobSvc = new Mock<IUploadJobService>();
            mockJobSvc.Setup(x => x.GetById(1)).Returns((UploadJobRow?)null);

            await _service.NotifyUploadJobUpdatedAsync(mockJobSvc.Object, 1);

            _mockRealtime.Verify(x => x.NotifyUploadJobUpdatedAsync(It.IsAny<UploadJobRow>()), Times.Never);
        }

        [Fact]
        public async Task NotifyUploadJobUpdatedAsync_Completed_CreatesNotification()
        {
            var job = new UploadJobRow
            {
                Id = 1, UserId = 10, CompanyId = 5,
                Status = "completed", JobType = "invoice_upload_pdf",
                FileOriginalName = "test.pdf"
            };
            var mockJobSvc = new Mock<IUploadJobService>();
            mockJobSvc.Setup(x => x.GetById(1)).Returns(job);

            await _service.NotifyUploadJobUpdatedAsync(mockJobSvc.Object, 1);

            _mockRealtime.Verify(x => x.NotifyUploadJobUpdatedAsync(job), Times.Once);
            _mockRealtime.Verify(x => x.CreateUserNotificationAsync(10,
                It.Is<NotificationMessage>(m => m.EventType == NotificationEventTypes.UploadCompleted),
                It.IsAny<object>(), It.IsAny<long?>()), Times.Once);
        }

        [Fact]
        public async Task NotifyUploadJobUpdatedAsync_Failed_CreatesNotification()
        {
            var job = new UploadJobRow
            {
                Id = 1, UserId = 10, CompanyId = 5,
                Status = "failed", JobType = "transaction_upload_excel",
                FileOriginalName = "data.xlsx"
            };
            var mockJobSvc = new Mock<IUploadJobService>();
            mockJobSvc.Setup(x => x.GetById(1)).Returns(job);

            await _service.NotifyUploadJobUpdatedAsync(mockJobSvc.Object, 1);

            _mockRealtime.Verify(x => x.CreateUserNotificationAsync(10,
                It.Is<NotificationMessage>(m => m.EventType == NotificationEventTypes.UploadFailed),
                It.IsAny<object>(), It.IsAny<long?>()), Times.Once);
        }

        [Fact]
        public async Task NotifyDuplicateInvoiceAnomalyAsync_NoAnomalyFound_DoesNothing()
        {
            var mockAnomalySvc = new Mock<IAnomalyService>();
            mockAnomalySvc.Setup(x => x.GetByCompany(5, "open", null, "duplicate"))
                .Returns(new List<AnomalyRow>());

            await _service.NotifyDuplicateInvoiceAnomalyAsync(mockAnomalySvc.Object, 5, 10);

            _mockRealtime.Verify(x => x.CreateCompanyNotificationAsync(
                It.IsAny<long>(), It.IsAny<NotificationMessage>(), It.IsAny<object>(),
                It.IsAny<long?>(), It.IsAny<long?>()), Times.Never);
        }

        [Fact]
        public async Task NotifyDuplicateInvoiceAnomalyAsync_AnomalyFound_CreatesNotification()
        {
            var anomalies = new List<AnomalyRow>
            {
                new() { Id = 1, RelatedInvoiceId = 10, Description = "Duplicate detected" }
            };
            var mockAnomalySvc = new Mock<IAnomalyService>();
            mockAnomalySvc.Setup(x => x.GetByCompany(5, "open", null, "duplicate"))
                .Returns(anomalies);

            await _service.NotifyDuplicateInvoiceAnomalyAsync(mockAnomalySvc.Object, 5, 10);

            _mockRealtime.Verify(x => x.CreateCompanyNotificationAsync(5,
                It.Is<NotificationMessage>(m => m.EventType == NotificationEventTypes.AnomalyCreated
                    && m.TargetId == "1"),
                It.IsAny<object>(), null, null), Times.Once);
        }

        [Fact]
        public void LogUploadJobFailure_LogsSystemWarning()
        {
            var job = new UploadJobRow { Id = 1, JobType = "test", CompanyId = 5, UserId = 10, FileOriginalName = "f.pdf" };

            _service.LogUploadJobFailure(job, "Job failed", "Timeout", "WARN");

            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Level == "WARN" && r.Category == "jobs")), Times.Once);
        }

        [Fact]
        public void LogUploadJobFailure_DefaultLevel_Warn()
        {
            var job = new UploadJobRow { Id = 1, JobType = "test", CompanyId = 5, UserId = 10 };

            _service.LogUploadJobFailure(job, "Job failed", "Error");

            _mockActivityLog.Verify(x => x.LogSystem(It.Is<CreateSystemLogRequest>(
                r => r.Level == "WARN")), Times.Once);
        }

        // ── Static TryGetInvoiceId ────────────────────────────────────────────

        [Fact]
        public void TryGetInvoiceId_NullJson_ReturnsNull()
        {
            Assert.Null(UploadJobNotificationService.TryGetInvoiceId(null));
        }

        [Fact]
        public void TryGetInvoiceId_EmptyJson_ReturnsNull()
        {
            Assert.Null(UploadJobNotificationService.TryGetInvoiceId(""));
        }

        [Fact]
        public void TryGetInvoiceId_InvalidJson_ReturnsNull()
        {
            Assert.Null(UploadJobNotificationService.TryGetInvoiceId("{not valid}"));
        }

        [Fact]
        public void TryGetInvoiceId_WithInvoiceId_ReturnsValue()
        {
            var result = UploadJobNotificationService.TryGetInvoiceId(@"{""invoiceId"": 42}");
            Assert.Equal(42, result);
        }

        [Fact]
        public void TryGetInvoiceId_WithoutInvoiceId_ReturnsNull()
        {
            var result = UploadJobNotificationService.TryGetInvoiceId(@"{""status"": ""ok""}");
            Assert.Null(result);
        }
    }
}