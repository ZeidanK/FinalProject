using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for transaction management.
    /// </summary>
    public class TransactionService : ITransactionService
    {
        private readonly DBservices _db = new();

        public List<TransactionRow> GetByCompany(
            long companyId, string? type = null, bool? isMatched = null,
            DateTime? startDate = null, DateTime? endDate = null) =>
            _db.GetTransactionsByCompany(companyId, type, isMatched, startDate, endDate);

        public TransactionRow? GetById(long id) => _db.GetTransactionById(id);

        public (bool Success, long Id, string Error) Create(
            CreateTransactionRequest req, long createdByUserId)
        {
            if (string.IsNullOrWhiteSpace(req.Description))
                return (false, 0, "Description is required.");
            if (req.Amount == 0)
                return (false, 0, "Amount cannot be zero.");

            var id = _db.CreateTransaction(
                req.CompanyId, req.TransactionDate, req.Description.Trim(),
                req.Amount, req.TransactionType ?? "debit", createdByUserId,
                req.BankAccountId, req.PostedDate, req.BalanceAfter,
                req.Category, req.ReferenceNumber);

            return id > 0
                ? (true, id, string.Empty)
                : (false, 0, "Failed to create transaction.");
        }

        public (bool Success, List<long> Ids, string Error) BulkCreate(
            BulkCreateTransactionsRequest req, long createdByUserId)
        {
            if (req.Transactions == null || req.Transactions.Count == 0)
                return (false, new List<long>(), "No transactions provided.");

            var rows = req.Transactions.Select(t => (
                t.TransactionDate,
                t.Description ?? string.Empty,
                t.Amount,
                t.TransactionType ?? "debit",
                t.BankAccountId,
                t.PostedDate,
                t.BalanceAfter,
                t.Category,
                t.ReferenceNumber
            ));

            var ids = _db.BulkCreateTransactions(req.CompanyId, createdByUserId, rows);
            return (true, ids, string.Empty);
        }
    }
}
