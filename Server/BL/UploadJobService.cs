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

        public bool TryBeginVerification(long jobId) =>
            _db.TryBeginUploadJobVerification(jobId);

        public bool MarkVerified(long jobId, string? resultJson = null) =>
            _db.MarkUploadJobVerified(jobId, resultJson);

        public bool RestoreCompleted(long jobId, string? resultJson, string? errorMessage = null) =>
            _db.RestoreUploadJobCompleted(jobId, resultJson, errorMessage);

        public bool UpdateProgress(long jobId, int progressPercent, string? resultJson = null) =>
            _db.UpdateUploadJobProgress(jobId, progressPercent, resultJson);

        public UploadJobRow? GetById(long jobId) => _db.GetUploadJobById(jobId);

        public List<UploadJobRow> GetByUser(long userId, long? companyId = null, string? status = null, int take = 50) =>
            _db.GetUploadJobsByUser(userId, companyId, status, take);

        public bool Delete(long jobId)
        {
            var row = _db.GetUploadJobById(jobId);
            if (row != null && string.Equals(row.Status, UploadJobStatuses.Verified, StringComparison.OrdinalIgnoreCase))
                return false;

            if (row == null || string.IsNullOrWhiteSpace(row.FilePath))
                return _db.DeleteUploadJob(jobId);

            try
            {
                var fullPath = System.IO.Path.Combine(
                    System.IO.Path.GetFullPath(System.IO.Path.Combine(AppContext.BaseDirectory, "wwwroot")),
                    row.FilePath.Replace('/', System.IO.Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath))
                    System.IO.File.Delete(fullPath);
            }
            catch
            {
                // Best-effort file cleanup only.
            }

            return _db.DeleteUploadJob(jobId);
        }

        public int DeleteByCompany(long companyId, string? jobType = null)
        {
            var jobs = _db.GetUploadJobsByUser(0, companyId, null, 200)
                .Where(job => !string.Equals(job.Status, UploadJobStatuses.Verified, StringComparison.OrdinalIgnoreCase)
                    && (string.IsNullOrWhiteSpace(jobType)
                        || string.Equals(job.JobType, jobType, StringComparison.OrdinalIgnoreCase)))
                .ToList();
            var deleted = 0;
            foreach (var job in jobs)
            {
                if (Delete(job.Id))
                    deleted++;
            }
            return deleted;
        }
    }
}
