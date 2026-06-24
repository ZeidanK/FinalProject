namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IUploadJobWorker
    {
        Task ProcessInvoiceJobAsync(long jobId);
        Task ProcessTransactionJobAsync(long jobId);
    }
}
