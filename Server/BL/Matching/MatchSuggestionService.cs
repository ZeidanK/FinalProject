using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using System.Text.RegularExpressions;

namespace FinalProjectAuthAPI.BL.Matching
{
    public class MatchSuggestionService
    {
        private const decimal InstallmentAmountTolerance = 2.00m;

        private static readonly Regex InstallmentNumberPattern = new(
            "(?<number>\\d+)\\s*(?:of|\u05de\u05ea\u05d5\u05da)\\s*\\d+",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static readonly Regex InstallmentPrefixPattern = new(
            "(?:payment|\u05ea\u05e9\u05dc\u05d5\u05dd)\\s*(?<number>\\d+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private readonly IDBservices _db;
        private readonly IRulePipelineEngine _pipelineEngine;

        public MatchSuggestionService(IDBservices db, IRulePipelineEngine pipelineEngine)
        {
            _db = db;
            _pipelineEngine = pipelineEngine;
        }

        private static bool IsWithinInstallmentAmountTolerance(decimal actual, decimal expected)
        {
            return Math.Abs(actual - expected) < InstallmentAmountTolerance;
        }

        private static int? TryParseInstallmentNumber(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return null;

            var match = InstallmentNumberPattern.Match(description);
            if (!match.Success)
                match = InstallmentPrefixPattern.Match(description);

            if (!match.Success)
                return null;

            return int.TryParse(match.Groups["number"].Value, out var installmentNumber) && installmentNumber > 0
                ? installmentNumber
                : null;
        }

        private static decimal? GetFirstInstallmentResidualAmount(InvoiceRow invoice, decimal regularInstallmentAmount)
        {
            if (!invoice.PaymentPlanTotalInstallments.HasValue ||
                invoice.PaymentPlanTotalInstallments.Value <= 1 ||
                regularInstallmentAmount <= 0)
                return null;

            var residual = invoice.TotalAmount -
                           regularInstallmentAmount * (invoice.PaymentPlanTotalInstallments.Value - 1);

            return residual > 0
                ? Math.Round(residual, 2, MidpointRounding.AwayFromZero)
                : null;
        }

        private static decimal? GetObservedRegularInstallmentAmount(
            IEnumerable<TransactionCandidate> candidates,
            decimal expectedInstallmentAmount)
        {
            return candidates
                .Select(t => new
                {
                    InstallmentNumber = TryParseInstallmentNumber(t.Description),
                    Amount = TransactionAmountHelper.GetInstallmentReconciliationAmount(t),
                })
                .Where(t =>
                    t.Amount > 0 &&
                    t.InstallmentNumber.HasValue &&
                    t.InstallmentNumber.Value > 1 &&
                    IsWithinInstallmentAmountTolerance(t.Amount, expectedInstallmentAmount))
                .GroupBy(t => Math.Round(t.Amount, 2, MidpointRounding.AwayFromZero))
                .OrderByDescending(g => g.Count())
                .ThenBy(g => Math.Abs(g.Key - expectedInstallmentAmount))
                .Select(g => (decimal?)g.Key)
                .FirstOrDefault();
        }

        private static bool MatchesExpectedInstallmentAmount(
            InvoiceRow invoice,
            TransactionCandidate txn,
            decimal effectiveAmount,
            decimal expectedInstallmentAmount,
            decimal? observedRegularInstallmentAmount)
        {
            if (IsWithinInstallmentAmountTolerance(effectiveAmount, expectedInstallmentAmount))
                return true;

            if (TryParseInstallmentNumber(txn.Description) != 1)
                return false;

            var regularAmounts = new List<decimal> { expectedInstallmentAmount };
            if (observedRegularInstallmentAmount.HasValue && observedRegularInstallmentAmount.Value > 0)
                regularAmounts.Add(observedRegularInstallmentAmount.Value);

            return regularAmounts
                .Distinct()
                .Select(regularAmount => GetFirstInstallmentResidualAmount(invoice, regularAmount))
                .Any(residualAmount =>
                    residualAmount.HasValue &&
                    IsWithinInstallmentAmountTolerance(effectiveAmount, residualAmount.Value));
        }

        public virtual List<SimpleMatchSuggestion> GetSimpleSuggestions(long companyId)
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
                    if (TxPoolClassifier.IsInstallmentTxn(txn))
                        continue;

                    if (!txn.RequiresInvoice)
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

        public virtual List<InstallmentGroupSuggestion> GetInstallmentSuggestions(long companyId)
        {
            var invoices = _db.GetInvoicesByCompany(companyId, null, null, null, isMatched: null);
            var allCandidates = _db.GetCandidateTransactions(companyId);

            var installmentTxns = allCandidates
                .Where(t => TxPoolClassifier.IsInstallmentTxn(t) &&
                            t.RequiresInvoice)
                .ToList();

            Console.WriteLine($"[DEBUG][תשלומים] Found {installmentTxns.Count} installment transactions for companyId={companyId}");
            foreach (var txn in installmentTxns)
                Console.WriteLine($"[DEBUG][תשלומים]   TxnId={txn.Id} | TransactionDate={txn.TransactionDate:yyyy-MM-dd} | ChargeDate={txn.PostedDate:yyyy-MM-dd} | Amount={txn.Amount} | ChargeAmount={txn.ChargeAmount} | Desc={txn.Description}");

            var results = new List<InstallmentGroupSuggestion>();

            static bool IsInstallmentMatch(MatchRow m) =>
                m.InstallmentNumber.HasValue ||
                !string.IsNullOrWhiteSpace(m.InstallmentNote) ||
                string.Equals(m.MatchMethod, "installment_simple", StringComparison.OrdinalIgnoreCase);

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

                var dateCandidates = installmentTxns
                    .Where(t => t.TransactionDate.Date == invoice.InvoiceDate.Date)
                    .ToList();

                Console.WriteLine($"[DEBUG][תשלומים] Invoice #{invoice.InvoiceNumber} (Id={invoice.Id}, Date={invoice.InvoiceDate:yyyy-MM-dd}, Total={invoice.TotalAmount}) — {dateCandidates.Count} date-matching txns");

                var expectedInstallmentAmount =
                    invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0
                        ? invoice.PaymentPlanInstallmentAmount.Value
                        : (decimal?)null;

                var observedRegularInstallmentAmount = expectedInstallmentAmount.HasValue
                    ? GetObservedRegularInstallmentAmount(dateCandidates, expectedInstallmentAmount.Value)
                    : null;

                var amountCandidates = dateCandidates
                    .Where(t =>
                    {
                        var effectiveAmount = TransactionAmountHelper.GetInstallmentReconciliationAmount(t);
                        if (effectiveAmount <= 0)
                            return false;

                        if (expectedInstallmentAmount.HasValue)
                            return MatchesExpectedInstallmentAmount(
                                invoice,
                                t,
                                effectiveAmount,
                                expectedInstallmentAmount.Value,
                                observedRegularInstallmentAmount);

                        return IsWithinInstallmentAmountTolerance(effectiveAmount, remaining) ||
                               IsWithinInstallmentAmountTolerance(Math.Abs(t.Amount), remaining) ||
                               effectiveAmount < remaining;
                    })
                    .OrderBy(t => TryParseInstallmentNumber(t.Description) ?? int.MaxValue)
                    .ThenBy(t => t.PostedDate ?? t.TransactionDate)
                    .ThenBy(t => t.Id)
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
                        Amount          = TransactionAmountHelper.GetInstallmentReconciliationAmount(t),
                        ChargeAmount    = t.ChargeAmount,
                        VendorName      = t.VendorName,
                    }).ToList(),
                    ExistingMatches = existingInstallmentMatches,
                });
            }

            return results;
        }

        public virtual async Task<List<MatchSuggestionRow>> GetSuggestionsAsync(long invoiceId)
        {
            Console.WriteLine($"\n[MATCH] ── GetSuggestionsAsync (Pipeline) for invoiceId={invoiceId} ──");
            return await RunPipelineForInvoiceAsync(invoiceId);
        }

        private async Task<List<MatchSuggestionRow>> RunPipelineForInvoiceAsync(long invoiceId)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice == null)
                return new List<MatchSuggestionRow>();

            var transactionList = _db.GetTransactionsByCompany(
                invoice.CompanyId, new TransactionFilterRequest { IsMatched = false })
                .Items
                .Where(t => t.RequiresInvoice)
                .ToList();

            if (transactionList.Count == 0)
                return new List<MatchSuggestionRow>();

            var invoiceList = new List<InvoiceRow> { invoice };

            var pipelineResult = _pipelineEngine.Execute(invoiceList, transactionList);

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
    }
}
