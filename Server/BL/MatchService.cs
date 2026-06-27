using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class MatchService : IMatchService
    {
        private readonly DBservices _db;
        private readonly IGeminiExtractionService _gemini;
        private readonly RulePipelineEngine _pipelineEngine;

        // Confidence thresholds for automatic matching
        private const decimal HIGH_CONFIDENCE_THRESHOLD = 70m;
        private const decimal MEDIUM_CONFIDENCE_THRESHOLD = 50m;
        private const decimal LOW_CONFIDENCE_THRESHOLD = 30m;
        private const decimal MIN_SUGGESTION_THRESHOLD = 60m; // Gemini similarity threshold

        public MatchService(DBservices db, IGeminiExtractionService gemini, RulePipelineEngine pipelineEngine)
        {
            _db = db;
            _gemini = gemini;
            _pipelineEngine = pipelineEngine;
        }

        public List<MatchRow> GetByCompany(long companyId) =>
            _db.GetMatchesByCompany(companyId);

        public MatchRow? GetById(long id) => _db.GetMatchById(id);

        // ── Simple suggestions: exact date + exact amount match ────────────

        public List<SimpleMatchSuggestion> GetSimpleSuggestions(long companyId)
        {
            var invoices = _db.GetInvoicesByCompany(companyId, null, null, null, isMatched: false);
            var transactions = _db.GetCandidateTransactions(companyId);

            var results = new List<SimpleMatchSuggestion>();

            foreach (var invoice in invoices)
            {
                var remaining = invoice.TotalAmount - invoice.MatchedAmount;
                if (remaining <= 0) continue;

                foreach (var txn in transactions)
                {
                    // Skip installment transactions — they are handled by GetInstallmentSuggestions
                    if (string.Equals(txn.TransactionType, "תשלומים", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (txn.TransactionDate.Date == invoice.InvoiceDate.Date &&
                        Math.Abs(txn.Amount) == remaining)
                    {
                        results.Add(new SimpleMatchSuggestion
                        {
                            InvoiceId              = invoice.Id,
                            InvoiceNumber          = invoice.InvoiceNumber,
                            VendorName             = invoice.VendorName,
                            InvoiceAmount          = invoice.TotalAmount,
                            InvoiceDate            = invoice.InvoiceDate,
                            TransactionId          = txn.Id,
                            TransactionDescription = txn.Description,
                            TransactionAmount      = Math.Abs(txn.Amount),
                            TransactionDate        = txn.TransactionDate,
                            TransactionType        = txn.TransactionType,
                        });
                    }
                }
            }

            return results;
        }

        // ── Installment suggestions: grouped by invoice with partial-match progress ────────

        public List<InstallmentGroupSuggestion> GetInstallmentSuggestions(long companyId)
        {
            var invoices = _db.GetInvoicesByCompany(companyId, null, null, null, isMatched: null);
            var allCandidates = _db.GetCandidateTransactions(companyId);

            var installmentTxns = allCandidates
                .Where(t => string.Equals(t.TransactionType, "תשלומים", StringComparison.OrdinalIgnoreCase))
                .ToList();

            Console.WriteLine($"[DEBUG][תשלומים] Found {installmentTxns.Count} installment transactions for companyId={companyId}");
            foreach (var txn in installmentTxns)
                Console.WriteLine($"[DEBUG][תשלומים]   TxnId={txn.Id} | TransactionDate={txn.TransactionDate:yyyy-MM-dd} | ChargeDate={txn.PostedDate:yyyy-MM-dd} | Amount={txn.Amount} | ChargeAmount={txn.ChargeAmount} | Desc={txn.Description}");

            var results = new List<InstallmentGroupSuggestion>();

            static bool IsInstallmentMatch(MatchRow m) =>
                m.InstallmentNumber.HasValue ||
                !string.IsNullOrWhiteSpace(m.InstallmentNote) ||
                string.Equals(m.MatchMethod, "installment_simple", StringComparison.OrdinalIgnoreCase);

            static decimal GetEffectiveInstallmentAmount(TransactionCandidate t)
            {
                if (t.ChargeAmount.HasValue && t.ChargeAmount.Value > 0)
                    return Math.Abs(t.ChargeAmount.Value);

                return Math.Abs(t.Amount);
            }

            foreach (var invoice in invoices)
            {
                var existingMatches = _db.GetMatchesByInvoice(invoice.Id);
                var existingInstallmentMatches = existingMatches.Where(IsInstallmentMatch).ToList();

                var remaining = invoice.TotalAmount - invoice.MatchedAmount;
                if (remaining <= 0 && !existingInstallmentMatches.Any()) continue;

                var hasInstallmentMetadata =
                    (invoice.PaymentPlanTotalInstallments.HasValue && invoice.PaymentPlanTotalInstallments.Value > 1) ||
                    (invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0) ||
                    !string.IsNullOrWhiteSpace(invoice.PaymentPlanDescription);

                var hasInstallmentHistory = existingInstallmentMatches.Any();
                if (!hasInstallmentMetadata && !hasInstallmentHistory)
                    continue;

                // Must share the same transaction_date as the invoice date
                var dateCandidates = installmentTxns
                    .Where(t => t.TransactionDate.Date == invoice.InvoiceDate.Date)
                    .ToList();

                Console.WriteLine($"[DEBUG][תשלומים] Invoice #{invoice.InvoiceNumber} (Id={invoice.Id}, Date={invoice.InvoiceDate:yyyy-MM-dd}, Total={invoice.TotalAmount}) — {dateCandidates.Count} date-matching txns");

                var expectedInstallmentAmount =
                    invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0
                        ? invoice.PaymentPlanInstallmentAmount.Value
                        : (decimal?)null;

                // Keep installment candidates tied to the per-charge amount when available,
                // and fall back to remaining-balance matching for invoices without plan metadata.
                var amountCandidates = dateCandidates
                    .Where(t =>
                    {
                        var effectiveAmount = GetEffectiveInstallmentAmount(t);
                        if (effectiveAmount <= 0)
                            return false;

                        if (expectedInstallmentAmount.HasValue)
                            return Math.Abs(effectiveAmount - expectedInstallmentAmount.Value) < 2.00m;

                        return Math.Abs(effectiveAmount - remaining) < 2.00m ||
                               Math.Abs(Math.Abs(t.Amount) - remaining) < 2.00m ||
                               effectiveAmount < remaining;
                    })
                    .ToList();

                Console.WriteLine($"[DEBUG][תשלומים]   → {amountCandidates.Count} passed amount filter (invoiceTotal={invoice.TotalAmount})");
                foreach (var c in amountCandidates)
                    Console.WriteLine($"[DEBUG][תשלומים]     ✓ TxnId={c.Id} | TransactionDate={c.TransactionDate:yyyy-MM-dd} | ChargeDate={c.PostedDate:yyyy-MM-dd} | Amount={c.Amount} | ChargeAmount={c.ChargeAmount} | Desc={c.Description}");

                results.Add(new InstallmentGroupSuggestion
                {
                    InvoiceId               = invoice.Id,
                    InvoiceNumber           = invoice.InvoiceNumber,
                    VendorName              = invoice.VendorName,
                    TotalAmount             = invoice.TotalAmount,
                    InvoiceDate             = invoice.InvoiceDate,
                    AlreadyMatchedAmount    = existingInstallmentMatches.Sum(m => m.MatchedAmount),
                    RemainingAmount         = remaining,
                    ExpectedInstallments    = invoice.PaymentPlanTotalInstallments,
                    DetectedInstallmentCount = null,
                    AlreadyMatchedCount     = existingInstallmentMatches.Count,
                    InstallmentAmount       = expectedInstallmentAmount ?? 0,
                    SuggestedTransactions   = amountCandidates.Select(t => new SuggestedInstallmentTransaction
                    {
                        TransactionId   = t.Id,
                        TransactionDate = t.TransactionDate,
                        PostedDate      = t.PostedDate,
                        Description     = t.Description,
                        Amount          = GetEffectiveInstallmentAmount(t),
                        ChargeAmount    = t.ChargeAmount,
                        VendorName      = t.VendorName,
                    }).ToList(),
                    ExistingMatches = existingInstallmentMatches,
                });
            }

            return results;
        }

        // ── New Pipeline Engine: Deterministic Rule-Based Matching ──────────
        // Replaces the old Gemini-based suggestion flow with the new 5-layer
        // waterfall pipeline engine.

        /// <summary>
        /// Runs the new deterministic pipeline engine for a single invoice.
        /// Returns MatchSuggestionRow results for backward API compatibility.
        /// </summary>
        private async Task<List<MatchSuggestionRow>> RunPipelineForInvoiceAsync(long invoiceId)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice == null)
                return new List<MatchSuggestionRow>();

            // Fetch all unmatched transactions for the same company
            var transactionList = _db.GetTransactionsByCompany(
                invoice.CompanyId, type: null, isMatched: false, startDate: null, endDate: null);

            if (transactionList.Count == 0)
                return new List<MatchSuggestionRow>();

            // Build a single-element invoice list for the pipeline
            var invoiceList = new List<InvoiceRow> { invoice };

            // Execute the full 5-layer pipeline
            var pipelineResult = _pipelineEngine.Execute(invoiceList, transactionList);

            // Convert auto-matches to MatchSuggestionRow format
            var suggestions = new List<MatchSuggestionRow>();
            foreach (var match in pipelineResult.AutoMatches)
            {
                var txn = transactionList.FirstOrDefault(t => t.Id == match.TransactionId);
                if (txn == null) continue;

                suggestions.Add(new MatchSuggestionRow
                {
                    Id = match.TransactionId,
                    TransactionDate = txn.TransactionDate,
                    Description = txn.Description,
                    Amount = match.MatchedAmount,
                    TransactionType = txn.TransactionType,
                    ReferenceNumber = txn.ReferenceNumber,
                    AmountDifference = Math.Abs(match.MatchedAmount - invoice.TotalAmount),
                    MatchScore = (decimal)(match.Confidence * 100),
                    DaysDifference = Math.Abs((txn.TransactionDate.Date - invoice.InvoiceDate.Date).Days),
                    MatchReasons = new List<string>
                    {
                        $"[{match.RuleLayer}] {match.RuleName}",
                        match.MatchReason
                    }
                });
            }

            // Also add suggested matches (fallback for manual review) with lower scores
            foreach (var sm in pipelineResult.SuggestedMatches)
            {
                if (sm.InvoiceId != invoiceId) continue;

                suggestions.Add(new MatchSuggestionRow
                {
                    Id = sm.TransactionId,
                    TransactionDate = sm.TransactionDate,
                    Description = sm.TransactionDescription,
                    Amount = sm.TransactionAmount,
                    TransactionType = "debit",
                    ReferenceNumber = null,
                    AmountDifference = Math.Abs(sm.TransactionAmount - invoice.TotalAmount),
                    MatchScore = (decimal)(sm.FuzzyScore * 100),
                    DaysDifference = Math.Abs((sm.TransactionDate.Date - invoice.InvoiceDate.Date).Days),
                    MatchReasons = new List<string>
                    {
                        "Suggested match (fallback)",
                        $"Fuzzy score: {sm.FuzzyScore:P1}, Variance: {sm.AmountVariancePercent:F1}%"
                    }
                });
            }

            return suggestions
                .OrderByDescending(s => s.MatchScore)
                .ThenBy(s => s.AmountDifference)
                .ToList();
        }

        /// <summary>
        /// Runs the pipeline for all unmatched invoices in a company.
        /// Persists all auto-matches and returns the batch result.
        /// </summary>
        private async Task<AutoMatchBatchResult> RunPipelineBatchAsync(
            long companyId, long userId, decimal minConfidenceThreshold)
        {
            var result = new AutoMatchBatchResult();

            // Fetch all unmatched invoices and transactions for the company
            var invoices = _db.GetUnmatchedInvoicesByCompany(companyId);
            var transactions = _db.GetTransactionsByCompany(
                companyId, type: null, isMatched: false, startDate: null, endDate: null);

            if (invoices.Count == 0 || transactions.Count == 0)
                return result;

            // Run the full pipeline
            var pipelineResult = _pipelineEngine.Execute(invoices, transactions);

            // Persist all auto-matches
            foreach (var match in pipelineResult.AutoMatches)
            {
                // Hard rule: installment-plan invoices must NEVER get normal full/partial matches.
                // If the pipeline match is not tagged as installment (InstallmentNumber missing),
                // skip persistence for installment invoices.
                var invoice = invoices.FirstOrDefault(i => i.Id == match.InvoiceId) ?? _db.GetInvoiceById(match.InvoiceId);
                var isInstallmentInvoice =
                    (invoice?.PaymentPlanTotalInstallments.HasValue ?? false) &&
                    invoice.PaymentPlanTotalInstallments.Value > 1;

                if (isInstallmentInvoice && !match.InstallmentNumber.HasValue)
                    continue;

                var matchReq = RulePipelineEngine.ToCreateMatchRequest(match, userId);
                var createResult = Create(matchReq, userId);

                if (createResult.Success)
                {
                    result.SuccessfulMatches++;
                    result.MatchDetails.Add(new MatchDetail
                    {
                        InvoiceId = match.InvoiceId,
                        InvoiceNumber = string.Empty,
                        Success = true,
                        MatchScore = (decimal)(match.Confidence * 100),
                        Message = $"Auto-matched via {match.RuleName}"
                    });
                }
            }

            // For unmatched invoices that have suggested matches, return them for review
            var matchedInvoiceIds = new HashSet<long>(pipelineResult.AutoMatches.Select(m => m.InvoiceId));
            foreach (var invoice in invoices)
            {
                if (matchedInvoiceIds.Contains(invoice.Id)) continue;

                var invoiceSuggestions = pipelineResult.SuggestedMatches
                    .Where(s => s.InvoiceId == invoice.Id)
                    .ToList();

                if (invoiceSuggestions.Any())
                {
                    var bestSuggestion = invoiceSuggestions.First();
                    var score = (decimal)(bestSuggestion.FuzzyScore * 100);

                    if (score >= (decimal)MEDIUM_CONFIDENCE_THRESHOLD)
                    {
                        result.SuggestionsForReview.Add(new MatchDetail
                        {
                            InvoiceId = invoice.Id,
                            InvoiceNumber = invoice.InvoiceNumber,
                            Success = false,
                            MatchScore = score,
                            Message = $"Best suggestion: {bestSuggestion.VendorName} (score: {score:F1})"
                        });
                    }
                }

                result.SkippedInvoices++;
            }

            return result;
        }

        // ── Updated public methods that now use the pipeline engine ────────

        public async Task<List<MatchSuggestionRow>> GetSuggestionsAsync(long invoiceId)
        {
            Console.WriteLine($"\n[MATCH] ── GetSuggestionsAsync (Pipeline) for invoiceId={invoiceId} ──");
            return await RunPipelineForInvoiceAsync(invoiceId);
        }

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

            var best = suggestions[0];

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
            Console.WriteLine($"\n[MATCH] ── AutoMatchBatchAsync (Pipeline) for companyId={companyId} ──");
            return await RunPipelineBatchAsync(companyId, userId, minConfidenceThreshold);
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

            var invoice = _db.GetInvoiceById(req.InvoiceId);
            if (invoice == null)
                return (false, 0, "Invoice not found.");

            var remaining = invoice.TotalAmount - invoice.MatchedAmount;
            if (remaining <= 0)
                return (false, 0, "Invoice is already fully matched.");

            // Installments can have minor rounding/extraction deviations (e.g. expected 113.80 but txn is 117).
            // Normal (non-installment) matches keep the strict tolerance.
            var isInstallmentMatch = req.InstallmentNumber.HasValue;

            var installmentOverageTolerance = 2.00m; // allow small overage for installment payments
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

            // Learn vendor alias from manual matches
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
