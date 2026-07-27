using System.Linq.Expressions;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class InvoicesControllerTests
    {
        private readonly Mock<IInvoiceService> _mockSvc;
        private readonly Mock<IFileStorageService> _mockFileSvc;
        private readonly Mock<IUploadJobService> _mockJobSvc;
        private readonly Mock<IBackgroundJobClient> _mockHangfire;
        private readonly Mock<IUploadQueueNameProvider> _mockUploadQueueNameProvider;
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IWebHostEnvironment> _mockEnv;
        private readonly Mock<IAnomalyService> _mockAnomaly;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly InvoicesController _controller;

        public InvoicesControllerTests()
        {
            _mockSvc = new Mock<IInvoiceService>();
            _mockFileSvc = new Mock<IFileStorageService>();
            _mockJobSvc = new Mock<IUploadJobService>();
            _mockHangfire = new Mock<IBackgroundJobClient>();
            _mockUploadQueueNameProvider = new Mock<IUploadQueueNameProvider>();
            _mockUploadQueueNameProvider.Setup(x => x.UploadQueueName).Returns("uploads_test_laptop");
            _mockDb = new Mock<IDBservices>();
            _mockEnv = new Mock<IWebHostEnvironment>();
            _mockAnomaly = new Mock<IAnomalyService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            _controller = new InvoicesController(
                _mockSvc.Object, _mockFileSvc.Object, _mockJobSvc.Object,
                _mockHangfire.Object, _mockUploadQueueNameProvider.Object,
                _mockDb.Object, _mockEnv.Object,
                _mockAnomaly.Object, _mockRealtime.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "10"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetByCompany_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetByCompany(5, null, null, null, null))
                .Returns(new List<InvoiceRow>());

            var result = _controller.GetByCompany(5, null, null, null, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow { Id = 1 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((InvoiceRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task Create_Success_Returns201()
        {
            var req = new CreateInvoiceRequest
            {
                CompanyId = 5,
                InvoiceNumber = "INV-001",
                TotalAmount = 100m,
                FileOriginalName = "inv.pdf",
                FilePath = "uploads/invoices/5/inv.pdf",
                FileType = "application/pdf",
                FileSize = 1000,
                AiExtractionConfidence = 0.95m
            };
            _mockSvc.Setup(x => x.Create(req, 10, "inv.pdf", "uploads/invoices/5/inv.pdf",
                "application/pdf", 1000L, 0.95m))
                .Returns((true, 1L, "", false));
            _mockSvc.Setup(x => x.MarkVerified(1, 10)).Returns(true);

            var result = await _controller.Create(req, false);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(1L, created.RouteValues!["id"]);
        }

        [Fact]
        public async Task Create_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateInvoiceRequest>(), 10,
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<long?>(), It.IsAny<decimal?>()))
                .Returns((false, 0L, "error", false));

            var result = await _controller.Create(new CreateInvoiceRequest(), false);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Create_Duplicate_Returns201WithFlag()
        {
            var req = new CreateInvoiceRequest
            {
                CompanyId = 5,
                InvoiceNumber = "DUP-001",
                TotalAmount = 100m
            };
            _mockSvc.Setup(x => x.Create(req, 10, null, null, null, null, null))
                .Returns((true, 1L, "", true));
            _mockSvc.Setup(x => x.MarkVerified(1, 10)).Returns(true);
            _mockAnomaly.Setup(x => x.GetByCompany(5, "open", null, "duplicate"))
                .Returns(new List<AnomalyRow>());

            var result = await _controller.Create(req, false);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(1L, created.RouteValues!["id"]);
        }

        [Fact]
        public async Task Create_Duplicate_WithAnomaly_SendsNotification()
        {
            var req = new CreateInvoiceRequest
            {
                CompanyId = 5,
                InvoiceNumber = "DUP-001",
                TotalAmount = 100m
            };
            _mockSvc.Setup(x => x.Create(req, 10, null, null, null, null, null))
                .Returns((true, 1L, "", true));
            _mockSvc.Setup(x => x.MarkVerified(1, 10)).Returns(true);
            _mockAnomaly.Setup(x => x.GetByCompany(5, "open", null, "duplicate"))
                .Returns(new List<AnomalyRow>
                {
                    new() { Id = 50, RelatedInvoiceId = 1, Description = "Duplicate detected" }
                });
            _mockRealtime.Setup(x => x.CreateCompanyNotificationAsync(
                5, It.IsAny<NotificationMessage>(), It.IsAny<object>()))
                .Returns(Task.CompletedTask);

            var result = await _controller.Create(req, false);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(1L, created.RouteValues!["id"]);
            _mockRealtime.Verify(x => x.CreateCompanyNotificationAsync(
                5, It.IsAny<NotificationMessage>(), It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task Create_AutoMatch_Returns201WithMatchResult()
        {
            var req = new CreateInvoiceRequest
            {
                CompanyId = 5,
                InvoiceNumber = "INV-001",
                TotalAmount = 100m
            };
            _mockSvc.Setup(x => x.Create(req, 10, null, null, null, null, null))
                .Returns((true, 1L, "", false));
            _mockSvc.Setup(x => x.MarkVerified(1, 10)).Returns(true);
            _mockSvc.Setup(x => x.AutoMatchAfterCreateAsync(1, 10, 70m))
                .ReturnsAsync((true, 42L, "Auto-matched.", 85m));

            var result = await _controller.Create(req, true);

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(1L, created.RouteValues!["id"]);
        }

        [Fact]
        public void Update_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Update(1, It.IsAny<CreateInvoiceRequest>(), 10))
                .Returns((true, "", false));

            var result = _controller.Update(1, new CreateInvoiceRequest());

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Update_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.Update(1, It.IsAny<CreateInvoiceRequest>(), 10))
                .Returns((false, "not found", true));

            var result = _controller.Update(1, new CreateInvoiceRequest());

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Update_BadRequest_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Update(1, It.IsAny<CreateInvoiceRequest>(), 10))
                .Returns((false, "error", false));

            var result = _controller.Update(1, new CreateInvoiceRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void UpdateStatus_Success_ReturnsOk()
        {
            _mockSvc.Setup(x => x.UpdateStatus(1, "paid")).Returns(true);

            var result = _controller.UpdateStatus(1, new UpdateInvoiceStatusRequest { Status = "paid" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void UpdateStatus_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.UpdateStatus(1, "invalid")).Returns(false);

            var result = _controller.UpdateStatus(1, new UpdateInvoiceStatusRequest { Status = "invalid" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Delete_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow { Id = 1, FilePath = "" });
            _mockSvc.Setup(x => x.Delete(1)).Returns(true);

            var result = _controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((InvoiceRow?)null);

            var result = _controller.Delete(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Delete_WithFile_DeletesFileAndReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow
            {
                Id = 1,
                FilePath = "uploads/invoices/5/inv.pdf"
            });
            _mockSvc.Setup(x => x.Delete(1)).Returns(true);

            var result = _controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
            _mockFileSvc.Verify(x => x.Delete("uploads/invoices/5/inv.pdf"), Times.Once);
        }

        [Fact]
        public async Task BulkDelete_Valid_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow { Id = 1, FilePath = "" });
            _mockSvc.Setup(x => x.GetById(2)).Returns(new InvoiceRow { Id = 2, FilePath = "" });
            _mockSvc.Setup(x => x.BulkDelete(new List<long> { 1, 2 }))
                .Returns((new List<long> { 1, 2 }, new List<long>()));

            var result = await _controller.BulkDelete(new BulkDeleteInvoicesRequest
            {
                Ids = new List<long> { 1, 2 }
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task BulkDelete_EmptyIds_ReturnsBadRequest()
        {
            var result = await _controller.BulkDelete(new BulkDeleteInvoicesRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Download_Found_ReturnsPhysicalFile()
        {
            var tempDir = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            var fileDir = Path.Combine(tempDir, "uploads", "invoices", "5");
            var filePath = Path.Combine(fileDir, "inv.pdf");
            try
            {
                Directory.CreateDirectory(fileDir);
                File.WriteAllText(filePath, "test content");

                _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow
                {
                    Id = 1,
                    CompanyId = 5,
                    FilePath = "uploads/invoices/5/inv.pdf",
                    FileType = "application/pdf",
                    FileOriginalName = "inv.pdf"
                });
                _mockFileSvc.Setup(x => x.GetInvoiceFullPath("uploads/invoices/5/inv.pdf"))
                    .Returns(filePath);

                var result = _controller.Download(1);

                Assert.IsType<PhysicalFileResult>(result);
            }
            finally
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
            }
        }

        [Fact]
        public void Download_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((InvoiceRow?)null);

            var result = _controller.Download(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Download_NoFilePath_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow { Id = 1, FilePath = "" });

            var result = _controller.Download(1);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Download_InvalidPath_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new InvoiceRow
            {
                Id = 1,
                CompanyId = 5,
                FilePath = "malicious/../../etc/passwd"
            });

            var result = _controller.Download(1);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadPdf_NoAccess_ReturnsForbid()
        {
            var file = MakeFormFile("content", "test.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var result = await _controller.UploadPdf(file, 5, false);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UploadPdf_Success_ReturnsAccepted()
        {
            var file = MakeFormFile("content", "test.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(file, 5))
                .ReturnsAsync(("uploads/invoices/5/test.pdf", "C:\\wwwroot\\uploads\\invoices\\5\\test.pdf"));
            CreateUploadJobRequest? capturedRequest = null;
            _mockJobSvc.Setup(x => x.Create(It.IsAny<CreateUploadJobRequest>()))
                .Callback<CreateUploadJobRequest>(request => capturedRequest = request)
                .Returns(1L);
            _mockHangfire.Setup(x => x.Create(It.IsAny<Job>(), It.IsAny<EnqueuedState>()))
                .Returns("hangfire-1");

            var result = await _controller.UploadPdf(file, 5, false);

            Assert.IsType<AcceptedResult>(result);
            Assert.NotNull(capturedRequest);
            _mockHangfire.Verify(x => x.Create(
                It.IsAny<Job>(),
                It.Is<EnqueuedState>(state => state.Queue == "uploads_test_laptop")), Times.Once);
            using var payload = JsonDocument.Parse(capturedRequest!.PayloadJson!);
            Assert.False(payload.RootElement.GetProperty("autoVerify").GetBoolean());
            Assert.Equal("gemini", payload.RootElement.GetProperty("extractionProvider").GetString());
        }

        [Fact]
        public async Task UploadPdf_LocalModelProvider_StoresProviderInPayload()
        {
            var file = MakeFormFile("content", "test.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(file, 5))
                .ReturnsAsync(("uploads/invoices/5/test.pdf", "C:\\wwwroot\\uploads\\invoices\\5\\test.pdf"));
            CreateUploadJobRequest? capturedRequest = null;
            _mockJobSvc.Setup(x => x.Create(It.IsAny<CreateUploadJobRequest>()))
                .Callback<CreateUploadJobRequest>(request => capturedRequest = request)
                .Returns(1L);
            _mockHangfire.Setup(x => x.Create(It.IsAny<Job>(), It.IsAny<EnqueuedState>()))
                .Returns("hangfire-1");

            var result = await _controller.UploadPdf(file, 5, false, "localmodel");

            Assert.IsType<AcceptedResult>(result);
            Assert.NotNull(capturedRequest);
            using var payload = JsonDocument.Parse(capturedRequest!.PayloadJson!);
            Assert.Equal("localmodel", payload.RootElement.GetProperty("extractionProvider").GetString());
        }

        [Fact]
        public async Task UploadAndCreate_NoAccess_ReturnsForbid()
        {
            var file = MakeFormFile("content", "test.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var result = await _controller.UploadAndCreate(file, 5);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UploadAndCreate_Success_ReturnsAccepted()
        {
            var file = MakeFormFile("content", "test.pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFileSvc.Setup(x => x.SaveAsync(file, 5))
                .ReturnsAsync(("uploads/invoices/5/test.pdf", "C:\\wwwroot\\uploads\\invoices\\5\\test.pdf"));
            CreateUploadJobRequest? capturedRequest = null;
            _mockJobSvc.Setup(x => x.Create(It.IsAny<CreateUploadJobRequest>()))
                .Callback<CreateUploadJobRequest>(request => capturedRequest = request)
                .Returns(1L);
            _mockHangfire.Setup(x => x.Create(It.IsAny<Job>(), It.IsAny<EnqueuedState>()))
                .Returns("hangfire-1");

            var result = await _controller.UploadAndCreate(file, 5);

            Assert.IsType<AcceptedResult>(result);
            Assert.NotNull(capturedRequest);
            _mockHangfire.Verify(x => x.Create(
                It.IsAny<Job>(),
                It.Is<EnqueuedState>(state => state.Queue == "uploads_test_laptop")), Times.Once);
            Assert.Null(capturedRequest.PayloadJson);
        }

        private static IFormFile MakeFormFile(string content, string fileName, string contentType = "application/pdf")
        {
            var bytes = Encoding.UTF8.GetBytes(content);
            var stream = new MemoryStream(bytes);
            return new FormFile(stream, 0, bytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }
    }
}
