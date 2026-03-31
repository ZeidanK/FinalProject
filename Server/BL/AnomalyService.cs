using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for anomaly detection and resolution.
    /// </summary>
    public class AnomalyService : IAnomalyService
    {
        private readonly DBservices _db = new();

        public List<AnomalyRow> GetByCompany(
            long companyId, string? status = null,
            string? severity = null, string? type = null) =>
            _db.GetAnomaliesByCompany(companyId, status, severity, type);

        public AnomalyRow? GetById(long id) => _db.GetAnomalyById(id);

        public AnomalyStatsRow GetStats(long companyId) =>
            _db.GetAnomalyStats(companyId);

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
            var validStatuses = new HashSet<string> { "resolved", "dismissed", "false_positive" };
            var status = req.Status ?? "resolved";
            if (!validStatuses.Contains(status))
                return (false, "Invalid resolution status.");

            var ok = _db.ResolveAnomaly(id, resolvedByUserId, req.ResolutionNotes, status);
            return ok ? (true, string.Empty) : (false, "Anomaly not found or already resolved.");
        }
    }
}
