using System.Text;
using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class InvoiceUploadServiceTests
    {
        private readonly Mock<IInvoiceService> _mockInvoiceSvc;
        private readonly Mock<IPdfExtractionService> _mockPdfSvc;
        private readonly Mock<IFileStorageService> _mockFileSvc;
        private readonly Mock<IDBservices> _mockDb;
        private readonly InvoiceUploadService _service;

        public InvoiceUploadServiceTests()
        {
            _mockInvoiceSvc = new Mock<IInvoiceService>();
            _mockPdfSvc = new Mock<IPdfExtractionService>();
            _mockFileSvc = new Mock<IFileStorageService>();
            _mockDb = new Mock<IDBservices>();
            _service = new InvoiceUploadService(_mockInvoiceSvc.Object, _mockPdfSvc.Object, _mockFileSvc.Object, _mockDb.Object);
        }

        private static IFormFile MakeFormFile(string content, string fileName)
        {
            var bytes = Encoding.UTF8.GetBytes(content);
            return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "application/pdf"
            };
        }

        [Fact]
        public async Task UploadPdfAsync_Valid_ReturnsResponse()
        {
            var file = MakeFormFile("pdf content", "invoice.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(file, 5))
                .ReturnsAsync(("uploads/invoices/5/f.pdf", "C:\\full\\f.pdf"));
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "invoice.pdf"))
                .ReturnsAsync(new PdfExtractionResult { VendorName = "Acme" });

            var (success, response, error) = await _service.UploadPdfAsync(file, 5, 10);

            Assert.True(success);
            Assert.NotNull(response);
            Assert.Equal("invoice.pdf", response!.FileOriginalName);
            Assert.NotNull(response.ExtractedData);
            Assert.Equal("Acme", response.ExtractedData.VendorName);
            Assert.Empty(error);
        }

        [Fact]
        public async Task UploadPdfAsync_NullFile_ReturnsFailure()
        {
            var (success, response, error) = await _service.UploadPdfAsync(null!, 5, 10);

            Assert.False(success);
            Assert.Null(response);
            Assert.Contains("No file", error);
        }

        [Fact]
        public async Task UploadPdfAsync_NoCompanyAccess_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var (success, response, error) = await _service.UploadPdfAsync(MakeFormFile("c", "i.pdf"), 5, 10);

            Assert.False(success);
            Assert.Contains("access", error);
        }

        [Fact]
        public async Task UploadAndCreateAsync_Valid_CreatesInvoice()
        {
            var file = MakeFormFile("pdf content", "invoice.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(file, 5))
                .ReturnsAsync(("uploads/invoices/5/f.pdf", "C:\\full\\f.pdf"));
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "invoice.pdf"))
                .ReturnsAsync(new PdfExtractionResult
                {
                    VendorName = "Acme",
                    InvoiceNumber = "INV-001",
                    TotalAmount = 1000m,
                    InvoiceDate = new DateTime(2026, 6, 1),
                    ExtractionConfidence = 0.95m,
                });
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                "invoice.pdf", "uploads/invoices/5/f.pdf", "application/pdf",
                It.IsAny<long?>(), 0.95m))
                .Returns((true, 42L, "", false));
            _mockInvoiceSvc.Setup(x => x.UpdateStatus(42, "extracted")).Returns(true);

            var (success, id, extracted, error) = await _service.UploadAndCreateAsync(file, 5, 10);

            Assert.True(success);
            Assert.Equal(42, id);
            Assert.NotNull(extracted);
            Assert.Empty(error);
        }

        [Fact]
        public async Task UploadAndCreateAsync_NoAccess_ReturnsFailure()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var (success, id, extracted, error) = await _service.UploadAndCreateAsync(MakeFormFile("c", "i.pdf"), 5, 10);

            Assert.False(success);
            Assert.Equal(0, id);
            Assert.Contains("access", error);
        }

        [Fact]
        public async Task UploadAndCreateAsync_PdfServiceThrows_ReturnsFailure()
        {
            var file = MakeFormFile("content", "invoice.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(file, 5))
                .ReturnsAsync(("uploads/invoices/5/f.pdf", "C:\\full\\f.pdf"));
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), "invoice.pdf"))
                .ThrowsAsync(new InvalidOperationException("PDF parsing failed"));

            var (success, id, extracted, error) = await _service.UploadAndCreateAsync(file, 5, 10);

            Assert.False(success);
            Assert.Contains("Failed to process", error);
        }

        [Fact]
        public async Task UploadAndCreateAsync_InvoiceCreateFails_ReturnsError()
        {
            var file = MakeFormFile("content", "invoice.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(It.IsAny<IFormFile>(), 5))
                .ReturnsAsync(("uploads/invoices/5/f.pdf", "C:\\full\\f.pdf"));
            _mockPdfSvc.Setup(x => x.ExtractAsync(It.IsAny<Stream>(), It.IsAny<string>()))
                .ReturnsAsync(new PdfExtractionResult { VendorName = "Acme" });
            _mockInvoiceSvc.Setup(x => x.Create(
                It.IsAny<CreateInvoiceRequest>(), 10,
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<long?>(), It.IsAny<decimal?>()))
                .Returns((false, 0L, "Duplicate invoice", true));

            var (success, id, extracted, error) = await _service.UploadAndCreateAsync(file, 5, 10);

            Assert.False(success);
            Assert.Equal("Duplicate invoice", error);
        }
    }
}
