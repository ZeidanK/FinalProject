namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IUploadJobWorker
    {
        Task ProcessInvoiceJobAsync(
            long jobId,
            string? filePath = null,
            string? fileOriginalName = null,
            string? fileType = null,
            long? fileSize = null,
            long? companyId = null,
            long? userId = null,
            string? jobType = null);
        Task ProcessTransactionJobAsync(long jobId);
    }
}
