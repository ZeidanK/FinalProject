using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.AnomalyDetection
{
    public class AnomalyCrudService
    {
        private readonly IDBservices _db;

        public AnomalyCrudService(IDBservices db)
        {
            _db = db;
        }

        public virtual List<AnomalyRow> GetByCompany(
            long companyId, string? status = null,
            string? severity = null, string? type = null)
        {
            return _db.GetAnomaliesByCompany(companyId, status, severity, type);
        }

        public virtual AnomalyRow? GetById(long id)
        {
            return _db.GetAnomalyById(id);
        }

        public virtual AnomalyStatsRow GetStats(List<AnomalyRow> rows)
        {
            var stats = new AnomalyStatsRow();

            foreach (var row in rows)
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

        public virtual (bool Success, long Id, string Error) Create(CreateAnomalyRequest req)
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

        public virtual (bool Success, string Error) Resolve(
            long id, long resolvedByUserId,
            ResolveAnomalyRequest req)
        {
            var validStatuses = new HashSet<string> { "open", "resolved", "dismissed" };
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
                var invoice = _db.GetInvoiceById(anomaly.RelatedInvoiceId.Value);
                if (invoice != null && !string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
                {
                    var groupRows = _db.GetDuplicateInvoiceAnomaliesBySignature(
                        anomaly.CompanyId,
                        invoice.InvoiceNumber.Trim(),
                        invoice.TotalAmount,
                        invoice.InvoiceDate.Date,
                        status: anomaly.Status);

                    idsToResolve = groupRows.Select(x => x.Id).Distinct().ToList();
                    duplicateInvoiceIds = _db.GetDuplicateInvoicesBySignature(
                        anomaly.CompanyId,
                        invoice.InvoiceNumber.Trim(),
                        invoice.TotalAmount,
                        invoice.InvoiceDate.Date)
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
                    var groupRows = _db.GetDuplicateFileAnomaliesByHash(anomaly.CompanyId, hash, status: anomaly.Status);
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
    }
}
