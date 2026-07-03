using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Matching
{
    public class MatchSuggestionService
    {
        private readonly DBservices _db;
        private readonly RulePipelineEngine _pipelineEngine;

        public MatchSuggestionService(DBservices db, RulePipelineEngine pipelineEngine)
        {
            _db = db;
            _pipelineEngine = pipelineEngine;
        }

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

                var dateCandidates = installmentTxns
                    .Where(t => t.TransactionDate.Date == invoice.InvoiceDate.Date)
                    .ToList();

                Console.WriteLine($"[DEBUG][תשלומים] Invoice #{invoice.InvoiceNumber} (Id={invoice.Id}, Date={invoice.InvoiceDate:yyyy-MM-dd}, Total={invoice.TotalAmount}) — {dateCandidates.Count} date-matching txns");

                var expectedInstallmentAmount =
                    invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0
                        ? invoice.PaymentPlanInstallmentAmount.Value
                        : (decimal?)null;

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

        public async Task<List<MatchSuggestionRow>> GetSuggestionsAsync(long invoiceId)
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
                invoice.CompanyId, type: null, isMatched: false, startDate: null, endDate: null);

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
