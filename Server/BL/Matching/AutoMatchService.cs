using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Matching
{
    public class AutoMatchService
    {
        private readonly IDBservices _db;
        private readonly IRulePipelineEngine _pipelineEngine;
        private readonly MatchCrudService _crud;
        private readonly MatchSuggestionService _suggestions;

        private const decimal HIGH_CONFIDENCE_THRESHOLD = 70m;
        private const decimal MEDIUM_CONFIDENCE_THRESHOLD = 50m;

        public AutoMatchService(
            IDBservices db,
            IRulePipelineEngine pipelineEngine,
            MatchCrudService crud,
            MatchSuggestionService suggestions)
        {
            _db = db;
            _pipelineEngine = pipelineEngine;
            _crud = crud;
            _suggestions = suggestions;
        }

        public virtual async Task<(bool Success, long? MatchId, string Message, decimal? MatchScore)> AutoMatchAsync(
            long invoiceId,
            long userId,
            decimal minConfidenceThreshold = HIGH_CONFIDENCE_THRESHOLD)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice == null)
                return (false, null, "Invoice not found.", null);

            var suggestions = await _suggestions.GetSuggestionsAsync(invoiceId);

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

            var result = _crud.Create(matchRequest, userId);

            var message = hasPaymentPlan
                ? $"Auto-matched installment {installmentNumber}/{invoice.PaymentPlanTotalInstallments}. Score: {best.MatchScore:F1}%"
                : $"Auto-matched with {best.MatchScore:F1}% confidence.";

            return result.Success
                ? (true, result.Id, message, best.MatchScore)
                : (false, null, result.Error, best.MatchScore);
        }

        public virtual async Task<AutoMatchBatchResult> AutoMatchBatchAsync(
            long companyId,
            long userId,
            decimal minConfidenceThreshold = HIGH_CONFIDENCE_THRESHOLD)
        {
            Console.WriteLine($"\n[MATCH] ── AutoMatchBatchAsync (Pipeline) for companyId={companyId} ──");
            return await RunPipelineBatchAsync(companyId, userId, minConfidenceThreshold);
        }

        private async Task<AutoMatchBatchResult> RunPipelineBatchAsync(
            long companyId, long userId, decimal minConfidenceThreshold)
        {
            var result = new AutoMatchBatchResult();

            var invoices = _db.GetUnmatchedInvoicesByCompany(companyId);
            var transactionsResponse = _db.GetTransactionsByCompany(
                companyId, new TransactionFilterRequest { IsMatched = false, PageSize = 100000 });
            var transactions = transactionsResponse.Items;

            if (invoices.Count == 0 || transactions.Count == 0)
                return result;

            var pipelineResult = _pipelineEngine.Execute(invoices, transactions);

            foreach (var match in pipelineResult.AutoMatches)
            {
                var invoice = invoices.FirstOrDefault(i => i.Id == match.InvoiceId) ?? _db.GetInvoiceById(match.InvoiceId);
                var isInstallmentInvoice =
                    (invoice?.PaymentPlanTotalInstallments.HasValue ?? false) &&
                    invoice.PaymentPlanTotalInstallments.Value > 1;

                if (isInstallmentInvoice && !match.InstallmentNumber.HasValue)
                {
                    Console.WriteLine($"[WARN] Installment invoice #{match.InvoiceId} auto-match skipped: missing InstallmentNumber (Rule: {match.RuleName})");
                    continue;
                }

                var matchReq = RulePipelineEngine.ToCreateMatchRequest(match, userId);
                var createResult = _crud.Create(matchReq, userId);

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

            var matchedInvoiceIds = new HashSet<long>(pipelineResult.AutoMatches.Select(m => m.InvoiceId));
            foreach (var invoiceId in AutoConfirmAvailableInstallmentSuggestions(companyId, userId, result))
                matchedInvoiceIds.Add(invoiceId);

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

        private HashSet<long> AutoConfirmAvailableInstallmentSuggestions(
            long companyId,
            long userId,
            AutoMatchBatchResult result)
        {
            var confirmedInvoiceIds = new HashSet<long>();
            var confirmedTransactionIds = new HashSet<long>();
            var groups = _suggestions.GetInstallmentSuggestions(companyId) ?? new List<InstallmentGroupSuggestion>();

            foreach (var group in groups)
            {
                var remainingAmount = group.RemainingAmount > 0
                    ? group.RemainingAmount
                    : Math.Max(group.TotalAmount - group.AlreadyMatchedAmount, 0);

                if (remainingAmount <= 0)
                    continue;

                var installmentNumber = group.AlreadyMatchedCount + 1;
                var expectedInstallments = group.ExpectedInstallments;

                foreach (var txn in group.SuggestedTransactions ?? new List<SuggestedInstallmentTransaction>())
                {
                    if (expectedInstallments.HasValue && installmentNumber > expectedInstallments.Value)
                        break;

                    if (!confirmedTransactionIds.Add(txn.TransactionId))
                        continue;

                    var suggestedAmount = Math.Abs(txn.Amount);
                    if (suggestedAmount <= 0 && txn.ChargeAmount.HasValue)
                        suggestedAmount = Math.Abs(txn.ChargeAmount.Value);

                    var matchedAmount = Math.Min(suggestedAmount, remainingAmount);
                    if (matchedAmount <= 0)
                        break;

                    var matchReq = new CreateMatchRequest
                    {
                        InvoiceId = group.InvoiceId,
                        TransactionId = txn.TransactionId,
                        MatchedAmount = matchedAmount,
                        MatchMethod = "automatic",
                        MatchType = "installment",
                        MatchConfidence = 0.90m,
                        MatchReason = "Auto-confirmed available installment suggestion.",
                        MatchedByUserId = userId,
                        InstallmentNumber = installmentNumber,
                        InstallmentNote = expectedInstallments.HasValue
                            ? $"Installment {installmentNumber} of {expectedInstallments.Value}"
                            : $"Installment {installmentNumber}"
                    };

                    var createResult = _crud.Create(matchReq, userId);
                    if (!createResult.Success)
                    {
                        result.MatchDetails.Add(new MatchDetail
                        {
                            InvoiceId = group.InvoiceId,
                            InvoiceNumber = group.InvoiceNumber,
                            Success = false,
                            MatchScore = 90m,
                            Message = createResult.Error
                        });
                        continue;
                    }

                    result.SuccessfulMatches++;
                    confirmedInvoiceIds.Add(group.InvoiceId);
                    remainingAmount -= matchedAmount;
                    result.MatchDetails.Add(new MatchDetail
                    {
                        InvoiceId = group.InvoiceId,
                        InvoiceNumber = group.InvoiceNumber,
                        Success = true,
                        MatchScore = 90m,
                        Message = $"Auto-confirmed installment {installmentNumber}{(expectedInstallments.HasValue ? $"/{expectedInstallments.Value}" : string.Empty)}"
                    });

                    installmentNumber++;
                }
            }

            return confirmedInvoiceIds;
        }

        private static string DetermineMatchType(InvoiceRow invoice, decimal transactionAmount)
        {
            var remaining = invoice.TotalAmount - invoice.MatchedAmount;
            return Math.Abs(transactionAmount - remaining) < 0.01m ? "full" : "partial";
        }
    }
}
