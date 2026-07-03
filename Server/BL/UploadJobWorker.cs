using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.UploadProcessing;

namespace FinalProjectAuthAPI.BL
{
    public class UploadJobWorker : IUploadJobWorker
    {
        private readonly InvoiceJobProcessor _invoiceProcessor;
        private readonly TransactionJobProcessor _transactionProcessor;

        public UploadJobWorker(
            InvoiceJobProcessor invoiceProcessor,
            TransactionJobProcessor transactionProcessor)
        {
            _invoiceProcessor = invoiceProcessor;
            _transactionProcessor = transactionProcessor;
        }

        public async Task ProcessInvoiceJobAsync(long jobId) =>
            await _invoiceProcessor.ProcessAsync(jobId);

        public async Task ProcessTransactionJobAsync(long jobId) =>
            await _transactionProcessor.ProcessAsync(jobId);
    }
}
