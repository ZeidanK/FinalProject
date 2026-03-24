using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for invoice-transaction matching.
    /// </summary>
    public class MatchService
    {
        private readonly DBservices _db = new();

        public List<MatchRow> GetByCompany(long companyId) =>
            _db.GetMatchesByCompany(companyId);

        public MatchRow? GetById(long id) => _db.GetMatchById(id);

        public List<MatchSuggestionRow> GetSuggestions(long invoiceId) =>
            _db.GetMatchSuggestionsForInvoice(invoiceId);

        public (bool Success, long Id, string Error) Create(
            CreateMatchRequest req, long matchedByUserId)
        {
            if (req.InvoiceId <= 0)
                return (false, 0, "Invalid invoice ID.");
            if (req.TransactionId <= 0)
                return (false, 0, "Invalid transaction ID.");
            if (req.MatchedAmount <= 0)
                return (false, 0, "Matched amount must be greater than zero.");

            var id = _db.CreateMatch(
                req.InvoiceId, req.TransactionId, req.MatchedAmount,
                req.MatchMethod ?? "manual", matchedByUserId,
                req.MatchType ?? "full", req.MatchConfidence, req.MatchReason);

            return id > 0
                ? (true, id, string.Empty)
                : (false, 0, "Failed to create match.");
        }

        public bool Delete(long id) => _db.DeleteMatch(id);
    }
}
