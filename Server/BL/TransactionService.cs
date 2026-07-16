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
        private readonly IDBservices _db;
        private readonly IMatchService? _matchService;
        private readonly TransactionClassificationSettings _classificationSettings;

        // Constructor for DI (optional IMatchService to avoid circular dependency issues)
        public TransactionService(IDBservices db, IMatchService? matchService = null, TransactionClassificationSettings? classificationSettings = null)
        {
            _db = db;
            _matchService = matchService;
            _classificationSettings = classificationSettings ?? new TransactionClassificationSettings();
        }

        public PagedResponse<TransactionRow> GetByCompany(
            long companyId, TransactionFilterRequest filter) =>
            _db.GetTransactionsByCompany(companyId, filter);

        public TransactionFilterOptionsResponse GetFilterOptions(long companyId) =>
            _db.GetTransactionFilterOptions(companyId);

        public TransactionRow? GetById(long id) => _db.GetTransactionById(id);

        private bool ShouldRequireInvoice(string? transactionType, string? vendorName, string? description, bool? explicitValue)
        {
            if (explicitValue.HasValue)
                return explicitValue.Value;

            // Check transaction type
            if (!string.IsNullOrWhiteSpace(transactionType) &&
                _classificationSettings.NoInvoiceTransactionTypes.Any(t =>
                    string.Equals(t, transactionType, StringComparison.OrdinalIgnoreCase)))
                return false;

            // Check vendor name / description for known non-invoice patterns
            var textToCheck = $"{vendorName ?? ""} {description ?? ""}";
            if (_classificationSettings.NoInvoiceVendorPatterns.Any(p =>
                textToCheck.IndexOf(p, StringComparison.OrdinalIgnoreCase) >= 0))
                return false;

            return true;
        }

        public (bool Success, long Id, string Error) Create(
            CreateTransactionRequest req, long createdByUserId)
        {
            if (!_db.UserHasActiveCompanyAccess(createdByUserId, req.CompanyId))
                return (false, 0, "You do not have access to the selected company.");

            if (string.IsNullOrWhiteSpace(req.Description))
                return (false, 0, "Description is required.");
            if (req.Amount == 0)
                return (false, 0, "Amount cannot be zero.");

            var trxType = req.TransactionType ?? "debit";
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
                    TransactionType  = trxType,
                    Category         = req.Category,
                    RequiresInvoice  = ShouldRequireInvoice(trxType, req.VendorName, req.Description, req.RequiresInvoice),
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

            var rows = req.Transactions.Select(t =>
            {
                var trxType = t.TransactionType ?? "debit";
                return new TransactionInsertData
                {
                    TransactionDate  = t.TransactionDate,
                    PostedDate       = t.PostedDate,
                    Description      = t.Description ?? string.Empty,
                    VendorName       = t.VendorName,
                    CardLast4        = t.CardLast4,
                    Amount           = t.Amount,
                    TransactionType  = trxType,
                    Category         = t.Category,
                    RequiresInvoice  = ShouldRequireInvoice(trxType, t.VendorName, t.Description, t.RequiresInvoice),
                    ReferenceNumber  = t.ReferenceNumber,
                    ChargeAmount     = t.ChargeAmount,
                    ChargeCurrency   = t.ChargeCurrency,
                    OriginalCurrency = t.OriginalCurrency,
                    ExchangeRate     = t.ExchangeRate
                };
            });

            var ids = _db.BulkCreateTransactions(req.CompanyId, createdByUserId, rows, req.FileUploadId);
            return (true, ids, string.Empty);
        }

        public bool SetRequiresInvoice(long id, bool requiresInvoice)
        {
            if (id <= 0)
                return false;

            return _db.SetTransactionRequiresInvoice(id, requiresInvoice);
        }

        public bool Delete(long id)
        {
            if (id <= 0)
                return false;

            var txn = _db.GetTransactionById(id);
            if (txn == null)
                return false;

            var fileUploadId = txn.FileUploadId;
            var deleted = _db.DeleteTransaction(id);
            if (deleted && fileUploadId.HasValue)
                TryCleanupFileUpload(fileUploadId.Value);

            return deleted;
        }

        public (List<long> DeletedIds, List<long> NotFoundIds) BulkDelete(List<long> ids)
        {
            if (ids == null || ids.Count == 0)
                return (new List<long>(), new List<long>());

            var normalizedIds = ids.Where(i => i > 0).Distinct().ToList();
            if (normalizedIds.Count == 0)
                return (new List<long>(), new List<long>());

            var affectedUploadIds = new HashSet<long>();
            foreach (var id in normalizedIds)
            {
                var txn = _db.GetTransactionById(id);
                if (txn?.FileUploadId.HasValue == true)
                    affectedUploadIds.Add(txn.FileUploadId.Value);
            }

            var result = _db.BulkDeleteTransactions(normalizedIds);

            foreach (var uploadId in affectedUploadIds)
                TryCleanupFileUpload(uploadId);

            return result;
        }

        public int DeleteAllByCompany(long companyId)
        {
            if (companyId <= 0)
                return 0;

            var allIds = _db.GetTransactionIdsByCompany(companyId);
            if (allIds.Count == 0)
                return 0;

            var (deletedIds, _) = BulkDelete(allIds);
            return deletedIds.Count;
        }

        private void TryCleanupFileUpload(long fileUploadId)
        {
            var remaining = _db.CountTransactionsByFileUploadId(fileUploadId);
            if (remaining == 0)
                _db.DeleteTransactionFileUpload(fileUploadId);
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
