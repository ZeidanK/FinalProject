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
        private readonly DBservices _db;
        private readonly IMatchService? _matchService;

        // Constructor for DI (optional IMatchService to avoid circular dependency issues)
        public TransactionService(DBservices db, IMatchService? matchService = null)
        {
            _db = db;
            _matchService = matchService;
        }

        public List<TransactionRow> GetByCompany(
            long companyId, string? type = null, bool? isMatched = null,
            DateTime? startDate = null, DateTime? endDate = null) =>
            _db.GetTransactionsByCompany(companyId, type, isMatched, startDate, endDate);

        public TransactionRow? GetById(long id) => _db.GetTransactionById(id);

        public (bool Success, long Id, string Error) Create(
            CreateTransactionRequest req, long createdByUserId)
        {
            if (!_db.UserHasActiveCompanyAccess(createdByUserId, req.CompanyId))
                return (false, 0, "You do not have access to the selected company.");

            if (string.IsNullOrWhiteSpace(req.Description))
                return (false, 0, "Description is required.");
            if (req.Amount == 0)
                return (false, 0, "Amount cannot be zero.");

            var id = _db.CreateTransaction(
                req.CompanyId, createdByUserId,
                new TransactionInsertData
                {
                    TransactionDate  = req.TransactionDate,
                    PostedDate       = req.PostedDate,
                    Description      = req.Description.Trim(),
                    VendorName       = req.VendorName?.Trim(),
                    CardLast4        = req.CardLast4?.Trim(),
                    Amount           = req.Amount,
                    TransactionType  = req.TransactionType ?? "debit",
                    Category         = req.Category,
                    ReferenceNumber  = req.ReferenceNumber,
                    ChargeAmount     = req.ChargeAmount,
                    ChargeCurrency   = req.ChargeCurrency,
                    OriginalCurrency = req.OriginalCurrency,
                    ExchangeRate     = req.ExchangeRate
                });

            return id > 0
                ? (true, id, string.Empty)
                : (false, 0, "Failed to create transaction.");
        }

        public (bool Success, List<long> Ids, string Error) BulkCreate(
            BulkCreateTransactionsRequest req, long createdByUserId)
        {
            if (!_db.UserHasActiveCompanyAccess(createdByUserId, req.CompanyId))
                return (false, new List<long>(), "You do not have access to the selected company.");

            if (req.Transactions == null || req.Transactions.Count == 0)
                return (false, new List<long>(), "No transactions provided.");

            var rows = req.Transactions.Select(t => new TransactionInsertData
            {
                TransactionDate  = t.TransactionDate,
                PostedDate       = t.PostedDate,
                Description      = t.Description ?? string.Empty,
                VendorName       = t.VendorName,
                CardLast4        = t.CardLast4,
                Amount           = t.Amount,
                TransactionType  = t.TransactionType ?? "debit",
                Category         = t.Category,
                ReferenceNumber  = t.ReferenceNumber,
                ChargeAmount     = t.ChargeAmount,
                ChargeCurrency   = t.ChargeCurrency,
                OriginalCurrency = t.OriginalCurrency,
                ExchangeRate     = t.ExchangeRate
            });

            var ids = _db.BulkCreateTransactions(req.CompanyId, createdByUserId, rows);
            return (true, ids, string.Empty);
        }

        public bool Delete(long id)
        {
            if (id <= 0)
                return false;

            return _db.DeleteTransaction(id);
        }

        public (List<long> DeletedIds, List<long> NotFoundIds) BulkDelete(List<long> ids)
        {
            if (ids == null || ids.Count == 0)
                return (new List<long>(), new List<long>());

            var normalizedIds = ids.Where(i => i > 0).Distinct().ToList();
            if (normalizedIds.Count == 0)
                return (new List<long>(), new List<long>());

            return _db.BulkDeleteTransactions(normalizedIds);
        }

        /// <summary>
        /// Attempts to automatically match all unmatched invoices after bulk transaction import.
        /// Returns batch match results with counts and details.
        /// </summary>
        public async Task<AutoMatchBatchResult?> AutoMatchBatchAfterImportAsync(
            long companyId, long userId, decimal minConfidenceThreshold = 70m)
        {
            if (_matchService == null)
                return null;

            return await _matchService.AutoMatchBatchAsync(companyId, userId, minConfidenceThreshold);
        }
    }
}
