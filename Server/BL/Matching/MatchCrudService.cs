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

            var isInstallmentMatch = req.InstallmentNumber.HasValue;
            var installmentOverageTolerance = 2.00m;
            var normalOverageTolerance = 0.01m;
            var allowedOverage = isInstallmentMatch ? installmentOverageTolerance : normalOverageTolerance;

            if (req.MatchedAmount - remaining > allowedOverage)
                return (false, 0, $"Matched amount exceeds remaining balance ({remaining:F2}). AllowedOverage={allowedOverage:F2}");

            var id = _db.CreateMatch(
                req.InvoiceId, req.TransactionId, req.MatchedAmount,
                req.MatchMethod ?? "manual", matchedByUserId,
                req.MatchType ?? "full", req.MatchConfidence, req.MatchReason,
                req.InstallmentNumber, req.InstallmentNote);

            if (id <= 0)
                return (false, 0, "Failed to create match.");

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
                catch { }
            }

            return (true, id, string.Empty);
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
            catch { }

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
