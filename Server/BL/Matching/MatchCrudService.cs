using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Matching
{
    public class MatchCrudService
    {
        private readonly IDBservices _db;

        public MatchCrudService(IDBservices db)
        {
            _db = db;
        }

        public virtual List<MatchRow> GetByCompany(long companyId) =>
            _db.GetMatchesByCompany(companyId);

        public virtual MatchRow? GetById(long id) => _db.GetMatchById(id);

        public virtual List<MatchRow> GetMatchesByInvoice(long invoiceId) =>
            _db.GetMatchesByInvoice(invoiceId);

        public virtual (bool Success, long Id, string Error) Create(
            CreateMatchRequest req, long matchedByUserId)
        {
            if (req.InvoiceId <= 0)
                return (false, 0, "Invalid invoice ID.");
            if (req.TransactionId <= 0)
                return (false, 0, "Invalid transaction ID.");
            if (req.MatchedAmount <= 0)
                return (false, 0, "Matched amount must be greater than zero.");

            var invoice = _db.GetInvoiceById(req.InvoiceId);
            if (invoice == null)
                return (false, 0, "Invoice not found.");

            var remaining = invoice.TotalAmount - invoice.MatchedAmount;
            if (remaining <= 0)
                return (false, 0, "Invoice is already fully matched.");

            var allowedOverage = GetAllowedOverage(req, remaining);

            if (req.MatchedAmount - remaining > allowedOverage)
                return (false, 0, $"Matched amount exceeds remaining balance ({remaining:F2}). AllowedOverage={allowedOverage:F2}");

            var id = _db.CreateMatch(
                req.InvoiceId, req.TransactionId, req.MatchedAmount,
                req.MatchMethod ?? "manual", matchedByUserId,
                req.MatchType ?? "full", req.MatchConfidence, req.MatchReason,
                req.InstallmentNumber, req.InstallmentNote);

            if (id <= 0)
                return (false, 0, "Failed to create match.");

            TryCreateAmountMismatchAnomaly(req, invoice, id, remaining);

            if (string.Equals(req.MatchMethod, "manual", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var matchedInvoice = _db.GetInvoiceById(req.InvoiceId);
                    var txn = _db.GetTransactionById(req.TransactionId);
                    if (matchedInvoice != null && txn != null
                        && !string.IsNullOrWhiteSpace(matchedInvoice.VendorName)
                        && !string.IsNullOrWhiteSpace(txn.Description))
                    {
                        _db.RecordVendorAlias(matchedInvoice.CompanyId, matchedInvoice.VendorName, txn.Description);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WARN] Failed to record vendor alias for invoice #{req.InvoiceId}: {ex.Message}");
                }
            }

            return (true, id, string.Empty);
        }

        private decimal GetAllowedOverage(CreateMatchRequest req, decimal remaining)
        {
            if (req.InstallmentNumber.HasValue)
                return 2.00m;

            if (IsAutomaticAmountVarianceMatch(req))
                return Math.Max(2.00m, Math.Round(remaining * 0.01m, 2, MidpointRounding.AwayFromZero));

            return 0.01m;
        }

        private static bool IsAutomaticAmountVarianceMatch(CreateMatchRequest req)
        {
            if (!string.Equals(req.MatchMethod, "automatic", StringComparison.OrdinalIgnoreCase))
                return false;

            var reason = req.MatchReason ?? string.Empty;
            return reason.Contains("Small Variance", StringComparison.OrdinalIgnoreCase)
                || reason.Contains("Amount variance", StringComparison.OrdinalIgnoreCase)
                || reason.Contains("Variance:", StringComparison.OrdinalIgnoreCase);
        }

        private void TryCreateAmountMismatchAnomaly(
            CreateMatchRequest req,
            InvoiceRow invoice,
            long matchId,
            decimal expectedAmount)
        {
            if (!string.Equals(req.MatchMethod, "automatic", StringComparison.OrdinalIgnoreCase))
                return;

            if (req.InstallmentNumber.HasValue)
                return;

            var amountDifference = Math.Abs(req.MatchedAmount - expectedAmount);
            if (amountDifference <= 0.01m)
                return;

            var variancePercent = expectedAmount > 0
                ? amountDifference / expectedAmount * 100m
                : 0m;

            try
            {
                var invoiceLabel = !string.IsNullOrWhiteSpace(invoice.InvoiceNumber)
                    ? $"#{invoice.InvoiceNumber}"
                    : $"ID {invoice.Id}";

                _db.CreateAnomaly(
                    invoice.CompanyId,
                    "amount_mismatch",
                    $"Amount mismatch on invoice {invoiceLabel}",
                    $"Automatic matching accepted transaction {req.TransactionId} for invoice {invoiceLabel} with an amount variance. Expected amount: {expectedAmount:F2}; matched amount: {req.MatchedAmount:F2}; difference: {amountDifference:F2} ({variancePercent:F2}%).",
                    "medium",
                    "Review the matched transaction amount and resolve or dismiss this anomaly if the tolerated variance is acceptable.",
                    req.InvoiceId,
                    req.TransactionId,
                    matchId,
                    amountDifference,
                    "matching",
                    req.MatchConfidence);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] Failed to create amount mismatch anomaly for match #{matchId}: {ex.Message}");
            }
        }

        public virtual bool Delete(long id)
        {
            try
            {
                var match = _db.GetMatchById(id);
                if (match != null
                    && !string.IsNullOrWhiteSpace(match.VendorName)
                    && !string.IsNullOrWhiteSpace(match.TransactionDescription))
                {
                    var invoice = _db.GetInvoiceById(match.InvoiceId);
                    if (invoice != null)
                        _db.RejectVendorAlias(invoice.CompanyId, match.VendorName, match.TransactionDescription);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARN] Failed to reject vendor alias for match #{id}: {ex.Message}");
            }

            return _db.DeleteMatch(id);
        }

        public static string GetConfidenceCategory(decimal matchScore)
        {
            if (matchScore >= 70m) return "high";
            if (matchScore >= 50m) return "medium";
            if (matchScore >= 30m) return "low";
            return "very-low";
        }
    }
}
