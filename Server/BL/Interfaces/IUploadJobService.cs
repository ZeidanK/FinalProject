using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IUploadJobService
    {
        long Create(CreateUploadJobRequest request);
        bool SetHangfireJobId(long jobId, string? hangfireJobId);
        bool MarkProcessing(long jobId);
        bool MarkCompleted(long jobId, string? resultJson);
        bool MarkFailed(long jobId, string errorMessage);
        bool TryBeginVerification(long jobId);
        bool MarkVerified(long jobId, string? resultJson = null);
        bool RestoreCompleted(long jobId, string? resultJson, string? errorMessage = null);
        bool UpdateProgress(long jobId, int progressPercent, string? resultJson = null);
        UploadJobRow? GetById(long jobId);
        List<UploadJobRow> GetByUser(long userId, long? companyId = null, string? status = null, int take = 50);
        bool Delete(long jobId);
        int DeleteByCompany(long companyId, string? jobType = null);
    }
}
