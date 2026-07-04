using System.Linq.Expressions;
using System.Security.Claims;
using System.Text;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Controllers;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.Controllers
{
    public class TransactionsControllerTests
    {
        private readonly Mock<ITransactionService> _mockSvc;
        private readonly Mock<IExcelExtractionService> _mockExcel;
        private readonly Mock<IFileStorageService> _mockFile;
        private readonly Mock<IUploadJobService> _mockJob;
        private readonly Mock<IBackgroundJobClient> _mockHangfire;
        private readonly Mock<DBservices> _mockDb;
        private readonly TransactionsController _controller;

        public TransactionsControllerTests()
        {
            _mockSvc = new Mock<ITransactionService>();
            _mockExcel = new Mock<IExcelExtractionService>();
            _mockFile = new Mock<IFileStorageService>();
            _mockJob = new Mock<IUploadJobService>();
            _mockHangfire = new Mock<IBackgroundJobClient>();
            _mockDb = new Mock<DBservices>();
            _controller = new TransactionsController(
                _mockSvc.Object, _mockExcel.Object, _mockFile.Object,
                _mockJob.Object, _mockHangfire.Object, _mockDb.Object);
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
                .Returns(new List<TransactionRow>());

            var result = _controller.GetByCompany(5, null, null, null, null);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.GetById(1)).Returns(new TransactionRow { Id = 1 });

            var result = _controller.GetById(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void GetById_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.GetById(99)).Returns((TransactionRow?)null);

            var result = _controller.GetById(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void Create_Success_Returns201()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateTransactionRequest>(), 10))
                .Returns((true, 1L, ""));

            var result = _controller.Create(new CreateTransactionRequest());

            var created = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(1L, created.RouteValues!["id"]);
        }

        [Fact]
        public void Create_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.Create(It.IsAny<CreateTransactionRequest>(), 10))
                .Returns((false, 0L, "error"));

            var result = _controller.Create(new CreateTransactionRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void BulkCreate_Success_Returns201()
        {
            _mockSvc.Setup(x => x.BulkCreate(It.IsAny<BulkCreateTransactionsRequest>(), 10))
                .Returns((true, new List<long> { 1, 2 }, ""));

            var result = _controller.BulkCreate(new BulkCreateTransactionsRequest());

            var objResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(201, objResult.StatusCode);
        }

        [Fact]
        public void BulkCreate_Failure_ReturnsBadRequest()
        {
            _mockSvc.Setup(x => x.BulkCreate(It.IsAny<BulkCreateTransactionsRequest>(), 10))
                .Returns((false, new List<long>(), "error"));

            var result = _controller.BulkCreate(new BulkCreateTransactionsRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void Delete_Found_ReturnsOk()
        {
            _mockSvc.Setup(x => x.Delete(1)).Returns(true);

            var result = _controller.Delete(1);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void Delete_NotFound_ReturnsNotFound()
        {
            _mockSvc.Setup(x => x.Delete(99)).Returns(false);

            var result = _controller.Delete(99);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void BulkDelete_Valid_ReturnsOk()
        {
            _mockSvc.Setup(x => x.BulkDelete(new List<long> { 1, 2 }))
                .Returns((new List<long> { 1, 2 }, new List<long>()));

            var result = _controller.BulkDelete(new BulkDeleteTransactionsRequest
            {
                Ids = new List<long> { 1, 2 }
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void BulkDelete_EmptyIds_ReturnsBadRequest()
        {
            var result = _controller.BulkDelete(new BulkDeleteTransactionsRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void BulkDelete_NullRequest_ReturnsBadRequest()
        {
            var result = _controller.BulkDelete(null!);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task PreviewExcel_Success_ReturnsOk()
        {
            var file = MakeFormFile("content", "test.xlsx");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFile.Setup(x => x.SaveExcelAsync(file, 5))
                .ReturnsAsync(("uploads/excel/5/test.xlsx", "C:\\wwwroot\\uploads\\excel\\5\\test.xlsx"));
            _mockExcel.Setup(x => x.Extract(It.IsAny<Stream>(), "test.xlsx"))
                .Returns(new ExcelExtractionResult { TotalExtracted = 5 });

            var result = await _controller.PreviewExcel(file, 5);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task PreviewExcel_NoAccess_ReturnsForbid()
        {
            var file = MakeFormFile("content", "test.xlsx");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var result = await _controller.PreviewExcel(file, 5);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task PreviewExcel_InvalidExtension_ReturnsBadRequest()
        {
            var file = MakeFormFile("content", "test.pdf", "application/pdf");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);

            var result = await _controller.PreviewExcel(file, 5);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task PreviewExcel_NoTransactions_ReturnsBadRequest()
        {
            var file = MakeFormFile("content", "test.xlsx");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFile.Setup(x => x.SaveExcelAsync(file, 5))
                .ReturnsAsync(("uploads/excel/5/test.xlsx", "C:\\wwwroot\\uploads\\excel\\5\\test.xlsx"));
            _mockExcel.Setup(x => x.Extract(It.IsAny<Stream>(), "test.xlsx"))
                .Returns(new ExcelExtractionResult { TotalExtracted = 0 });

            var result = await _controller.PreviewExcel(file, 5);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void ImportExcel_Deny_DeletesFile_ReturnsOk()
        {
            var tempFile = Path.GetTempFileName();
            try
            {
                _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
                _mockFile.Setup(x => x.GetExcelFullPath("uploads/excel/5/test.xlsx"))
                    .Returns(tempFile);

                var result = _controller.ImportExcel(new ImportExcelRequest
                {
                    CompanyId = 5,
                    SavedFilePath = "uploads/excel/5/test.xlsx",
                    Status = "Deny"
                });

                Assert.IsType<OkObjectResult>(result);
                Assert.False(File.Exists(tempFile), "Temp file should have been deleted");
            }
            finally
            {
                if (File.Exists(tempFile)) File.Delete(tempFile);
            }
        }

        [Fact]
        public void ImportExcel_Accept_ReturnsAccepted()
        {
            var tempFile = Path.GetTempFileName();
            try
            {
                _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
                _mockFile.Setup(x => x.GetExcelFullPath("uploads/excel/5/test.xlsx"))
                    .Returns(tempFile);
                _mockJob.Setup(x => x.Create(It.IsAny<CreateUploadJobRequest>())).Returns(1L);
                _mockHangfire.Setup(x => x.Create(It.IsAny<Job>(), It.IsAny<EnqueuedState>()))
                    .Returns("hangfire-1");

                var result = _controller.ImportExcel(new ImportExcelRequest
                {
                    CompanyId = 5,
                    SavedFilePath = "uploads/excel/5/test.xlsx",
                    Status = "Accept",
                    BankAccountId = 1,
                    FileOriginalName = "test.xlsx"
                });

                Assert.IsType<AcceptedResult>(result);
            }
            finally
            {
                if (File.Exists(tempFile)) File.Delete(tempFile);
            }
        }

        [Fact]
        public void ImportExcel_NoCompany_ReturnsBadRequest()
        {
            var result = _controller.ImportExcel(new ImportExcelRequest());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void ImportExcel_NoAccess_ReturnsForbid()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var result = _controller.ImportExcel(new ImportExcelRequest { CompanyId = 5 });

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void ImportExcel_MissingFilePath_ReturnsBadRequest()
        {
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);

            var result = _controller.ImportExcel(new ImportExcelRequest
            {
                CompanyId = 5,
                SavedFilePath = ""
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadExcel_NoAccess_ReturnsForbid()
        {
            var file = MakeFormFile("content", "test.xlsx");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(false);

            var result = await _controller.UploadExcel(file, 5, null);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UploadExcel_Success_ReturnsAccepted()
        {
            var file = MakeFormFile("content", "test.xlsx");
            _mockDb.Setup(x => x.UserHasActiveCompanyAccess(10, 5)).Returns(true);
            _mockFile.Setup(x => x.SaveExcelAsync(file, 5))
                .ReturnsAsync(("uploads/excel/5/test.xlsx", "C:\\wwwroot\\uploads\\excel\\5\\test.xlsx"));
            _mockJob.Setup(x => x.Create(It.IsAny<CreateUploadJobRequest>())).Returns(1L);
            _mockHangfire.Setup(x => x.Create(It.IsAny<Job>(), It.IsAny<EnqueuedState>()))
                .Returns("hangfire-1");

            var result = await _controller.UploadExcel(file, 5, null);

            Assert.IsType<AcceptedResult>(result);
        }

        private static IFormFile MakeFormFile(string content, string fileName, string contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
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
