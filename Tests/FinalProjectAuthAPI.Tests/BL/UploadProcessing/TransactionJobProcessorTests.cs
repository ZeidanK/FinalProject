using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.UploadProcessing;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.UploadProcessing
{
    public class TransactionJobProcessorTests
    {
        private readonly Mock<IUploadJobService> _mockJobSvc;
        private readonly Mock<IFileStorageService> _mockFileSvc;
        private readonly Mock<IExcelExtractionService> _mockExcelSvc;
        private readonly Mock<ITransactionService> _mockTxnSvc;
        private readonly Mock<IAnomalyService> _mockAnomalySvc;
        private readonly Mock<IRealtimeNotificationService> _mockRealtime;
        private readonly Mock<IUploadJobNotificationService> _mockNotifSvc;
        private readonly Mock<IDBservices> _mockDb;
        private readonly TransactionJobProcessor _processor;

        public TransactionJobProcessorTests()
        {
            _mockJobSvc = new Mock<IUploadJobService>();
            _mockFileSvc = new Mock<IFileStorageService>();
            _mockExcelSvc = new Mock<IExcelExtractionService>();
            _mockTxnSvc = new Mock<ITransactionService>();
            _mockAnomalySvc = new Mock<IAnomalyService>();
            _mockRealtime = new Mock<IRealtimeNotificationService>();
            var activityLogMock = new Mock<IActivityLogService>();
            _mockNotifSvc = new Mock<IUploadJobNotificationService>();
            _mockDb = new Mock<IDBservices>();
            _processor = new TransactionJobProcessor(
                _mockJobSvc.Object, _mockFileSvc.Object, _mockExcelSvc.Object,
                _mockTxnSvc.Object, _mockAnomalySvc.Object, _mockRealtime.Object, _mockNotifSvc.Object,
                _mockDb.Object);
        }

        private static string CreateTempExcelFile()
        {
            var dir = Path.Combine(Path.GetTempPath(), "TransactionJobProcessorTests");
            Directory.CreateDirectory(dir);
            var path = Path.Combine(dir, "data.xlsx");
            if (!File.Exists(path))
                File.WriteAllBytes(path, new byte[] { 0 });
            return path;
        }

        private static UploadJobRow MakeJob(long id = 1, string status = "queued")
        {
            return new UploadJobRow
            {
                Id = id, CompanyId = 5, UserId = 10,
                JobType = "transaction_upload_excel",
                Status = status, FilePath = "/uploads/data.xlsx",
                FileOriginalName = "data.xlsx", FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                FileSize = 2048
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
        public async Task ProcessAsync_NoTransactions_MarksFailed()
        {
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetExcelFullPath(job.FilePath)).Returns("C:\\full\\data.xlsx");
            _mockExcelSvc.Setup(x => x.Extract(It.IsAny<Stream>(), "data.xlsx"))
                .Returns(new ExcelExtractionResult { FileName = "data.xlsx", TotalExtracted = 0 });
            _mockJobSvc.Setup(x => x.MarkFailed(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkFailed(1, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_DuplicateFileDetected_AllTransactionsExist_MarksCompletedAndNotifies()
        {
            var filePath = CreateTempExcelFile();
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetExcelFullPath(job.FilePath)).Returns(filePath);
            var extraction = new ExcelExtractionResult
            {
                FileName = "data.xlsx", TotalExtracted = 1,
                Transactions = new List<ExtractedTransaction>
                {
                    new() { TransactionDate = new System.DateTime(2026, 6, 1), Description = "Test", Amount = 100 }
                }
            };
            _mockExcelSvc.Setup(x => x.Extract(It.IsAny<Stream>(), "data.xlsx")).Returns(extraction);
            _mockAnomalySvc.Setup(x => x.RegisterTransactionFileUpload(
                5, "data.xlsx", "/uploads/data.xlsx", It.IsAny<long>(), 10,
                It.IsAny<string>(), It.IsAny<System.DateTime>(), It.IsAny<System.DateTime>()))
                .Returns((true, 1L, 42L, true, ""));
            // Set up DB mock to return a previous upload with same hash
            _mockDb.Setup(x => x.GetTransactionFileUploadsByHash(5, It.IsAny<string>(), null))
                .Returns(new List<TransactionFileUploadRow>
                {
                    new() { Id = 1 },
                    new() { Id = 2 } // previous upload
                });
            // Set up DB mock to return existing transactions matching the extracted ones
            _mockDb.Setup(x => x.GetTransactionsByFileUploadIds(It.Is<List<long>>(ids => ids.Contains(2))))
                .Returns(new List<TransactionRow>
                {
                    new()
                    {
                        Id = 100, CompanyId = 5,
                        TransactionDate = new System.DateTime(2026, 6, 1),
                        Description = "Test", Amount = 100
                    }
                });
            _mockJobSvc.Setup(x => x.MarkCompleted(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkCompleted(1, It.IsAny<string>()), Times.Once);
            _mockRealtime.Verify(x => x.CreateCompanyNotificationAsync(5,
                It.IsAny<NotificationMessage>(), It.IsAny<object>(), null, null), Times.Once);
            _mockTxnSvc.Verify(x => x.BulkCreate(It.IsAny<BulkCreateTransactionsRequest>(), It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public async Task ProcessAsync_DuplicateCheckFails_MarksFailed()
        {
            var filePath = CreateTempExcelFile();
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetExcelFullPath(job.FilePath)).Returns(filePath);
            var extraction = new ExcelExtractionResult
            {
                FileName = "data.xlsx", TotalExtracted = 5,
                Transactions = new List<ExtractedTransaction>
                {
                    new() { TransactionDate = new System.DateTime(2026, 6, 1), Description = "T1", Amount = 100 }
                }
            };
            _mockExcelSvc.Setup(x => x.Extract(It.IsAny<Stream>(), "data.xlsx")).Returns(extraction);
            _mockAnomalySvc.Setup(x => x.RegisterTransactionFileUpload(
                5, "data.xlsx", "/uploads/data.xlsx", It.IsAny<long>(), 10,
                It.IsAny<string>(), It.IsAny<System.DateTime>(), It.IsAny<System.DateTime>()))
                .Returns((false, null, null, false, "DB error"));
            _mockJobSvc.Setup(x => x.MarkFailed(1, "DB error"));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkFailed(1, "DB error"), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_Successful_CreatesTransactions()
        {
            var filePath = CreateTempExcelFile();
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetExcelFullPath(job.FilePath)).Returns(filePath);
            var extraction = new ExcelExtractionResult
            {
                FileName = "data.xlsx", TotalExtracted = 3,
                Transactions = new List<ExtractedTransaction>
                {
                    new() { TransactionDate = new System.DateTime(2026, 6, 1), Description = "T1", Amount = 100m },
                    new() { TransactionDate = new System.DateTime(2026, 6, 2), Description = "T2", Amount = 200m },
                }
            };
            _mockExcelSvc.Setup(x => x.Extract(It.IsAny<Stream>(), "data.xlsx")).Returns(extraction);
            _mockAnomalySvc.Setup(x => x.RegisterTransactionFileUpload(
                5, "data.xlsx", "/uploads/data.xlsx", It.IsAny<long>(), 10,
                It.IsAny<string>(), It.IsAny<System.DateTime>(), It.IsAny<System.DateTime>()))
                .Returns((true, 1L, null, false, ""));
            _mockTxnSvc.Setup(x => x.BulkCreate(It.IsAny<BulkCreateTransactionsRequest>(), 10))
                .Returns((true, new List<long> { 1, 2 }, ""));
            _mockJobSvc.Setup(x => x.MarkCompleted(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockTxnSvc.Verify(x => x.BulkCreate(It.IsAny<BulkCreateTransactionsRequest>(), 10), Times.Once);
            _mockJobSvc.Verify(x => x.MarkCompleted(1, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_BulkCreateFails_MarksFailed()
        {
            var filePath = CreateTempExcelFile();
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetExcelFullPath(job.FilePath)).Returns(filePath);
            var extraction = new ExcelExtractionResult
            {
                FileName = "data.xlsx", TotalExtracted = 2,
                Transactions = new List<ExtractedTransaction>
                {
                    new() { TransactionDate = new System.DateTime(2026, 6, 1), Description = "T1", Amount = 100 }
                }
            };
            _mockExcelSvc.Setup(x => x.Extract(It.IsAny<Stream>(), "data.xlsx")).Returns(extraction);
            _mockAnomalySvc.Setup(x => x.RegisterTransactionFileUpload(
                5, "data.xlsx", "/uploads/data.xlsx", It.IsAny<long>(), 10,
                It.IsAny<string>(), It.IsAny<System.DateTime>(), It.IsAny<System.DateTime>()))
                .Returns((true, 1L, null, false, ""));
            _mockTxnSvc.Setup(x => x.BulkCreate(It.IsAny<BulkCreateTransactionsRequest>(), 10))
                .Returns((false, new List<long>(), "Validation error"));
            _mockJobSvc.Setup(x => x.MarkFailed(1, "Validation error"));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkFailed(1, "Validation error"), Times.Once);
        }

        [Fact]
        public async Task ProcessAsync_ExceptionCaught_MarksFailed()
        {
            var job = MakeJob();
            _mockJobSvc.Setup(x => x.GetById(1)).Returns(job);
            _mockJobSvc.Setup(x => x.MarkProcessing(1));
            _mockJobSvc.Setup(x => x.UpdateProgress(It.IsAny<long>(), It.IsAny<int>(), It.IsAny<string?>()));
            _mockFileSvc.Setup(x => x.GetExcelFullPath(job.FilePath)).Throws(new System.Exception("Unexpected error"));
            _mockJobSvc.Setup(x => x.MarkFailed(1, It.IsAny<string>()));

            await _processor.ProcessAsync(1);

            _mockJobSvc.Verify(x => x.MarkFailed(1, It.IsAny<string>()), Times.Once);
        }
    }
}
