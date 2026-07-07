using FinalProjectAuthAPI.BL.AnomalyDetection;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class AnomalyService : IAnomalyService
    {
        private readonly IDBservices _db;
        private readonly AnomalyCrudService _crud;
        private readonly DuplicateInvoiceService _duplicateInvoice;
        private readonly DuplicateFileDetectionService _duplicateFile;

        public AnomalyService(IDBservices db,
            AnomalyCrudService crud,
            DuplicateInvoiceService duplicateInvoice,
            DuplicateFileDetectionService duplicateFile)
        {
            _db = db;
            _crud = crud;
            _duplicateInvoice = duplicateInvoice;
            _duplicateFile = duplicateFile;
        }

        public List<AnomalyRow> GetByCompany(
            long companyId, string? status = null,
            string? severity = null, string? type = null)
        {
            var rows = _crud.GetByCompany(companyId, status, severity, type);
            return BuildGroupedRows(rows, status);
        }

        public AnomalyRow? GetById(long id)
        {
            var row = _crud.GetById(id);
            if (row is null)
                return null;

            PopulateRelatedItems(row, row.Status);
            if (row.RelatedItemsCount <= 0)
            {
                row.RelatedItemsCount = row.RelatedItems.Count;
            }

            return row;
        }

        public AnomalyStatsRow GetStats(long companyId)
        {
            var groupedRows = GetByCompany(companyId, status: null, severity: null, type: null);
            return _crud.GetStats(groupedRows);
        }

        public (bool Success, long Id, string Error) Create(CreateAnomalyRequest req) =>
            _crud.Create(req);

        public (bool Success, string Error) Resolve(long id, long resolvedByUserId, ResolveAnomalyRequest req) =>
            _crud.Resolve(id, resolvedByUserId, req);

        public (bool Success, string Error) KeepDuplicateInvoice(long id, long resolvedByUserId, KeepDuplicateInvoiceRequest req) =>
            _duplicateInvoice.KeepDuplicateInvoice(id, resolvedByUserId, req);

        public (bool Success, long AnomalyId, string Error) EnsureDuplicateInvoiceAnomaly(
            long companyId, long duplicateInvoiceId, string invoiceNumber,
            string vendorName, decimal totalAmount, DateTime invoiceDate, string currency) =>
            _duplicateInvoice.EnsureDuplicateInvoiceAnomaly(companyId, duplicateInvoiceId, invoiceNumber,
                vendorName, totalAmount, invoiceDate, currency);

        public (bool Success, long? UploadId, long? AnomalyId, bool IsDuplicate, string Error) RegisterTransactionFileUpload(
            long companyId, string fileOriginalName, string filePath, long fileSize,
            long uploadedByUserId, string fileHashSha256,
            DateTime? firstTransactionDate, DateTime? lastTransactionDate) =>
            _duplicateFile.RegisterTransactionFileUpload(companyId, fileOriginalName, filePath, fileSize,
                uploadedByUserId, fileHashSha256, firstTransactionDate, lastTransactionDate);

        private List<AnomalyRow> BuildGroupedRows(List<AnomalyRow> rows, string? status)
        {
            if (rows.Count == 0)
                return rows;

            var result = new List<AnomalyRow>();
            var duplicateGroups = new Dictionary<string, List<AnomalyRow>>(StringComparer.Ordinal);
            var processedDuplicateIds = new HashSet<long>();

            foreach (var row in rows)
            {
                if (string.Equals(row.AnomalyType, "duplicate", StringComparison.OrdinalIgnoreCase)
                    && row.RelatedInvoiceId.HasValue)
                {
                    if (processedDuplicateIds.Contains(row.Id))
                        continue;

                    var signature = _duplicateInvoice.TryGetInvoiceSignature(row.RelatedInvoiceId.Value);
                    if (signature == null)
                    {
                        PopulateRelatedItems(row, status);
                        result.Add(row);
                        continue;
                    }

                    var key = _duplicateInvoice.BuildInvoiceGroupKey(
                        row.CompanyId, signature.InvoiceNumber, signature.TotalAmount, signature.InvoiceDate);
                    var groupStatus = string.IsNullOrWhiteSpace(status) ? row.Status : status;
                    var lookupKey = $"{key}|status:{groupStatus}";
                    if (!duplicateGroups.TryGetValue(lookupKey, out var groupRows))
                    {
                        groupRows = _db.GetDuplicateInvoiceAnomaliesBySignature(
                            row.CompanyId,
                            signature.InvoiceNumber,
                            signature.TotalAmount,
                            signature.InvoiceDate,
                            groupStatus);

                        duplicateGroups[lookupKey] = groupRows;
                    }

                    if (groupRows.Count == 0)
                    {
                        PopulateRelatedItems(row, status);
                        result.Add(row);
                        continue;
                    }

                    foreach (var r in groupRows)
                        processedDuplicateIds.Add(r.Id);

                    var representative = groupRows
                        .OrderBy(r => r.CreatedAt)
                        .First();

                    PopulateRelatedItems(representative, status);
                    representative.GroupKey = key;
                    representative.RelatedItemsCount = representative.RelatedItems.Count;
                    representative.Amount = representative.RelatedItems
                        .Where(item => item.Amount.HasValue)
                        .Sum(item => item.Amount ?? 0m);

                    result.Add(representative);
                    continue;
                }

                if (string.Equals(row.AnomalyType, "duplicate_transaction_file", StringComparison.OrdinalIgnoreCase))
                {
                    PopulateRelatedItems(row, status);
                    if (row.RelatedItems.Count > 0)
                    {
                        var hash = row.RelatedItems.First().FileHash;
                        row.GroupKey = !string.IsNullOrWhiteSpace(hash)
                            ? _duplicateFile.BuildFileGroupKey(row.CompanyId, hash)
                            : null;
                    }

                    row.RelatedItemsCount = row.RelatedItems.Count;
                    result.Add(row);
                    continue;
                }

                row.RelatedItems = BuildSingleItemFallback(row);
                row.RelatedItemsCount = row.RelatedItems.Count;
                result.Add(row);
            }

            return result
                .OrderByDescending(r => r.CreatedAt)
                .ToList();
        }

        private void PopulateRelatedItems(AnomalyRow row, string? status)
        {
            if (string.Equals(row.AnomalyType, "duplicate", StringComparison.OrdinalIgnoreCase)
                && row.RelatedInvoiceId.HasValue)
            {
                var signature = _duplicateInvoice.TryGetInvoiceSignature(row.RelatedInvoiceId.Value);
                if (signature != null)
                {
                    row.GroupKey = _duplicateInvoice.BuildInvoiceGroupKey(
                        row.CompanyId,
                        signature.InvoiceNumber,
                        signature.TotalAmount,
                        signature.InvoiceDate);

                    row.RelatedItems = _db.GetDuplicateInvoicesBySignature(
                            row.CompanyId,
                            signature.InvoiceNumber,
                            signature.TotalAmount,
                            signature.InvoiceDate,
                            includeDeleted: !string.Equals(row.Status, "open", StringComparison.OrdinalIgnoreCase),
                            createdBefore: row.ResolvedAt)
                        .Select(invoice => new AnomalyRelatedItem
                        {
                            ItemType = "invoice",
                            EntityId = invoice.Id,
                            Label = $"Invoice #{invoice.InvoiceNumber} ({invoice.VendorName})",
                            Amount = invoice.TotalAmount,
                            Date = invoice.InvoiceDate,
                            Status = invoice.Status,
                            FileName = invoice.FileOriginalName,
                            FilePath = invoice.FilePath,
                            FileSize = invoice.FileSize,
                        })
                        .OrderBy(item => item.Status == "deleted" ? 1 : 0)
                        .ThenBy(item => item.Date ?? DateTime.MinValue)
                        .ToList();

                    return;
                }
            }

            if (string.Equals(row.AnomalyType, "duplicate_transaction_file", StringComparison.OrdinalIgnoreCase))
            {
                var linkedUploads = _db.GetTransactionFileUploadsByAnomalyId(row.Id);
                var fileHash = linkedUploads.FirstOrDefault()?.FileHashSha256;

                if (string.IsNullOrWhiteSpace(fileHash))
                {
                    fileHash = _db.GetClosestTransactionFileHash(
                        row.CompanyId,
                        row.CreatedAt);
                }

                var uploads = string.IsNullOrWhiteSpace(fileHash)
                    ? linkedUploads
                    : _db.GetTransactionFileUploadsByHash(
                        row.CompanyId,
                        fileHash,
                        string.Equals(row.Status, "open", StringComparison.OrdinalIgnoreCase)
                            ? null
                            : row.ResolvedAt);

                row.RelatedItems = uploads.Select((upload, index) => new AnomalyRelatedItem
                {
                    ItemType = "transaction_file",
                    EntityId = upload.Id,
                    Label = upload.FileOriginalName,
                    FileName = upload.FileOriginalName,
                    FilePath = upload.FilePath,
                    FileHash = upload.FileHashSha256,
                    FileSize = upload.FileSize,
                    UploadedAt = upload.CreatedAt,
                    Status = index == 0 ? "imported" : "not_imported",
                }).ToList();

                return;
            }

            row.RelatedItems = BuildSingleItemFallback(row);
        }

        private static List<AnomalyRelatedItem> BuildSingleItemFallback(AnomalyRow row)
        {
            var items = new List<AnomalyRelatedItem>();

            if (row.RelatedInvoiceId.HasValue)
            {
                items.Add(new AnomalyRelatedItem
                {
                    ItemType = "invoice",
                    EntityId = row.RelatedInvoiceId,
                    Amount = row.Amount,
                    Label = $"Invoice ID {row.RelatedInvoiceId}",
                });
            }

            if (row.RelatedTransactionId.HasValue)
            {
                items.Add(new AnomalyRelatedItem
                {
                    ItemType = "transaction",
                    EntityId = row.RelatedTransactionId,
                    Amount = row.Amount,
                    Label = $"Transaction ID {row.RelatedTransactionId}",
                });
            }

            if (row.RelatedMatchId.HasValue)
            {
                items.Add(new AnomalyRelatedItem
                {
                    ItemType = "match",
                    EntityId = row.RelatedMatchId,
                    Amount = row.Amount,
                    Label = $"Match ID {row.RelatedMatchId}",
                });
            }

            return items;
        }
    }
}
