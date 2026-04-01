using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class MatchService : IMatchService
    {
        private readonly DBservices _db = new();
        private readonly IGeminiExtractionService _gemini;

        // Confidence thresholds for automatic matching
        private const decimal HIGH_CONFIDENCE_THRESHOLD = 70m;
        private const decimal MEDIUM_CONFIDENCE_THRESHOLD = 50m;
        private const decimal LOW_CONFIDENCE_THRESHOLD = 30m;
        private const decimal MIN_SUGGESTION_THRESHOLD = 60m; // Gemini similarity threshold

        public MatchService(IGeminiExtractionService gemini)
        {
            _gemini = gemini;
        }

        public List<MatchRow> GetByCompany(long companyId) =>
            _db.GetMatchesByCompany(companyId);

        public MatchRow? GetById(long id) => _db.GetMatchById(id);

        // ── Suggestions: Date + Amount filter → Gemini name comparison ────

        public async Task<List<MatchSuggestionRow>> GetSuggestionsAsync(long invoiceId)
        {
            Console.WriteLine($"\n[MATCH] ── GetSuggestionsAsync called for invoiceId={invoiceId} ──");

            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice == null)
            {
                Console.WriteLine("[MATCH] Invoice not found. Returning empty.");
                return new List<MatchSuggestionRow>();
            }

            Console.WriteLine($"[MATCH] Invoice found: VendorName=\"{invoice.VendorName}\", Date={invoice.InvoiceDate:yyyy-MM-dd}, TotalAmount={invoice.TotalAmount}, MatchedAmount={invoice.MatchedAmount}, Remaining={invoice.TotalAmount - invoice.MatchedAmount}");
            Console.WriteLine($"[MATCH] PaymentPlan: Installments={invoice.PaymentPlanTotalInstallments}, InstallmentAmount={invoice.PaymentPlanInstallmentAmount}");

            var candidates = _db.GetCandidateTransactions(invoice.CompanyId);
            if (!candidates.Any())
            {
                Console.WriteLine("[MATCH] No unmatched transactions found for company. Returning empty.");
                return new List<MatchSuggestionRow>();
            }

            Console.WriteLine($"[MATCH] Found {candidates.Count} unmatched transactions for companyId={invoice.CompanyId}");

            return await FilterAndCompareAsync(invoice, candidates);
        }

        private async Task<List<MatchSuggestionRow>> FilterAndCompareAsync(
            InvoiceRow invoice,
            List<TransactionCandidate> candidates)
        {
            var remaining = invoice.TotalAmount - invoice.MatchedAmount;
            var installmentAmount = invoice.PaymentPlanInstallmentAmount;

            // ── Step 1: Filter by exact date and exact amount ────────────
            Console.WriteLine($"[MATCH] Step 1: Filtering {candidates.Count} candidates by date={invoice.InvoiceDate:yyyy-MM-dd} and amount (remaining={remaining}, installment={installmentAmount})");

            var filtered = new List<(TransactionCandidate Txn, string AmountReason)>();

            int dateRejects = 0;
            int amountRejects = 0;

            foreach (var txn in candidates)
            {
                // Exact date match
                if (txn.TransactionDate.Date != invoice.InvoiceDate.Date)
                {
                    dateRejects++;
                    continue;
                }

                // Exact amount match against remaining, installment, or undeclared installment
                if (txn.Amount == remaining)
                {
                    filtered.Add((txn, "Exact amount match"));
                    Console.WriteLine($"[MATCH]   ✓ TxnId={txn.Id} date={txn.TransactionDate:yyyy-MM-dd} amount={txn.Amount} desc=\"{txn.Description}\" → Exact amount match");
                }
                else if (installmentAmount.HasValue && installmentAmount.Value > 0
                         && txn.Amount == installmentAmount.Value)
                {
                    filtered.Add((txn, $"Matches installment amount ({installmentAmount.Value:F2})"));
                    Console.WriteLine($"[MATCH]   ✓ TxnId={txn.Id} amount={txn.Amount} → Installment match");
                }
                else if (remaining > 0 && txn.Amount > 0 && txn.Amount < remaining)
                {
                    // Detect undeclared installments: amount divides evenly into total
                    var ratio = invoice.TotalAmount / txn.Amount;
                    var rounded = Math.Round(ratio);
                    if (rounded >= 2 && rounded <= 12 && Math.Abs(ratio - rounded) < 0.02m)
                    {
                        filtered.Add((txn, $"Possible installment: 1/{rounded:F0} of total ({invoice.TotalAmount:F2})"));
                        Console.WriteLine($"[MATCH]   ✓ TxnId={txn.Id} amount={txn.Amount} → Undeclared installment 1/{rounded:F0}");
                    }
                    else
                    {
                        amountRejects++;
                    }
                }
                else
                {
                    amountRejects++;
                }
            }

            Console.WriteLine($"[MATCH] Step 1 result: {filtered.Count} passed, {dateRejects} rejected by date, {amountRejects} rejected by amount (same date but wrong amount)");

            if (!filtered.Any())
            {
                Console.WriteLine("[MATCH] No candidates after date+amount filter. Returning empty.");

                // Log a sample of what dates/amounts exist for debugging
                var sampleTxns = candidates.Take(5).ToList();
                foreach (var s in sampleTxns)
                    Console.WriteLine($"[MATCH]   Sample txn: id={s.Id} date={s.TransactionDate:yyyy-MM-dd} amount={s.Amount} desc=\"{s.Description}\"");

                return new List<MatchSuggestionRow>();
            }

            // ── Step 2: Send to Gemini for vendor name comparison ────────
            // Use transaction vendor_name if available, fall back to description
            var vendorNames = filtered
                .Select(f => !string.IsNullOrWhiteSpace(f.Txn.VendorName) ? f.Txn.VendorName : f.Txn.Description)
                .ToList();
            Console.WriteLine($"[MATCH] Step 2: Sending {vendorNames.Count} transaction vendor names to Gemini for comparison against invoice vendor \"{invoice.VendorName}\"");
            foreach (var (vn, i) in vendorNames.Select((v, i) => (v, i)))
                Console.WriteLine($"[MATCH]   Txn vendor[{i}]: \"{vn}\" (from {(!string.IsNullOrWhiteSpace(filtered[i].Txn.VendorName) ? "vendor_name" : "description")})");

            // Build results — if invoice vendor name is empty, skip Gemini and return date+amount matches as-is
            if (string.IsNullOrWhiteSpace(invoice.VendorName))
            {
                Console.WriteLine("[MATCH] Invoice vendor name is empty — skipping Gemini, returning all date+amount matches with score=50");
                return filtered.Select(f => new MatchSuggestionRow
                {
                    Id              = f.Txn.Id,
                    TransactionDate = f.Txn.TransactionDate,
                    Description     = f.Txn.Description,
                    Amount          = f.Txn.Amount,
                    TransactionType = f.Txn.TransactionType,
                    ReferenceNumber = f.Txn.ReferenceNumber,
                    AmountDifference = Math.Abs(f.Txn.Amount - remaining),
                    MatchScore      = 50, // No name comparison possible
                    DaysDifference  = 0,
                    MatchReasons    = new List<string> { "Same date", f.AmountReason, "Vendor name not available" }
                }).ToList();
            }

            var comparisonResults = await _gemini.CompareVendorNamesAsync(invoice.VendorName, vendorNames);
            Console.WriteLine($"[MATCH] Gemini returned {comparisonResults.Count} comparison results");

            foreach (var cr in comparisonResults)
                Console.WriteLine($"[MATCH]   Gemini: \"{cr.TransactionDescription}\" → similarity={cr.SimilarityScore}%");

            var results = new List<MatchSuggestionRow>();

            for (int i = 0; i < filtered.Count; i++)
            {
                var (txn, amountReason) = filtered[i];
                var vendorNameUsed = vendorNames[i];
                // If Gemini returned empty (API down), give score at threshold so date+amount matches still appear
                var similarity = comparisonResults.Count == 0
                    ? MIN_SUGGESTION_THRESHOLD
                    : (i < comparisonResults.Count ? comparisonResults[i].SimilarityScore : 0);

                if (similarity < MIN_SUGGESTION_THRESHOLD)
                    continue;

                results.Add(new MatchSuggestionRow
                {
                    Id              = txn.Id,
                    TransactionDate = txn.TransactionDate,
                    Description     = txn.Description,
                    Amount          = txn.Amount,
                    TransactionType = txn.TransactionType,
                    ReferenceNumber = txn.ReferenceNumber,
                    AmountDifference = Math.Abs(txn.Amount - remaining),
                    MatchScore      = similarity,
                    DaysDifference  = 0,
                    MatchReasons    = new List<string> { "Same date", amountReason, $"Vendor name similarity: {similarity}%" }
                });
            }

            var finalResults = results
                .OrderByDescending(r => r.MatchScore)
                .ThenBy(r => r.AmountDifference)
                .ToList();

            Console.WriteLine($"[MATCH] ── Final: returning {finalResults.Count} suggestions (threshold={MIN_SUGGESTION_THRESHOLD}%) ──");
            foreach (var r in finalResults)
                Console.WriteLine($"[MATCH]   Result: TxnId={r.Id} desc=\"{r.Description}\" amount={r.Amount} score={r.MatchScore} reasons=[{string.Join(", ", r.MatchReasons)}]");

            return finalResults;
        }

        // ── Match creation & vendor alias learning ────────────────────────

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

            if (id <= 0)
                return (false, 0, "Failed to create match.");

            // Learn vendor alias from manual matches
            if (string.Equals(req.MatchMethod, "manual", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var invoice = _db.GetInvoiceById(req.InvoiceId);
                    var txn = _db.GetTransactionById(req.TransactionId);
                    if (invoice != null && txn != null
                        && !string.IsNullOrWhiteSpace(invoice.VendorName)
                        && !string.IsNullOrWhiteSpace(txn.Description))
                    {
                        _db.RecordVendorAlias(invoice.CompanyId, invoice.VendorName, txn.Description);
                    }
                }
                catch { /* alias learning is best-effort */ }
            }

            return (true, id, string.Empty);
        }

        public bool Delete(long id)
        {
            // Record rejection signal for vendor alias before deleting
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
            catch { /* rejection signal is best-effort */ }

            return _db.DeleteMatch(id);
        }

        // ── Auto-matching ─────────────────────────────────────────────────

        public async Task<(bool Success, long? MatchId, string Message, decimal? MatchScore)> AutoMatchAsync(
            long invoiceId,
            long userId,
            decimal minConfidenceThreshold = HIGH_CONFIDENCE_THRESHOLD)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice == null)
                return (false, null, "Invoice not found.", null);

            var suggestions = await GetSuggestionsAsync(invoiceId);

            if (!suggestions.Any())
                return (false, null, "No potential matches found.", null);

            var best = suggestions.First();

            if (best.MatchScore < minConfidenceThreshold)
                return (false, null,
                    $"Best match score ({best.MatchScore:F1}) below threshold ({minConfidenceThreshold:F1}).",
                    best.MatchScore);

            var existingMatches = _db.GetMatchesByInvoice(invoiceId);
            var installmentNumber = existingMatches.Count + 1;
            var hasPaymentPlan = invoice.PaymentPlanTotalInstallments.HasValue;

            var matchRequest = new CreateMatchRequest
            {
                InvoiceId = invoiceId,
                TransactionId = best.Id,
                MatchedAmount = best.Amount,
                MatchMethod = "automatic",
                MatchType = DetermineMatchType(invoice, best.Amount),
                MatchConfidence = best.MatchScore / 100m,
                MatchReason = string.Join(", ", best.MatchReasons),
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

        public async Task<AutoMatchBatchResult> AutoMatchBatchAsync(
            long companyId,
            long userId,
            decimal minConfidenceThreshold = HIGH_CONFIDENCE_THRESHOLD)
        {
            var result = new AutoMatchBatchResult();
            var unmatchedInvoices = _db.GetUnmatchedInvoicesByCompany(companyId);

            foreach (var invoice in unmatchedInvoices)
            {
                var matchResult = await AutoMatchAsync(invoice.Id, userId, minConfidenceThreshold);

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

        public static string GetConfidenceCategory(decimal matchScore)
        {
            if (matchScore >= HIGH_CONFIDENCE_THRESHOLD) return "high";
            if (matchScore >= MEDIUM_CONFIDENCE_THRESHOLD) return "medium";
            if (matchScore >= LOW_CONFIDENCE_THRESHOLD) return "low";
            return "very-low";
        }

        public List<MatchRow> GetMatchesByInvoice(long invoiceId) =>
            _db.GetMatchesByInvoice(invoiceId);

        private static string DetermineMatchType(InvoiceRow invoice, decimal transactionAmount)
        {
            var remaining = invoice.TotalAmount - invoice.MatchedAmount;
            return Math.Abs(transactionAmount - remaining) < 0.01m ? "full" : "partial";
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
