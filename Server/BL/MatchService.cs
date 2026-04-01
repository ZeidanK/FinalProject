using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for invoice-transaction matching with intelligent scoring.
    /// </summary>
    public class MatchService : IMatchService
    {
        private readonly DBservices _db = new();

        // Confidence thresholds for automatic matching
        private const decimal HIGH_CONFIDENCE_THRESHOLD = 70m;     // Auto-match above 70
        private const decimal MEDIUM_CONFIDENCE_THRESHOLD = 50m;   // Suggest above 50
        private const decimal LOW_CONFIDENCE_THRESHOLD = 30m;      // Show above 30

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
                req.MatchType ?? "full", req.MatchConfidence, req.MatchReason,
                req.InstallmentNumber, req.InstallmentNote);

            return id > 0
                ? (true, id, string.Empty)
                : (false, 0, "Failed to create match.");
        }

        public bool Delete(long id) => _db.DeleteMatch(id);

        /// <summary>
        /// Attempts to automatically match an invoice with the best transaction candidate.
        /// Only matches if confidence score exceeds threshold.
        /// </summary>
        public (bool Success, long? MatchId, string Message, decimal? MatchScore) AutoMatch(
            long invoiceId, 
            long userId, 
            decimal minConfidenceThreshold = HIGH_CONFIDENCE_THRESHOLD)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice == null)
                return (false, null, "Invoice not found.", null);
                
            var suggestions = GetSuggestions(invoiceId);
            
            if (!suggestions.Any())
                return (false, null, "No potential matches found.", null);

            var best = suggestions.First(); // Already ordered by match_score DESC

            if (best.MatchScore < minConfidenceThreshold)
                return (false, null, 
                    $"Best match score ({best.MatchScore:F1}) below threshold ({minConfidenceThreshold:F1}).", 
                    best.MatchScore);

            // Calculate which installment this would be
            var existingMatches = _db.GetMatchesByInvoice(invoiceId);
            var installmentNumber = existingMatches.Count + 1;
            var hasPaymentPlan = invoice.PaymentPlanTotalInstallments.HasValue;

            // Create the match
            var matchRequest = new CreateMatchRequest
            {
                InvoiceId = invoiceId,
                TransactionId = best.Id,
                MatchedAmount = best.Amount,
                MatchMethod = "automatic",
                MatchType = DetermineMatchType(invoice, best.Amount),
                MatchConfidence = best.MatchScore / 100m, // Convert to 0-1 scale
                MatchReason = BuildMatchReason(best, invoice),
                MatchedByUserId = userId,
                InstallmentNumber = hasPaymentPlan ? installmentNumber : null,
                InstallmentNote = hasPaymentPlan 
                    ? $"Payment {installmentNumber} of {invoice.PaymentPlanTotalInstallments}"
                    : null
            };

            var result = Create(matchRequest, userId);
            
            var message = hasPaymentPlan
                ? $"Auto-matched installment {installmentNumber}/{invoice.PaymentPlanTotalInstallments}. Score: {best.MatchScore:F1}%"
                : $"Auto-matched with {best.MatchScore:F1}% confidence.";
            
            return result.Success 
                ? (true, result.Id, message, best.MatchScore)
                : (false, null, result.Error, best.MatchScore);
        }

        /// <summary>
        /// Batch auto-match all unmatched invoices for a company.
        /// </summary>
        public AutoMatchBatchResult AutoMatchBatch(
            long companyId, 
            long userId, 
            decimal minConfidenceThreshold = HIGH_CONFIDENCE_THRESHOLD)
        {
            var result = new AutoMatchBatchResult();
            var unmatchedInvoices = _db.GetUnmatchedInvoicesByCompany(companyId);

            foreach (var invoice in unmatchedInvoices)
            {
                var matchResult = AutoMatch(invoice.Id, userId, minConfidenceThreshold);
                
                if (matchResult.Success)
                {
                    result.SuccessfulMatches++;
                    result.MatchDetails.Add(new MatchDetail
                    {
                        InvoiceId = invoice.Id,
                        InvoiceNumber = invoice.InvoiceNumber,
                        Success = true,
                        MatchScore = matchResult.MatchScore,
                        Message = matchResult.Message
                    });
                }
                else
                {
                    result.SkippedInvoices++;
                    if (matchResult.MatchScore.HasValue && matchResult.MatchScore >= MEDIUM_CONFIDENCE_THRESHOLD)
                    {
                        result.SuggestionsForReview.Add(new MatchDetail
                        {
                            InvoiceId = invoice.Id,
                            InvoiceNumber = invoice.InvoiceNumber,
                            Success = false,
                            MatchScore = matchResult.MatchScore,
                            Message = matchResult.Message
                        });
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Get confidence category for UI display.
        /// </summary>
        public static string GetConfidenceCategory(decimal matchScore)
        {
            if (matchScore >= HIGH_CONFIDENCE_THRESHOLD) return "high";
            if (matchScore >= MEDIUM_CONFIDENCE_THRESHOLD) return "medium";
            if (matchScore >= LOW_CONFIDENCE_THRESHOLD) return "low";
            return "very-low";
        }

        /// <summary>
        /// Get all matches for an invoice (shows installment payment history).
        /// </summary>
        public List<MatchRow> GetMatchesByInvoice(long invoiceId) =>
            _db.GetMatchesByInvoice(invoiceId);

        private static string DetermineMatchType(InvoiceRow invoice, decimal transactionAmount)
        {
            var remaining = invoice.TotalAmount - invoice.MatchedAmount;
            return Math.Abs(transactionAmount - remaining) < 0.01m ? "full" : "partial";
        }

        private static string BuildMatchReason(MatchSuggestionRow suggestion, InvoiceRow invoice)
        {
            var reasons = new List<string>();
            
            // Check if matches expected installment amount
            if (invoice.PaymentPlanInstallmentAmount.HasValue)
            {
                var diff = Math.Abs(suggestion.Amount - invoice.PaymentPlanInstallmentAmount.Value);
                if (diff < 1)
                    reasons.Add($"Matches installment amount ({invoice.PaymentPlanInstallmentAmount:C})");
                else if (diff < 10)
                    reasons.Add($"Close to installment amount (diff: {diff:C})");
            }
            
            if (suggestion.AmountDifference == 0)
                reasons.Add("Exact amount match");
            else if (suggestion.AmountDifference < 1)
                reasons.Add($"Amount difference: {suggestion.AmountDifference:C}");
            
            if (suggestion.DaysDifference == 0)
                reasons.Add("Same date");
            else if (suggestion.DaysDifference <= 7)
                reasons.Add($"Within {suggestion.DaysDifference} days");
            
            reasons.Add($"Score: {suggestion.MatchScore:F1}/100");
            
            return string.Join(", ", reasons);
        }

        private static string BuildMatchReason(MatchSuggestionRow suggestion)
        {
            var reasons = new List<string>();
            
            if (suggestion.AmountDifference == 0)
                reasons.Add("Exact amount match");
            else if (suggestion.AmountDifference < 1)
                reasons.Add($"Amount difference: {suggestion.AmountDifference:C}");
            
            if (suggestion.DaysDifference == 0)
                reasons.Add("Same date");
            else if (suggestion.DaysDifference <= 7)
                reasons.Add($"Within {suggestion.DaysDifference} days");
            
            reasons.Add($"Score: {suggestion.MatchScore:F1}/100");
            
            return string.Join(", ", reasons);
        }
    }

    // ── Result Models ────────────────────────────────────────────────────

    public class AutoMatchBatchResult
    {
        public int SuccessfulMatches { get; set; }
        public int SkippedInvoices { get; set; }
        public List<MatchDetail> MatchDetails { get; set; } = new();
        public List<MatchDetail> SuggestionsForReview { get; set; } = new();
    }

    public class MatchDetail
    {
        public long InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public bool Success { get; set; }
        public decimal? MatchScore { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
