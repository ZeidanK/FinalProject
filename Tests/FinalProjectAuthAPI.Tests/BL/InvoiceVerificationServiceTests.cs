using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.InvoiceVerification;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class InvoiceVerificationServiceTests
    {
        private readonly Mock<IInvoiceService> _mockInvoiceSvc;
        private readonly Mock<IUploadJobService> _mockJobSvc;
        private readonly Mock<IAnomalyService> _mockAnomalySvc;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IVerifiedHybridAuditWriter> _mockVerifiedHybridAuditWriter;
        private readonly InvoiceVerificationService _service;

        public InvoiceVerificationServiceTests()
        {
            _mockInvoiceSvc = new Mock<IInvoiceService>();
            _mockJobSvc = new Mock<IUploadJobService>();
            _mockAnomalySvc = new Mock<IAnomalyService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _mockDb = new Mock<IDBservices>();
            _mockVerifiedHybridAuditWriter = new Mock<IVerifiedHybridAuditWriter>();
            _service = new InvoiceVerificationService(
                _mockInvoiceSvc.Object, _mockJobSvc.Object,
                _mockAnomalySvc.Object, _mockRealtime.Object, _mockDb.Object,
                _mockVerifiedHybridAuditWriter.Object);
        }

        private static string BuildStoredPayloadJson(long? invoiceId = null, bool isDuplicate = false, decimal? confidence = 0.95m)
        {
            var data = confidence.HasValue
                ? $@",""extractedData"":{{""vendorName"":""Acme"",""invoiceNumber"":""INV-001"",""totalAmount"":1000,""invoiceDate"":""2026-06-01"",""currency"":""USD"",""extractionConfidence"":{confidence}}}"
                : @",""extractedData"":null";
            return $@"{{""invoiceId"":{invoiceId?.ToString() ?? "null"},""isDuplicate"":{isDuplicate.ToString().ToLower()}{data}}}";
        }

        private static UploadJobRow MakeJob(long id = 1, string status = "completed", string? resultJson = null) => new()
        {
            Id = id,
            CompanyId = 5,
            UserId = 10,
            JobType = "invoice_upload_pdf",
            Status = status,
            FileOriginalName = "invoice.pdf",
            FilePath = "/uploads/test.pdf",
            FileType = "application/pdf",
            FileSize = 1024,
            ResultJson = resultJson ?? BuildStoredPayloadJson(),
        };

        [Fact]
        public async Task VerifyJobAsync_JobNotFound_ReturnsUnavailable()
        {
            _mockJobSvc.Setup(x => x.GetById(99)).Returns((UploadJobRow?)null);

            var result = await _service.VerifyJobAsync(99, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Unavailable, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_InvalidUserId_ReturnsUnavailable()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob());

            var result = await _service.VerifyJobAsync(1, 0);

            Assert.Equal(InvoiceJobVerificationOutcomes.Unavailable, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_WrongUserNoAccess_ReturnsUnavailable()
        {
            var job = MakeJob();
            job.UserId = 99;
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Unavailable, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_WrongJobType_ReturnsUnavailable()
        {
            var job = MakeJob();
            job.JobType = "excel_upload";
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Unavailable, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_AlreadyVerified_ReturnsAlreadyVerified()
        {
            var json = BuildStoredPayloadJson(invoiceId: 42);
            var job = MakeJob(status: "verified", resultJson: json);
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.AlreadyVerified, result.Outcome);
            Assert.Equal(42, result.InvoiceId);
        }

        [Fact]
        public async Task VerifyJobAsync_AutomaticLowConfidence_RequiresReview()
        {
            var json = BuildStoredPayloadJson(confidence: 0.5m);
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob(resultJson: json));

            var result = await _service.VerifyJobAsync(1, 10, automatic: true);

            Assert.Equal(InvoiceJobVerificationOutcomes.RequiresReview, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_NotReadyStatus_ReturnsUnavailable()
        {
            var job = MakeJob(status: "processing");
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Unavailable, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_VerifyingStatus_ResumesVerification()
        {
            var job = MakeJob(status: "verifying", resultJson: BuildStoredPayloadJson(invoiceId: 42));
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((true, 42L, "", false));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()))
                .Returns(true);
            _mockInvoiceSvc.Setup(x => x.GetById(42))
                .Returns(new InvoiceRow { Id = 42, CompanyId = 5 });
            _mockInvoiceSvc.Setup(x => x.MarkVerified(42, 10)).Returns(true);
            _mockJobSvc.Setup(x => x.MarkVerified(1, It.IsAny<string?>())).Returns(true);
            _mockInvoiceSvc.Setup(x => x.AutoMatchAfterCreateAsync(42, 10, 70m))
                .ReturnsAsync((true, 5L, "Matched", 85m));

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Verified, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_SuccessfulVerification_ReturnsVerified()
        {
            var json = BuildStoredPayloadJson(confidence: 0.95m);
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob(resultJson: json));
            _mockJobSvc.Setup(x => x.TryBeginVerification(1)).Returns(true);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((true, 42L, "", false));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()))
                .Returns(true);
            _mockInvoiceSvc.Setup(x => x.GetById(42))
                .Returns(new InvoiceRow { Id = 42, CompanyId = 5 });
            _mockInvoiceSvc.Setup(x => x.MarkVerified(42, 10)).Returns(true);
            _mockJobSvc.Setup(x => x.MarkVerified(1, It.IsAny<string?>())).Returns(true);
            _mockInvoiceSvc.Setup(x => x.AutoMatchAfterCreateAsync(42, 10, 70m))
                .ReturnsAsync((true, 5L, "Matched", 85m));

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Verified, result.Outcome);
            Assert.Equal(42, result.InvoiceId);
        }

        [Fact]
        public async Task VerifyJobAsync_DuplicateInvoice_ReturnsDuplicate()
        {
            var json = BuildStoredPayloadJson(isDuplicate: true, confidence: 0.95m);
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob(resultJson: json));
            _mockJobSvc.Setup(x => x.TryBeginVerification(1)).Returns(true);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((true, 42L, "", true));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()))
                .Returns(true);
            _mockInvoiceSvc.Setup(x => x.GetById(42))
                .Returns(new InvoiceRow { Id = 42, CompanyId = 5 });
            _mockInvoiceSvc.Setup(x => x.MarkVerified(42, 10)).Returns(true);
            _mockJobSvc.Setup(x => x.MarkVerified(1, It.IsAny<string?>())).Returns(true);
            _mockAnomalySvc.Setup(x => x.GetByCompany(5, "open", null, "duplicate"))
                .Returns(new List<AnomalyRow>());

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Duplicate, result.Outcome);
        }

        [Fact]
        public async Task VerifyJobAsync_InvoiceCreateFails_ReturnsFailed()
        {
            var json = BuildStoredPayloadJson(confidence: 0.95m);
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob(resultJson: json));
            _mockJobSvc.Setup(x => x.TryBeginVerification(1)).Returns(true);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((false, 0L, "Validation failed", false));
            _mockJobSvc.Setup(x => x.RestoreCompleted(1, json, "Validation failed")).Returns(true);
            _mockJobSvc.Setup(x => x.GetById(1))
                .Returns(MakeJob(resultJson: json));
            _mockRealtime.Setup(x => x.NotifyUploadJobUpdatedAsync(It.IsAny<UploadJobRow>()))
                .Returns(Task.CompletedTask);

            var result = await _service.VerifyJobAsync(1, 10);

            Assert.Equal(InvoiceJobVerificationOutcomes.Failed, result.Outcome);
            _mockVerifiedHybridAuditWriter.Verify(
                writer => writer.AppendVerifiedAsync(
                    It.IsAny<UploadJobRow>(),
                    It.IsAny<StoredInvoiceJobResult>(),
                    It.IsAny<PdfExtractionResult>(),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task VerifyJobAsync_ManualReview_AppendsVerifiedHybridAuditWithReviewedValues()
        {
            var extracted = new PdfExtractionResult
            {
                VendorName = "Merged Vendor",
                InvoiceNumber = "INV-001",
                InvoiceDate = new DateTime(2026, 6, 1),
                TotalAmount = 1000m,
                Currency = "USD",
                ExtractionConfidence = 0.95m,
                ExtractionSource = "hybrid",
                RawText = "invoice text"
            };
            var serializer = new InvoiceJobPayloadSerializer();
            var json = serializer.BuildResultJson(
                extracted,
                null,
                false,
                null,
                "Ready",
                new HybridExtractionAudit
                {
                    LocalResult = new PdfExtractionResult { VendorName = "Local Vendor" },
                    GeminiResult = new PdfExtractionResult { VendorName = "Gemini Vendor" },
                    MergedResult = extracted,
                    FieldSources = new Dictionary<string, string> { ["vendorName"] = "gemini" }
                });
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob(resultJson: json));
            _mockJobSvc.Setup(x => x.TryBeginVerification(1)).Returns(true);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((true, 42L, "", false));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()))
                .Returns(true);
            _mockInvoiceSvc.Setup(x => x.GetById(42))
                .Returns(new InvoiceRow { Id = 42, CompanyId = 5 });
            _mockInvoiceSvc.Setup(x => x.MarkVerified(42, 10)).Returns(true);
            _mockJobSvc.Setup(x => x.MarkVerified(1, It.IsAny<string?>())).Returns(true);
            _mockInvoiceSvc.Setup(x => x.AutoMatchAfterCreateAsync(42, 10, 70m))
                .ReturnsAsync((true, 5L, "Matched", 85m));

            var reviewedInvoice = new CreateInvoiceRequest
            {
                CompanyId = 5,
                VendorName = "Reviewed Vendor",
                InvoiceNumber = "INV-001",
                InvoiceDate = new DateTime(2026, 6, 1),
                TotalAmount = 1100m,
                Currency = "USD"
            };

            var result = await _service.VerifyJobAsync(1, 10, reviewedInvoice);

            Assert.Equal(InvoiceJobVerificationOutcomes.Verified, result.Outcome);
            _mockVerifiedHybridAuditWriter.Verify(
                writer => writer.AppendVerifiedAsync(
                    It.Is<UploadJobRow>(job => job.Id == 1),
                    It.IsAny<StoredInvoiceJobResult>(),
                    It.Is<PdfExtractionResult>(payload =>
                        payload.VendorName == "Reviewed Vendor"
                        && payload.TotalAmount == 1100m
                        && payload.ExtractionSource == "hybrid"),
                    "manual_review"),
                Times.Once);
        }

        [Fact]
        public async Task VerifyJobAsync_AutomaticVerification_UsesMergedResultForAuditWriter()
        {
            var merged = new PdfExtractionResult
            {
                VendorName = "Merged Vendor",
                InvoiceNumber = "INV-001",
                InvoiceDate = new DateTime(2026, 6, 1),
                TotalAmount = 1000m,
                Currency = "USD",
                ExtractionConfidence = 0.95m,
                ExtractionSource = "hybrid",
                RawText = "invoice text"
            };
            var serializer = new InvoiceJobPayloadSerializer();
            var json = serializer.BuildResultJson(
                merged,
                null,
                false,
                null,
                "Ready",
                new HybridExtractionAudit
                {
                    LocalResult = new PdfExtractionResult { VendorName = "Local Vendor" },
                    GeminiResult = new PdfExtractionResult { VendorName = "Gemini Vendor" },
                    MergedResult = merged
                });
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(MakeJob(resultJson: json));
            _mockJobSvc.Setup(x => x.TryBeginVerification(1)).Returns(true);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((true, 42L, "", false));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()))
                .Returns(true);
            _mockInvoiceSvc.Setup(x => x.GetById(42))
                .Returns(new InvoiceRow { Id = 42, CompanyId = 5 });
            _mockInvoiceSvc.Setup(x => x.MarkVerified(42, 10)).Returns(true);
            _mockJobSvc.Setup(x => x.MarkVerified(1, It.IsAny<string?>())).Returns(true);
            _mockInvoiceSvc.Setup(x => x.AutoMatchAfterCreateAsync(42, 10, 70m))
                .ReturnsAsync((true, 5L, "Matched", 85m));

            var result = await _service.VerifyJobAsync(1, 10, automatic: true);

            Assert.Equal(InvoiceJobVerificationOutcomes.Verified, result.Outcome);
            _mockVerifiedHybridAuditWriter.Verify(
                writer => writer.AppendVerifiedAsync(
                    It.IsAny<UploadJobRow>(),
                    It.IsAny<StoredInvoiceJobResult>(),
                    It.Is<PdfExtractionResult>(payload =>
                        payload.VendorName == "Merged Vendor"
                        && payload.TotalAmount == 1000m),
                    "auto_verify"),
                Times.Once);
        }

        [Fact]
        public async Task VerifyJobsAsync_Multiple_CountsCorrectly()
        {
            var json = BuildStoredPayloadJson(confidence: 0.95m);
            var job = MakeJob(resultJson: json);
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.GetById(2)).Returns((UploadJobRow?)null);
            _mockJobSvc.Setup(x => x.TryBeginVerification(1)).Returns(true);
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "/uploads/test.pdf", "application/pdf",
                1024L, 0.95m))
                .Returns((true, 42L, "", false));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()))
                .Returns(true);
            _mockInvoiceSvc.Setup(x => x.GetById(42))
                .Returns(new InvoiceRow { Id = 42, CompanyId = 5 });
            _mockInvoiceSvc.Setup(x => x.MarkVerified(42, 10)).Returns(true);
            _mockJobSvc.Setup(x => x.MarkVerified(1, It.IsAny<string?>())).Returns(true);
            _mockInvoiceSvc.Setup(x => x.AutoMatchAfterCreateAsync(42, 10, 70m))
                .ReturnsAsync((true, 5L, "Matched", 85m));

            var response = await _service.VerifyJobsAsync(new[] { 1L, 2L }, 10);

            Assert.Equal(2, response.RequestedCount);
            Assert.Equal(1, response.VerifiedCount);
            Assert.Equal(1, response.FailedCount);
        }
    }
}
