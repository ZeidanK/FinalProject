using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IInvoiceVerificationService
    {
        Task<InvoiceJobVerificationResult> VerifyJobAsync(
            long jobId,
            long verifiedByUserId,
            CreateInvoiceRequest? reviewedInvoice = null,
            bool automatic = false);

        Task<BulkInvoiceJobVerificationResponse> VerifyJobsAsync(
            IReadOnlyCollection<long> jobIds,
            long verifiedByUserId);
    }
}
