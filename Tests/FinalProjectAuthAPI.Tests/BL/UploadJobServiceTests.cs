using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class UploadJobServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly UploadJobService _service;

        public UploadJobServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _service = new UploadJobService(_mockDb.Object);
        }

        private static CreateUploadJobRequest MakeReq(long companyId = 1, long userId = 10) => new()
        {
            CompanyId = companyId,
            UserId = userId,
            JobType = "invoice_upload_pdf",
            FilePath = "/uploads/test.pdf",
        };

        [Fact]
        public void Create_Valid_ReturnsId()
        {
            var req = MakeReq();
            _mockDb.Setup(x => x.CreateUploadJob(req)).Returns(42);

            var id = _service.Create(req);

            Assert.Equal(42, id);
        }

        [Fact]
        public void Create_CompanyIdZero_Throws()
        {
            var ex = Assert.Throws<ArgumentException>(() => _service.Create(MakeReq(companyId: 0)));
            Assert.Contains("Company ID", ex.Message);
        }

        [Fact]
        public void Create_UserIdZero_Throws()
        {
            var ex = Assert.Throws<ArgumentException>(() => _service.Create(MakeReq(userId: 0)));
            Assert.Contains("User ID", ex.Message);
        }

        [Fact]
        public void Create_EmptyJobType_Throws()
        {
            var req = MakeReq();
            req.JobType = "  ";
            var ex = Assert.Throws<ArgumentException>(() => _service.Create(req));
            Assert.Contains("Job type", ex.Message);
        }

        [Fact]
        public void Create_EmptyFilePath_Throws()
        {
            var req = MakeReq();
            req.FilePath = null!;
            var ex = Assert.Throws<ArgumentException>(() => _service.Create(req));
            Assert.Contains("File path", ex.Message);
        }

        [Fact]
        public void SetHangfireJobId_Delegates()
        {
            _mockDb.Setup(x => x.SetUploadJobHangfireId(1, "abc")).Returns(true);
            Assert.True(_service.SetHangfireJobId(1, "abc"));
        }

        [Fact]
        public void MarkProcessing_Delegates()
        {
            _mockDb.Setup(x => x.MarkUploadJobProcessing(1)).Returns(true);
            Assert.True(_service.MarkProcessing(1));
        }

        [Fact]
        public void MarkCompleted_Delegates()
        {
            _mockDb.Setup(x => x.MarkUploadJobCompleted(1, "result")).Returns(true);
            Assert.True(_service.MarkCompleted(1, "result"));
        }

        [Fact]
        public void MarkFailed_Delegates()
        {
            _mockDb.Setup(x => x.MarkUploadJobFailed(1, "error")).Returns(true);
            Assert.True(_service.MarkFailed(1, "error"));
        }

        [Fact]
        public void TryBeginVerification_Delegates()
        {
            _mockDb.Setup(x => x.TryBeginUploadJobVerification(1)).Returns(true);
            Assert.True(_service.TryBeginVerification(1));
        }

        [Fact]
        public void MarkVerified_Delegates()
        {
            _mockDb.Setup(x => x.MarkUploadJobVerified(1, "result")).Returns(true);
            Assert.True(_service.MarkVerified(1, "result"));
        }

        [Fact]
        public void RestoreCompleted_Delegates()
        {
            _mockDb.Setup(x => x.RestoreUploadJobCompleted(1, "result", "error")).Returns(true);
            Assert.True(_service.RestoreCompleted(1, "result", "error"));
        }

        [Fact]
        public void UpdateProgress_Delegates()
        {
            _mockDb.Setup(x => x.UpdateUploadJobProgress(1, 50, "result")).Returns(true);
            Assert.True(_service.UpdateProgress(1, 50, "result"));
        }

        [Fact]
        public void GetById_ReturnsJob()
        {
            var job = new UploadJobRow { Id = 1 };
            _mockDb.Setup(x => x.GetUploadJobById(1)).Returns(job);
            Assert.Same(job, _service.GetById(1));
        }

        [Fact]
        public void GetByUser_Delegates()
        {
            var list = new List<UploadJobRow> { new() { Id = 1 } };
            _mockDb.Setup(x => x.GetUploadJobsByUser(10, null, null, 50)).Returns(list);
            Assert.Same(list, _service.GetByUser(10));
        }

        [Fact]
        public void Delete_VerifiedJob_ReturnsFalse()
        {
            var job = new UploadJobRow { Id = 1, Status = "verified" };
            _mockDb.Setup(x => x.GetUploadJobById(1)).Returns(job);
            Assert.False(_service.Delete(1));
            _mockDb.Verify(x => x.DeleteUploadJob(It.IsAny<long>()), Times.Never);
        }

        [Fact]
        public void Delete_NonVerifiedJob_ReturnsDbResult()
        {
            var job = new UploadJobRow { Id = 1, Status = "completed", FilePath = "/uploads/test.pdf" };
            _mockDb.Setup(x => x.GetUploadJobById(1)).Returns(job);
            _mockDb.Setup(x => x.DeleteUploadJob(1)).Returns(true);
            Assert.True(_service.Delete(1));
        }

        [Fact]
        public void Delete_JobNotFound_ReturnsDbResult()
        {
            _mockDb.Setup(x => x.GetUploadJobById(99)).Returns((UploadJobRow?)null);
            _mockDb.Setup(x => x.DeleteUploadJob(99)).Returns(false);
            Assert.False(_service.Delete(99));
        }

        [Fact]
        public void DeleteByCompany_DeletesNonVerifiedJobs()
        {
            var jobs = new List<UploadJobRow>
            {
                new() { Id = 1, Status = "completed" },
                new() { Id = 2, Status = "failed" },
            };
            _mockDb.Setup(x => x.GetUploadJobsByUser(0, 5, null, 200)).Returns(jobs);
            _mockDb.Setup(x => x.GetUploadJobById(1)).Returns(jobs[0]);
            _mockDb.Setup(x => x.GetUploadJobById(2)).Returns(jobs[1]);
            _mockDb.Setup(x => x.DeleteUploadJob(1)).Returns(true);
            _mockDb.Setup(x => x.DeleteUploadJob(2)).Returns(true);

            var count = _service.DeleteByCompany(5);
            Assert.Equal(2, count);
        }
    }
}
