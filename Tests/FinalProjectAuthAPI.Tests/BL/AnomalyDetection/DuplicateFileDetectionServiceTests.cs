using FinalProjectAuthAPI.BL.AnomalyDetection;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.AnomalyDetection
{
    public class DuplicateFileDetectionServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly Mock<AnomalyCrudService> _mockCrud;
        private readonly DuplicateFileDetectionService _service;

        public DuplicateFileDetectionServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _mockCrud = new Mock<AnomalyCrudService>(_mockDb.Object);
            _service = new DuplicateFileDetectionService(_mockDb.Object, _mockCrud.Object);
        }

        [Fact]
        public void RegisterTransactionFileUpload_UploadFails_ReturnsFailure()
        {
            _mockDb.Setup(x => x.EnsureTransactionFileUploadsTable());
            _mockDb.Setup(x => x.CreateTransactionFileUpload(5, "hash123", "file.xlsx",
                "/path", 1024L, 10)).Returns(0);

            var (success, uploadId, anomalyId, isDuplicate, error) = _service.RegisterTransactionFileUpload(
                5, "file.xlsx", "/path", 1024L, 10, "hash123",
                new System.DateTime(2026, 6, 1), new System.DateTime(2026, 6, 30));

            Assert.False(success);
            Assert.Null(uploadId);
            Assert.False(isDuplicate);
            Assert.Contains("Failed to register", error);
        }

        [Fact]
        public void RegisterTransactionFileUpload_FirstUpload_NotDuplicate()
        {
            _mockDb.Setup(x => x.EnsureTransactionFileUploadsTable());
            _mockDb.Setup(x => x.CreateTransactionFileUpload(5, "hash123", "file.xlsx",
                "/path", 1024L, 10)).Returns(1);
            _mockDb.Setup(x => x.CountTransactionFileUploadsByHash(5, "hash123")).Returns(1);

            var (success, uploadId, anomalyId, isDuplicate, error) = _service.RegisterTransactionFileUpload(
                5, "file.xlsx", "/path", 1024L, 10, "hash123",
                new System.DateTime(2026, 6, 1), new System.DateTime(2026, 6, 30));

            Assert.True(success);
            Assert.Equal(1, uploadId);
            Assert.Null(anomalyId);
            Assert.False(isDuplicate);
            Assert.Empty(error);
        }

        [Fact]
        public void RegisterTransactionFileUpload_Duplicate_ExistingAnomaly_Reuses()
        {
            _mockDb.Setup(x => x.EnsureTransactionFileUploadsTable());
            _mockDb.Setup(x => x.CreateTransactionFileUpload(5, "hash123", "file.xlsx",
                "/path", 1024L, 10)).Returns(2);
            _mockDb.Setup(x => x.CountTransactionFileUploadsByHash(5, "hash123")).Returns(2);
            _mockDb.Setup(x => x.GetOpenDuplicateFileAnomalyId(5, "hash123")).Returns(42);

            var (success, uploadId, anomalyId, isDuplicate, error) = _service.RegisterTransactionFileUpload(
                5, "file.xlsx", "/path", 1024L, 10, "hash123",
                new System.DateTime(2026, 6, 1), new System.DateTime(2026, 6, 30));

            Assert.True(success);
            Assert.Equal(2, uploadId);
            Assert.Equal(42, anomalyId);
            Assert.True(isDuplicate);
            _mockDb.Verify(x => x.AssignTransactionFileUploadAnomaly(2, 42), Times.Once);
        }

        [Fact]
        public void RegisterTransactionFileUpload_Duplicate_NewAnomaly_Creates()
        {
            _mockDb.Setup(x => x.EnsureTransactionFileUploadsTable());
            _mockDb.Setup(x => x.CreateTransactionFileUpload(5, "hash123", "file.xlsx",
                "/path", 1024L, 10)).Returns(2);
            _mockDb.Setup(x => x.CountTransactionFileUploadsByHash(5, "hash123")).Returns(2);
            _mockDb.Setup(x => x.GetOpenDuplicateFileAnomalyId(5, "hash123")).Returns((long?)null);
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateAnomalyRequest>())).Returns((true, 99, ""));

            var (success, uploadId, anomalyId, isDuplicate, error) = _service.RegisterTransactionFileUpload(
                5, "file.xlsx", "/path", 1024L, 10, "hash123",
                new System.DateTime(2026, 6, 1), new System.DateTime(2026, 6, 30));

            Assert.True(success);
            Assert.Equal(2, uploadId);
            Assert.Equal(99, anomalyId);
            Assert.True(isDuplicate);
        }

        [Fact]
        public void RegisterTransactionFileUpload_Duplicate_NewAnomalyFails_ReturnsFailure()
        {
            _mockDb.Setup(x => x.EnsureTransactionFileUploadsTable());
            _mockDb.Setup(x => x.CreateTransactionFileUpload(5, "hash123", "file.xlsx",
                "/path", 1024L, 10)).Returns(2);
            _mockDb.Setup(x => x.CountTransactionFileUploadsByHash(5, "hash123")).Returns(2);
            _mockDb.Setup(x => x.GetOpenDuplicateFileAnomalyId(5, "hash123")).Returns((long?)null);
            _mockCrud.Setup(x => x.Create(It.IsAny<CreateAnomalyRequest>())).Returns((false, 0, "Error"));

            var (success, uploadId, anomalyId, isDuplicate, error) = _service.RegisterTransactionFileUpload(
                5, "file.xlsx", "/path", 1024L, 10, "hash123",
                new System.DateTime(2026, 6, 1), new System.DateTime(2026, 6, 30));

            Assert.False(success);
            Assert.Equal(2, uploadId);
            Assert.True(isDuplicate);
        }

        [Fact]
        public void BuildFileGroupKey_ReturnsPrefixedHash()
        {
            var key = _service.BuildFileGroupKey(5, "hash123");
            Assert.StartsWith("file:", key);
            Assert.Equal(69, key.Length);
        }

        [Fact]
        public void BuildFileGroupKey_CaseInsensitive_ProducesSameKey()
        {
            var key1 = _service.BuildFileGroupKey(5, "HASH123");
            var key2 = _service.BuildFileGroupKey(5, "hash123");
            Assert.Equal(key1, key2);
        }
    }
}