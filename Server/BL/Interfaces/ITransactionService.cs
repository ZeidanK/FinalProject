using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface ITransactionService
    {
        PagedResponse<TransactionRow> GetByCompany(long companyId, TransactionFilterRequest filter);
        TransactionFilterOptionsResponse GetFilterOptions(long companyId);
        TransactionRow? GetById(long id);
        (bool Success, long Id, string Error) Create(CreateTransactionRequest req, long createdByUserId);
        (bool Success, List<long> Ids, string Error) BulkCreate(BulkCreateTransactionsRequest req, long createdByUserId);
        bool Delete(long id);
        (List<long> DeletedIds, List<long> NotFoundIds) BulkDelete(List<long> ids);
        int DeleteAllByCompany(long companyId);
        bool SetRequiresInvoice(long id, bool requiresInvoice);
        Task<AutoMatchBatchResult?> AutoMatchBatchAfterImportAsync(long companyId, long userId, decimal minConfidenceThreshold = 70m);
    }
}
