using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IUploadJobNotificationService
    {
        Task NotifyUploadJobUpdatedAsync(IUploadJobService jobSvc, long jobId);
        Task NotifyDuplicateInvoiceAnomalyAsync(IAnomalyService anomalySvc, long companyId, long invoiceId);
        void LogUploadJobFailure(UploadJobRow job, string message, string? error, string level = "WARN");
    }
}
