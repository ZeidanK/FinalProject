using System.Security.Claims;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class UploadJobsControllerTests
    {
        private readonly Mock<IUploadJobService> _mockJobSvc;
        private readonly Mock<IFileStorageService> _mockFileSvc;
        private readonly Mock<IInvoiceVerificationService> _mockVerifySvc;
        private readonly Mock<IDBservices> _mockDb;
        private readonly Mock<IWebHostEnvironment> _mockEnv;
        private readonly UploadJobsController _controller;

        public UploadJobsControllerTests()
        {
            _mockJobSvc = new Mock<IUploadJobService>();
            _mockFileSvc = new Mock<IFileStorageService>();
            _mockVerifySvc = new Mock<IInvoiceVerificationService>();
            _mockDb = new Mock<IDBservices>();
            _mockEnv = new Mock<IWebHostEnvironment>();
            _controller = new UploadJobsController(
                _mockJobSvc.Object,
                _mockFileSvc.Object,
                _mockVerifySvc.Object,
                _mockDb.Object,
                _mockEnv.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("id", "42"),
                        new Claim(ClaimTypes.Role, "business_owner")
                    }, "test"))
                }
            };
        }

        [Fact]
        public void GetById_Found_OwnJob_ReturnsOk()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow { Id = 1, UserId = 42, CompanyId = 5 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_CompanyAccess_ReturnsOk()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow { Id = 1, UserId = 99, CompanyId = 5 });
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(true);

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockJobSvc.Setup(x => x.GetById(99)).Returns((UploadJobRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void GetById_NoAccess_ReturnsForbid()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow { Id = 1, UserId = 99, CompanyId = 5 });
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(false);

            var result = _controller.GetById(1);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void GetMine_ReturnsOk()
        {
            _mockJobSvc.Setup(x => x.GetByUser(42, null, null, 50)).Returns(new List<UploadJobRow>());

            var result = _controller.GetMine(null, null, 50);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetMine_WithCompany_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(false);

            var result = _controller.GetMine(5, null, 50);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task MarkVerified_Success_ReturnsOk()
        {
            _mockVerifySvc.Setup(x => x.VerifyJobAsync(1, 42, null, false))
                .ReturnsAsync(new InvoiceJobVerificationResult
                {
                    JobId = 1,
                    Outcome = InvoiceJobVerificationOutcomes.Verified,
                    IsDuplicate = false
                });

            var result = await _controller.MarkVerified(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task MarkVerified_Failure_ReturnsBadRequest()
        {
            _mockVerifySvc.Setup(x => x.VerifyJobAsync(1, 42, null, false))
                .ReturnsAsync(new InvoiceJobVerificationResult
                {
                    JobId = 1,
                    Outcome = InvoiceJobVerificationOutcomes.Failed
                });

            var result = await _controller.MarkVerified(1);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task VerifyInvoice_Ok_ReturnsOk()
        {
            var req = new CreateInvoiceRequest { CompanyId = 5 };
            _mockVerifySvc.Setup(x => x.VerifyJobAsync(1, 42, req))
                .ReturnsAsync(new InvoiceJobVerificationResult
                {
                    JobId = 1,
                    Outcome = InvoiceJobVerificationOutcomes.Verified
                });

            var result = await _controller.VerifyInvoice(1, req);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task VerifyInvoice_Unavailable_ReturnsNotFound()
        {
            var req = new CreateInvoiceRequest { CompanyId = 5 };
            _mockVerifySvc.Setup(x => x.VerifyJobAsync(1, 42, req))
                .ReturnsAsync(new InvoiceJobVerificationResult
                {
                    JobId = 1,
                    Outcome = InvoiceJobVerificationOutcomes.Unavailable
                });

            var result = await _controller.VerifyInvoice(1, req);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task VerifyInvoices_ReturnsOk()
        {
            _mockVerifySvc.Setup(x => x.VerifyJobsAsync(new List<long> { 1, 2 }, 42))
                .ReturnsAsync(new BulkInvoiceJobVerificationResponse { RequestedCount = 2 });

            var result = await _controller.VerifyInvoices(new VerifyInvoiceUploadJobsRequest
            {
                JobIds = new List<long> { 1, 2 }
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_OwnJob_ReturnsOk()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
            {
                Id = 1, UserId = 42, CompanyId = 5, Status = "processing", FilePath = ""
            });
            _mockJobSvc.Setup(x => x.Delete(1)).Returns(true);

            var result = _controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_VerifiedJob_ReturnsConflict()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
            {
                Id = 1, UserId = 42, CompanyId = 5, Status = UploadJobStatuses.Verified
            });

            var result = _controller.Delete(1);

            Assert.IsType<ConflictObjectResult>(result);
        }

        [Fact]
        public void Delete_NotFound_ReturnsNotFound()
        {
            _mockJobSvc.Setup(x => x.GetById(99)).Returns((UploadJobRow?)null);

            var result = _controller.Delete(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Delete_NoAccess_ReturnsForbid()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
            {
                Id = 1, UserId = 99, CompanyId = 5
            });
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(false);

            var result = _controller.Delete(1);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void DeleteByCompany_ReturnsOk()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(true);
            _mockJobSvc.Setup(x => x.DeleteByCompany(5, null)).Returns(3);

            var result = _controller.DeleteByCompany(5, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void DeleteByCompany_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(false);

            var result = _controller.DeleteByCompany(5, null);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void Download_OwnJob_ReturnsPhysicalFile()
        {
            var tempDir = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            var fileDir = Path.Combine(tempDir, "uploads", "invoices", "5");
            var filePath = Path.Combine(fileDir, "test.pdf");
            try
            {
                Directory.CreateDirectory(fileDir);
                File.WriteAllText(filePath, "test content");

                _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
                {
                    Id = 1, UserId = 42, CompanyId = 5,
                    FilePath = "uploads/invoices/5/test.pdf",
                    FileType = "application/pdf",
                    FileOriginalName = "test.pdf"
                });
                _mockEnv.Setup(x => x.WebRootPath).Returns(tempDir);

                var result = _controller.Download(1);

                Assert.IsType<PhysicalFileResult>(result);
            }
            finally
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
            }
        }

        [Fact]
        public void Download_NoAccess_ReturnsForbid()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
            {
                Id = 1, UserId = 99, CompanyId = 5
            });
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(42, 5)).Returns(false);

            var result = _controller.Download(1);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void Download_MissingFile_ReturnsNotFound()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
            {
                Id = 1, UserId = 42, CompanyId = 5,
                FilePath = "uploads/invoices/5/test.pdf"
            });
            _mockEnv.Setup(x => x.WebRootPath).Returns("C:\\wwwroot");

            var result = _controller.Download(1);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Download_InvalidPath_ReturnsBadRequest()
        {
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(new UploadJobRow
            {
                Id = 1, UserId = 42, CompanyId = 5,
                FilePath = "uploads/invoices/6/wrong-company.pdf"
            });

            var result = _controller.Download(1);

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
