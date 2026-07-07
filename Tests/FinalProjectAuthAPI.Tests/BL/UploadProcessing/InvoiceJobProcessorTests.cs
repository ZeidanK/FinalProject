using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.UploadProcessing;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.UploadProcessing
{
    public class InvoiceJobProcessorTests
    {
        private readonly Mock<IUploadJobService> _mockJobSvc;
        private readonly Mock<IFileStorageService> _mockFileSvc;
        private readonly Mock<IPdfExtractionService> _mockPdfSvc;
        private readonly Mock<IInvoiceService> _mockInvoiceSvc;
        private readonly Mock<IAnomalyService> _mockAnomalySvc;
        private readonly Mock<IUploadJobNotificationService> _mockNotifSvc;
        private readonly InvoiceJobProcessor _processor;

        public InvoiceJobProcessorTests()
        {
            _mockJobSvc = new Mock<IUploadJobService>();
            _mockFileSvc = new Mock<IFileStorageService>();
            _mockPdfSvc = new Mock<IPdfExtractionService>();
            _mockInvoiceSvc = new Mock<IInvoiceService>();
            _mockAnomalySvc = new Mock<IAnomalyService>();
            var realtimeMock = new Mock<IRealtimeNotificationService>();
            var activityLogMock = new Mock<IActivityLogService>();
            _mockNotifSvc = new Mock<IUploadJobNotificationService>();
            _processor = new InvoiceJobProcessor(
                _mockJobSvc.Object, _mockFileSvc.Object, _mockPdfSvc.Object,
                _mockInvoiceSvc.Object, _mockAnomalySvc.Object, _mockNotifSvc.Object);
        }

        private static string CreateTempPdf(string fullPath)
        {
            var dir = System.IO.Path.GetDirectoryName(fullPath)!;
            System.IO.Directory.CreateDirectory(dir);
            System.IO.File.WriteAllText(fullPath, "dummy pdf content");
            return fullPath;
        }

        private static UploadJobRow MakeJob(long id = 1, string jobType = "invoice_upload_pdf", string status = "queued")
        {
            return new UploadJobRow
            {
                Id = id,
                CompanyId = 5,
                UserId = 10,
                JobType = jobType,
                Status = status,
                FilePath = "/uploads/test.pdf",
                FileOriginalName = "test.pdf",
                FileType = "application/pdf",
                FileSize = 1024
            };
        }

        [Fact]
        public async Task ProcessAsync_JobNotFound_ReturnsEarly()
        {
            _mockJobSvc.Setup(x => x.GetById(99)).Returns((UploadJobRow?)null);
            await _processor.ProcessAsync(99);
            _mockJobSvc.Verify(x => x.MarkProcessing(It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public async Task ProcessAsync_UploadAndCreate_Success_CreatesInvoice()
        {
            var pdfPath = CreateTempPdf(System.IO.Path.Combine(System.IO.Path.GetTempPath(), "test_invoice.pdf"));
            var job = MakeJob(jobType: "invoice_upload_and_create");
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetInvoiceFullPath(job.FilePath)).Returns(pdfPath);
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "test.pdf"))
                .ReturnsAsync(new PdfExtractionResult
                {
                    VendorName = "Acme", InvoiceNumber = "INV-001",
                    InvoiceDate = new System.DateTime(2026, 6, 1), TotalAmount = 1000,
                    ExtractionConfidence = 0.95m, Currency = "USD"
                });
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10, "test.pdf",
                "/uploads/test.pdf", "application/pdf", 1024L, 0.95m))
                .Returns((true, 42L, "", false));
            _mockInvoiceSvc.Setup(x => x.UpdateStatus(42, "extracted")).Returns(true);
            _mockJobSvc.Setup(x => x.MarkCompleted(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockInvoiceSvc.Verify(x => x.Create(It.IsAny<CreateInvoiceRequest>(), 10,
                "test.pdf", "/uploads/test.pdf", "application/pdf", 1024L, 0.95m), Times.Once);
            _mockJobSvc.Verify(x => x.MarkCompleted(1, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_UploadAndCreate_CreateFails_MarksFailed()
        {
            var pdfPath = CreateTempPdf(System.IO.Path.Combine(System.IO.Path.GetTempPath(), "test_invoice_create_fail.pdf"));
            var job = MakeJob(jobType: "invoice_upload_and_create");
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetInvoiceFullPath(job.FilePath)).Returns(pdfPath);
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "test.pdf"))
                .ReturnsAsync(new PdfExtractionResult { VendorName = "Acme", ExtractionConfidence = 0.5m });
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10, "test.pdf",
                "/uploads/test.pdf", "application/pdf", 1024L, 0.5m))
                .Returns((false, 0L, "Validation error", false));
            _mockJobSvc.Setup(x => x.MarkFailed(1, "Validation error"));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkFailed(1, "Validation error"), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_UploadAndCreate_DuplicateInvoice_NotifiesAnomaly()
        {
            var pdfPath = CreateTempPdf(System.IO.Path.Combine(System.IO.Path.GetTempPath(), "test_invoice_dup.pdf"));
            var job = MakeJob(jobType: "invoice_upload_and_create");
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetInvoiceFullPath(job.FilePath)).Returns(pdfPath);
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "test.pdf"))
                .ReturnsAsync(new PdfExtractionResult { VendorName = "Acme", ExtractionConfidence = 0.9m });
            _mockInvoiceSvc.Setup(x => x.Create(It.IsAny<CreateInvoiceRequest>(), 10,
                "test.pdf", "/uploads/test.pdf", "application/pdf", 1024L, 0.9m))
                .Returns((true, 42L, "", true));
            _mockInvoiceSvc.Setup(x => x.UpdateStatus(42, "extracted")).Returns(true);
            _mockJobSvc.Setup(x => x.MarkCompleted(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockNotifSvc.Verify(x => x.NotifyDuplicateInvoiceAnomalyAsync(
                _mockAnomalySvc.Object, 5, 42), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_ExtractOnly_Success()
        {
            var pdfPath = CreateTempPdf(System.IO.Path.Combine(System.IO.Path.GetTempPath(), "test_extract.pdf"));
            var job = MakeJob(jobType: "invoice_upload_pdf");
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetInvoiceFullPath(job.FilePath)).Returns(pdfPath);
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "test.pdf"))
                .ReturnsAsync(new PdfExtractionResult { VendorName = "Acme" });
            _mockJobSvc.Setup(x => x.MarkCompleted(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockInvoiceSvc.Verify(x => x.Create(It.IsAny<CreateInvoiceRequest>(), It.IsAny<long>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<long?>(), It.IsAny<decimal?>()), Times.Never);
            _mockJobSvc.Verify(x => x.MarkCompleted(1, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_ExceptionCaught_MarksFailed()
        {
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetInvoiceFullPath(job.FilePath)).Throws(new System.IO.FileNotFoundException("File missing"));
            _mockJobSvc.Setup(x => x.MarkFailed(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkFailed(1, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public void BuildInvoiceRequest_WithNullExtractedFields_DefaultsGracefully()
        {
            var extracted = new PdfExtractionResult();
            var method = typeof(InvoiceJobProcessor).GetMethod("BuildInvoiceRequest",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = method?.Invoke(null, new object[] { 5L, extracted }) as CreateInvoiceRequest;

            Assert.NotNull(result);
            Assert.Equal(5, result!.CompanyId);
            Assert.NotNull(result.InvoiceNumber);
            Assert.Equal("Unknown Vendor", result.VendorName);
            Assert.Equal("USD", result.Currency);
        }
    }
}