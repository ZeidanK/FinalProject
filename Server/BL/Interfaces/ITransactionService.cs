using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface ITransactionService
    {
        List<TransactionRow> GetByCompany(long companyId, string? type = null, bool? isMatched = null, DateTime? startDate = null, DateTime? endDate = null);
        TransactionRow? GetById(long id);
        (bool Success, long Id, string Error) Create(CreateTransactionRequest req, long createdByUserId);
        (bool Success, List<long> Ids, string Error) BulkCreate(BulkCreateTransactionsRequest req, long createdByUserId);
    }
}
