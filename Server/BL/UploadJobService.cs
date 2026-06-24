using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class UploadJobService : IUploadJobService
    {
        private readonly DBservices _db;

        public UploadJobService(DBservices db)
        {
            _db = db;
        }

        public long Create(CreateUploadJobRequest request)
        {
            if (request.CompanyId <= 0)
                throw new ArgumentException("Company ID is required.");
            if (request.UserId <= 0)
                throw new ArgumentException("User ID is required.");
            if (string.IsNullOrWhiteSpace(request.JobType))
                throw new ArgumentException("Job type is required.");
            if (string.IsNullOrWhiteSpace(request.FilePath))
                throw new ArgumentException("File path is required.");

            return _db.CreateUploadJob(request);
        }

        public bool SetHangfireJobId(long jobId, string? hangfireJobId) =>
            _db.SetUploadJobHangfireId(jobId, hangfireJobId);

        public bool MarkProcessing(long jobId) => _db.MarkUploadJobProcessing(jobId);

        public bool MarkCompleted(long jobId, string? resultJson) =>
            _db.MarkUploadJobCompleted(jobId, resultJson);

        public bool MarkFailed(long jobId, string errorMessage) =>
            _db.MarkUploadJobFailed(jobId, errorMessage);

        public bool MarkVerified(long jobId) =>
            _db.MarkUploadJobVerified(jobId);

        public bool UpdateProgress(long jobId, int progressPercent, string? resultJson = null) =>
            _db.UpdateUploadJobProgress(jobId, progressPercent, resultJson);

        public UploadJobRow? GetById(long jobId) => _db.GetUploadJobById(jobId);

        public List<UploadJobRow> GetByUser(long userId, long? companyId = null, string? status = null, int take = 50) =>
            _db.GetUploadJobsByUser(userId, companyId, status, take);
    }
}
