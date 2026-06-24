using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using System.Security.Cryptography;
using System.Text;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for anomaly detection and resolution.
    /// </summary>
    public class AnomalyService : IAnomalyService
    {
        private readonly DBservices _db;

        public AnomalyService(DBservices db)
        {
            _db = db;
        }

        public List<AnomalyRow> GetByCompany(
            long companyId, string? status = null,
            string? severity = null, string? type = null)
        {
            var rows = _db.GetAnomaliesByCompany(companyId, status, severity, type);
            return BuildGroupedRows(rows, status);
        }

        public AnomalyRow? GetById(long id)
        {
            var row = _db.GetAnomalyById(id);
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
            var stats = new AnomalyStatsRow();

            foreach (var row in groupedRows)
            {
                var statusKey = string.IsNullOrWhiteSpace(row.Status) ? "open" : row.Status;
                var severityKey = string.IsNullOrWhiteSpace(row.Severity) ? "warning" : row.Severity;

                stats.ByStatus[statusKey] = stats.ByStatus.TryGetValue(statusKey, out var byStatus)
                    ? byStatus + 1
                    : 1;

                stats.BySeverity[severityKey] = stats.BySeverity.TryGetValue(severityKey, out var bySeverity)
                    ? bySeverity + 1
                    : 1;
            }

            return stats;
        }

        public (bool Success, long Id, string Error) Create(
            CreateAnomalyRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.AnomalyType))
                return (false, 0, "Anomaly type is required.");
            if (string.IsNullOrWhiteSpace(req.Title))
                return (false, 0, "Title is required.");

            var validSeverities = new HashSet<string> { "low", "medium", "high", "critical" };
            var severity = req.Severity ?? "medium";
            if (!validSeverities.Contains(severity))
                return (false, 0, "Invalid severity value.");

            var id = _db.CreateAnomaly(
                req.CompanyId, req.AnomalyType.Trim(), req.Title.Trim(),
                (req.Description ?? string.Empty).Trim(), severity,
                req.SuggestedAction, req.RelatedInvoiceId,
                req.RelatedTransactionId, req.RelatedMatchId,
                req.Amount, req.DetectionMethod ?? "ai",
                req.DetectionConfidence);

            return id > 0
                ? (true, id, string.Empty)
                : (false, 0, "Failed to create anomaly.");
        }

        public (bool Success, string Error) Resolve(
            long id, long resolvedByUserId,
            ResolveAnomalyRequest req)
        {
            var validStatuses = new HashSet<string> { "open", "resolved", "dismissed", "false_positive" };
            var status = (req.Status ?? "resolved").Trim().ToLowerInvariant();
            if (!validStatuses.Contains(status))
                return (false, "Invalid anomaly status.");

            var anomaly = _db.GetAnomalyById(id);
            if (anomaly is null)
                return (false, "Anomaly not found.");

            var idsToResolve = new List<long> { anomaly.Id };
            var duplicateInvoiceIds = new List<long>();

            if (string.Equals(anomaly.AnomalyType, "duplicate", StringComparison.OrdinalIgnoreCase)
                && anomaly.RelatedInvoiceId.HasValue)
            {
                var signature = TryGetInvoiceSignature(anomaly.RelatedInvoiceId.Value);
                if (signature != null)
                {
                    var groupRows = _db.GetDuplicateInvoiceAnomaliesBySignature(
                        anomaly.CompanyId,
                        signature.InvoiceNumber,
                        signature.TotalAmount,
                        signature.InvoiceDate,
                        status: null);

                    idsToResolve = groupRows.Select(x => x.Id).Distinct().ToList();
                    duplicateInvoiceIds = _db.GetDuplicateInvoicesBySignature(
                        anomaly.CompanyId,
                        signature.InvoiceNumber,
                        signature.TotalAmount,
                        signature.InvoiceDate)
                        .Select(x => x.Id)
                        .Distinct()
                        .ToList();
                }
            }
            else if (string.Equals(anomaly.AnomalyType, "duplicate_transaction_file", StringComparison.OrdinalIgnoreCase))
            {
                var uploads = _db.GetTransactionFileUploadsByAnomalyId(anomaly.Id);
                var hash = uploads.FirstOrDefault()?.FileHashSha256;
                if (!string.IsNullOrWhiteSpace(hash))
                {
                    var groupRows = _db.GetDuplicateFileAnomaliesByHash(anomaly.CompanyId, hash, status: null);
                    idsToResolve = groupRows.Select(x => x.Id).Distinct().ToList();
                }
            }

            var ok = idsToResolve.Count > 1
                ? _db.ResolveAnomalies(idsToResolve, resolvedByUserId, req.ResolutionNotes, status)
                : _db.ResolveAnomaly(id, resolvedByUserId, req.ResolutionNotes, status);

            if (ok && status == "open" && duplicateInvoiceIds.Count > 1)
            {
                _db.RestoreDuplicateInvoices(duplicateInvoiceIds);
            }

            return ok ? (true, string.Empty) : (false, "Anomaly not found or status could not be updated.");
        }

        public (bool Success, string Error) KeepDuplicateInvoice(
            long id, long resolvedByUserId,
            KeepDuplicateInvoiceRequest req)
        {
            if (req.KeepInvoiceId <= 0)
                return (false, "Invoice to keep is required.");

            var anomaly = _db.GetAnomalyById(id);
            if (anomaly is null)
                return (false, "Anomaly not found.");

            if (!_db.UserHasActiveCompanyAccess(resolvedByUserId, anomaly.CompanyId))
                return (false, "You do not have access to this company.");

            if (!string.Equals(anomaly.AnomalyType, "duplicate", StringComparison.OrdinalIgnoreCase)
                || !anomaly.RelatedInvoiceId.HasValue)
                return (false, "This anomaly is not a duplicate invoice group.");

            var signature = TryGetInvoiceSignature(anomaly.RelatedInvoiceId.Value);
            if (signature is null)
                return (false, "Could not identify the duplicate invoice group.");

            var groupRows = _db.GetDuplicateInvoiceAnomaliesBySignature(
                anomaly.CompanyId,
                signature.InvoiceNumber,
                signature.TotalAmount,
                signature.InvoiceDate,
                status: null);

            var anomalyIds = groupRows
                .Select(x => x.Id)
                .Distinct()
                .ToList();
            if (anomalyIds.Count == 0)
            {
                anomalyIds.Add(anomaly.Id);
            }

            var invoiceIds = _db.GetDuplicateInvoicesBySignature(
                anomaly.CompanyId,
                signature.InvoiceNumber,
                signature.TotalAmount,
                signature.InvoiceDate)
                .Select(x => x.Id)
                .Distinct()
                .ToList();

            if (invoiceIds.Count <= 1)
                return (false, "There are no duplicate invoices to resolve.");

            if (!invoiceIds.Contains(req.KeepInvoiceId))
                return (false, "The selected invoice is not part of this duplicate group.");

            var deletedInvoiceIds = invoiceIds
                .Where(invoiceId => invoiceId != req.KeepInvoiceId)
                .OrderBy(invoiceId => invoiceId)
                .ToList();

            var notes = string.IsNullOrWhiteSpace(req.ResolutionNotes)
                ? $"Kept invoice ID {req.KeepInvoiceId}; soft deleted duplicate invoice IDs: {string.Join(", ", deletedInvoiceIds)}."
                : req.ResolutionNotes.Trim();

            var ok = _db.ApplyDuplicateInvoiceDecision(
                anomalyIds,
                invoiceIds,
                req.KeepInvoiceId,
                resolvedByUserId,
                notes);

            return ok ? (true, string.Empty) : (false, "Failed to apply duplicate invoice decision.");
        }

        public (bool Success, long AnomalyId, string Error) EnsureDuplicateInvoiceAnomaly(
            long companyId,
            long duplicateInvoiceId,
            string invoiceNumber,
            string vendorName,
            decimal totalAmount,
            DateTime invoiceDate,
            string currency)
        {
            var existingId = _db.GetOpenDuplicateInvoiceAnomalyId(
                companyId,
                invoiceNumber,
                totalAmount,
                invoiceDate);

            if (existingId.HasValue)
                return (true, existingId.Value, string.Empty);

            var createResult = Create(new CreateAnomalyRequest
            {
                CompanyId = companyId,
                AnomalyType = "duplicate",
                Title = $"Duplicate invoice group: {invoiceNumber}",
                Description =
                    $"Duplicate invoice detected for invoice number '{invoiceNumber}', amount {totalAmount} {currency}, invoice date {invoiceDate:yyyy-MM-dd}. " +
                    $"Vendor: {vendorName}.",
                Severity = "high",
                SuggestedAction = "Review all duplicate receipts/invoices in this group and keep only the valid one(s).",
                RelatedInvoiceId = duplicateInvoiceId,
                Amount = totalAmount,
                DetectionMethod = "manual",
                DetectionConfidence = 1m,
            });

            return createResult.Success
                ? (true, createResult.Id, string.Empty)
                : (false, 0, createResult.Error);
        }

        public (bool Success, long? AnomalyId, bool IsDuplicate, string Error) RegisterTransactionFileUpload(
            long companyId,
            string fileOriginalName,
            string filePath,
            long fileSize,
            long uploadedByUserId,
            string fileHashSha256)
        {
            _db.EnsureTransactionFileUploadsTable();

            var uploadId = _db.CreateTransactionFileUpload(
                companyId,
                fileHashSha256,
                fileOriginalName,
                filePath,
                fileSize,
                uploadedByUserId);

            if (uploadId <= 0)
                return (false, null, false, "Failed to register uploaded file.");

            var uploadCount = _db.CountTransactionFileUploadsByHash(companyId, fileHashSha256);
            var isDuplicate = uploadCount > 1;
            if (!isDuplicate)
                return (true, null, false, string.Empty);

            var existingAnomalyId = _db.GetOpenDuplicateFileAnomalyId(companyId, fileHashSha256);
            long anomalyId;

            if (existingAnomalyId.HasValue)
            {
                anomalyId = existingAnomalyId.Value;
            }
            else
            {
                var createResult = Create(new CreateAnomalyRequest
                {
                    CompanyId = companyId,
                    AnomalyType = "duplicate_transaction_file",
                    Title = "Duplicate transaction file upload",
                    Description =
                        $"The uploaded Excel file matches a previously uploaded file (SHA-256: {fileHashSha256}). " +
                        "Review this file group to prevent importing duplicate bank transactions.",
                    Severity = "high",
                    SuggestedAction = "Keep one file upload and discard duplicate uploads.",
                    DetectionMethod = "manual",
                    DetectionConfidence = 1m,
                });

                if (!createResult.Success)
                    return (false, null, true, createResult.Error);

                anomalyId = createResult.Id;
            }

            _db.AssignTransactionFileUploadAnomaly(uploadId, anomalyId);
            return (true, anomalyId, true, string.Empty);
        }

        private sealed class InvoiceSignature
        {
            public string InvoiceNumber { get; set; } = string.Empty;
            public decimal TotalAmount { get; set; }
            public DateTime InvoiceDate { get; set; }
        }

        private InvoiceSignature? TryGetInvoiceSignature(long invoiceId)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice is null || string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
                return null;

            return new InvoiceSignature
            {
                InvoiceNumber = invoice.InvoiceNumber.Trim(),
                TotalAmount = invoice.TotalAmount,
                InvoiceDate = invoice.InvoiceDate.Date,
            };
        }

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

                    var signature = TryGetInvoiceSignature(row.RelatedInvoiceId.Value);
                    if (signature == null)
                    {
                        PopulateRelatedItems(row, status);
                        result.Add(row);
                        continue;
                    }

                    var key = BuildInvoiceGroupKey(row.CompanyId, signature.InvoiceNumber, signature.TotalAmount, signature.InvoiceDate);
                    if (!duplicateGroups.TryGetValue(key, out var groupRows))
                    {
                        groupRows = _db.GetDuplicateInvoiceAnomaliesBySignature(
                            row.CompanyId,
                            signature.InvoiceNumber,
                            signature.TotalAmount,
                            signature.InvoiceDate,
                            status);

                        duplicateGroups[key] = groupRows;
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
                            ? BuildFileGroupKey(row.CompanyId, hash)
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
                var signature = TryGetInvoiceSignature(row.RelatedInvoiceId.Value);
                if (signature != null)
                {
                    row.GroupKey = BuildInvoiceGroupKey(
                        row.CompanyId,
                        signature.InvoiceNumber,
                        signature.TotalAmount,
                        signature.InvoiceDate);

                    row.RelatedItems = _db.GetDuplicateInvoicesBySignature(
                            row.CompanyId,
                            signature.InvoiceNumber,
                            signature.TotalAmount,
                            signature.InvoiceDate)
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
                var uploads = _db.GetTransactionFileUploadsByAnomalyId(row.Id);
                row.RelatedItems = uploads.Select(upload => new AnomalyRelatedItem
                {
                    ItemType = "transaction_file",
                    EntityId = upload.Id,
                    Label = upload.FileOriginalName,
                    FileName = upload.FileOriginalName,
                    FilePath = upload.FilePath,
                    FileHash = upload.FileHashSha256,
                    FileSize = upload.FileSize,
                    UploadedAt = upload.CreatedAt,
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

        private static string BuildInvoiceGroupKey(
            long companyId,
            string invoiceNumber,
            decimal totalAmount,
            DateTime invoiceDate)
        {
            var raw = $"invoice|{companyId}|{invoiceNumber.Trim().ToLowerInvariant()}|{totalAmount:0.####}|{invoiceDate:yyyy-MM-dd}";
            return $"inv:{ComputeStableHash(raw)}";
        }

        private static string BuildFileGroupKey(long companyId, string fileHash)
        {
            var raw = $"file|{companyId}|{fileHash.Trim().ToLowerInvariant()}";
            return $"file:{ComputeStableHash(raw)}";
        }

        private static string ComputeStableHash(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
