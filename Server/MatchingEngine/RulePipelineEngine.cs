using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    public class RulePipelineEngine : IRulePipelineEngine
    {
        private readonly List<IMatchingRule> _priorityRules;
        private readonly List<IMatchingRule> _fuzzyRules;
        private readonly IFxRateProvider _fxRateProvider;

        private const double FALLBACK_FUZZY_THRESHOLD = 0.60;
        private const decimal FALLBACK_VARIANCE_THRESHOLD = 0.15m;

        public RulePipelineEngine(IFxRateProvider fxRateProvider)
        {
            _fxRateProvider = fxRateProvider;

            _priorityRules = new List<IMatchingRule>
            {
                new Rule1_4_CardAndAmountMatch(),
                new Rule1_1_ExactMetadataToken(),
                new Rule1_3_TokenizedCardMatch(),
                new Rule1_2_TrinityMatch(),
                new Rule1_5_AmountAndVendorFuzzyMatch(),
                new RuleF4_FxOriginalCurrencyMatch(),
                new RuleF5_FxEstimation(fxRateProvider)
            };

            _fuzzyRules = new List<IMatchingRule>
            {
                new RuleF1_TemporalWindowMatch(),
                new RuleF2_SubtotalMatch(),
                new RuleF3_SmallVarianceTolerance(),
                new RuleF4_FxOriginalCurrencyMatch(),
                new RuleF5_FxEstimation(fxRateProvider)
            };
        }

        public PipelineResult Execute(List<InvoiceRow> invoices, List<TransactionRow> transactions)
        {
            var result = new PipelineResult();

            var (filteredInvoices, filteredTransactions) = ApplyPreExecutionConstraints(invoices, transactions);

            result.InvoicesProcessed = filteredInvoices.Count;
            result.TransactionsProcessed = filteredTransactions.Count;

            Console.WriteLine($"[PIPELINE] After pre-execution constraints: {filteredInvoices.Count} invoices, {filteredTransactions.Count} transactions");

            var remainingInvoices = new List<InvoiceRow>(filteredInvoices);
            var remainingTransactions = new List<TransactionRow>(filteredTransactions);

            var matchedInvoiceIds = new HashSet<long>();
            var matchedTransactionIds = new HashSet<long>();

            // Phase 1: Installment matches. Payment-plan invoices stay out of normal full-invoice rules.
            RunInstallmentPhase(
                remainingInvoices, remainingTransactions,
                matchedInvoiceIds, matchedTransactionIds,
                result);

            // Phase 2: Priority exact matches (auto-match, no cross-type)
            RunPhase(
                remainingInvoices, remainingTransactions,
                _priorityRules,
                matchedInvoiceIds, matchedTransactionIds,
                result, allowCrossType: false);

            // Phase 3: Fuzzy matches (lower confidence, auto-match if threshold met, no cross-type)
            RunPhase(
                remainingInvoices, remainingTransactions,
                _fuzzyRules,
                matchedInvoiceIds, matchedTransactionIds,
                result, allowCrossType: false);

            // Phase 4: Batch payment (one txn -> many invoices)
            RunBatchPhase(
                remainingInvoices, remainingTransactions,
                matchedInvoiceIds, matchedTransactionIds,
                result);

            // Phase 5: Fallback suggestions for manual review
            GenerateFallbackSuggestions(
                remainingInvoices, remainingTransactions,
                matchedInvoiceIds, matchedTransactionIds,
                result);

            result.InvoicesRemaining = remainingInvoices.Count(i => !matchedInvoiceIds.Contains(i.Id));
            result.TransactionsRemaining = remainingTransactions.Count(t => !matchedTransactionIds.Contains(t.Id));

            return result;
        }

        private void RunPhase(
            List<InvoiceRow> remainingInvoices,
            List<TransactionRow> remainingTransactions,
            List<IMatchingRule> rules,
            HashSet<long> matchedInvoiceIds,
            HashSet<long> matchedTransactionIds,
            PipelineResult result,
            bool allowCrossType)
        {
            var activeInvoices = remainingInvoices
                .Where(i => !matchedInvoiceIds.Contains(i.Id)).ToList();
            var activeTransactions = remainingTransactions
                .Where(t => !matchedTransactionIds.Contains(t.Id)).ToList();

            foreach (var invoice in activeInvoices)
            {
                var isInstallmentInvoice = TxPoolClassifier.IsPaymentPlanInvoice(invoice);
                if (!allowCrossType && isInstallmentInvoice)
                    continue;

                foreach (var txn in activeTransactions)
                {
                    if (matchedInvoiceIds.Contains(invoice.Id) ||
                        matchedTransactionIds.Contains(txn.Id))
                        continue;

                    if (!allowCrossType)
                    {
                        if (isInstallmentInvoice && !TxPoolClassifier.IsInstallmentTxn(txn))
                            continue;
                        if (!isInstallmentInvoice && TxPoolClassifier.IsInstallmentTxn(txn))
                            continue;
                    }

                    var fuzzyScore = ComputeFuzzyScore(invoice, txn);

                    foreach (var rule in rules)
                    {
                        var evalResult = rule.Evaluate(invoice, txn, fuzzyScore);
                        if (evalResult.Matched)
                        {
                            result.AutoMatches.Add(new MatchResult
                            {
                                InvoiceId = invoice.Id,
                                TransactionId = txn.Id,
                                MatchedAmount = evalResult.MatchedAmount,
                                RuleLayer = $"Layer {rule.Layer}",
                                RuleName = rule.Name,
                                Confidence = rule.Confidence,
                                MatchReason = evalResult.MatchReason,
                            });

                            matchedInvoiceIds.Add(invoice.Id);
                            matchedTransactionIds.Add(txn.Id);
                            break;
                        }
                    }
                }
            }
        }

        private void RunInstallmentPhase(
            List<InvoiceRow> remainingInvoices,
            List<TransactionRow> remainingTransactions,
            HashSet<long> matchedInvoiceIds,
            HashSet<long> matchedTransactionIds,
            PipelineResult result)
        {
            var activeInvoices = remainingInvoices
                .Where(i => TxPoolClassifier.IsPaymentPlanInvoice(i))
                .ToList();
            var activeTransactions = remainingTransactions
                .Where(t => !matchedTransactionIds.Contains(t.Id) && TxPoolClassifier.IsInstallmentTxn(t))
                .ToList();

            if (activeInvoices.Count == 0 || activeTransactions.Count == 0)
                return;

            // Condition 1: Direct installment amount match
            var installmentMatchedInvoices = new HashSet<long>();
            foreach (var invoice in activeInvoices)
            {
                int installmentCounter = result.AutoMatches.Count(m => m.InvoiceId == invoice.Id && m.InstallmentNumber.HasValue);
                foreach (var txn in activeTransactions)
                {
                    if (matchedTransactionIds.Contains(txn.Id))
                        continue;

                    var fuzzyScore = ComputeFuzzyScore(invoice, txn);

                    var evalResult = new Rule5_2_InstallmentPlan().Evaluate(invoice, txn, fuzzyScore);

                    if (evalResult.Matched)
                    {
                        installmentCounter++;
                        result.AutoMatches.Add(new MatchResult
                        {
                            InvoiceId = invoice.Id,
                            TransactionId = txn.Id,
                            MatchedAmount = evalResult.MatchedAmount,
                            RuleLayer = "Layer 5",
                            RuleName = "Installment Plan (5.2) - Direct",
                            Confidence = 0.90,
                            MatchReason = evalResult.MatchReason,
                            InstallmentNumber = installmentCounter,
                            InstallmentNote = $"Installment {installmentCounter} of {invoice.PaymentPlanTotalInstallments?.ToString() ?? "?"}"
                        });
                        matchedTransactionIds.Add(txn.Id);
                    }
                }

                if (installmentCounter > 0)
                    installmentMatchedInvoices.Add(invoice.Id);
            }

            // Condition 2: Accumulation match (only for invoices with zero direct matches)
            foreach (var invoice in activeInvoices)
            {
                if (installmentMatchedInvoices.Contains(invoice.Id))
                    continue;

                var fuzzyScore = ComputeFuzzyScore(invoice, activeTransactions.FirstOrDefault()
                    ?? new TransactionRow());

                var installmentTxns = Rule5_2_InstallmentPlan.FindInstallmentAccumulation(
                    invoice,
                    activeTransactions.Where(t => !matchedTransactionIds.Contains(t.Id)).ToList(),
                    fuzzyScore);

                if (installmentTxns != null && installmentTxns.Count >= 2)
                {
                    int installmentCounter = result.AutoMatches.Count(m => m.InvoiceId == invoice.Id && m.InstallmentNumber.HasValue);
                    foreach (var txn in installmentTxns)
                    {
                        installmentCounter++;
                        var effectiveAmt = TransactionAmountHelper.GetInstallmentReconciliationAmount(txn);
                        result.AutoMatches.Add(new MatchResult
                        {
                            InvoiceId = invoice.Id,
                            TransactionId = txn.Id,
                            MatchedAmount = effectiveAmt,
                            RuleLayer = "Layer 5",
                            RuleName = "Installment Plan (5.2) - Accumulated",
                            Confidence = 0.80,
                            MatchReason = $"Installment payment (#{installmentCounter} of {installmentTxns.Count}) accumulating to invoice total {invoice.TotalAmount:F2}",
                            InstallmentNumber = installmentCounter,
                            InstallmentNote = $"Installment {installmentCounter} of {installmentTxns.Count}"
                        });
                        matchedTransactionIds.Add(txn.Id);
                    }
                    installmentMatchedInvoices.Add(invoice.Id);
                }
            }

            // Mark all installment-matched invoices so Phase 3-5 don't reprocess them
            foreach (var id in installmentMatchedInvoices)
                matchedInvoiceIds.Add(id);
        }

        private void RunBatchPhase(
            List<InvoiceRow> remainingInvoices,
            List<TransactionRow> remainingTransactions,
            HashSet<long> matchedInvoiceIds,
            HashSet<long> matchedTransactionIds,
            PipelineResult result)
        {
            var activeInvoices = remainingInvoices
                .Where(i => !matchedInvoiceIds.Contains(i.Id) &&
                            !TxPoolClassifier.IsPaymentPlanInvoice(i)).ToList();
            var activeTransactions = remainingTransactions
                .Where(t => !matchedTransactionIds.Contains(t.Id) &&
                            !TxPoolClassifier.IsInstallmentTxn(t)).ToList();

            foreach (var txn in activeTransactions)
            {
                if (matchedTransactionIds.Contains(txn.Id))
                    continue;

                var fuzzyScore = ComputeFuzzyScoreForBatch(txn, activeInvoices);
                var batchMatch = Rule5_1_BatchInvoicePayment.FindBatchMatch(
                    txn,
                    activeInvoices.Where(i => !matchedInvoiceIds.Contains(i.Id)).ToList(),
                    fuzzyScore);

                if (batchMatch != null && batchMatch.Count > 0)
                {
                    foreach (var inv in batchMatch)
                    {
                        result.AutoMatches.Add(new MatchResult
                        {
                            InvoiceId = inv.Id,
                            TransactionId = txn.Id,
                            MatchedAmount = inv.TotalAmount,
                            RuleLayer = "Layer 5",
                            RuleName = "Batch Invoice Payment (5.1)",
                            Confidence = 0.80,
                            MatchReason = $"Batch payment: transaction {txn.Id} covers {batchMatch.Count} invoices (incl. #{inv.InvoiceNumber}) summing to {Math.Abs(txn.Amount):F2}"
                        });
                        matchedInvoiceIds.Add(inv.Id);
                    }
                    matchedTransactionIds.Add(txn.Id);
                }
            }
        }

        private (List<InvoiceRow>, List<TransactionRow>) ApplyPreExecutionConstraints(
            List<InvoiceRow> invoices, List<TransactionRow> transactions)
        {
            var validInvoices = invoices
                .Where(i => !i.IsMatched &&
                            !string.Equals(i.Status, "matched", StringComparison.OrdinalIgnoreCase) &&
                            !i.IsDuplicate)
                .ToList();

            var validTransactions = transactions
                .Where(t => !t.IsMatched &&
                            !string.Equals(t.Status, "matched", StringComparison.OrdinalIgnoreCase) &&
                            !t.IsDuplicate)
                .ToList();

            validTransactions = validTransactions
                .Where(t => !string.Equals(t.Category, "Transfer", StringComparison.OrdinalIgnoreCase) &&
                            !IsInternalTransfer(t) &&
                            t.RequiresInvoice)
                .ToList();

            return (validInvoices, validTransactions);
        }

        private static bool IsInternalTransfer(TransactionRow txn)
        {
            if (string.IsNullOrWhiteSpace(txn.TransactionType) && string.IsNullOrWhiteSpace(txn.Description))
                return false;

            var type = (txn.TransactionType ?? string.Empty).ToLowerInvariant();
            var desc = (txn.Description ?? string.Empty).ToLowerInvariant();

            string[] transferTypes = { "transfer", "sweep", "internal", "wire_internal", "ach_internal" };
            foreach (var tt in transferTypes)
            {
                if (type.Contains(tt, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            string[] transferDescPatterns = {
                "transfer to savings", "transfer to checking", "sweep to",
                "internal transfer", "funds transfer", "account transfer",
                "העברה פנימית", "העברת כספים פנימית", "סוויפ"
            };
            foreach (var dp in transferDescPatterns)
            {
                if (desc.Contains(dp, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private void GenerateFallbackSuggestions(
            List<InvoiceRow> remainingInvoices,
            List<TransactionRow> remainingTransactions,
            HashSet<long> matchedInvoiceIds,
            HashSet<long> matchedTransactionIds,
            PipelineResult result)
        {
            var activeInvoices = remainingInvoices
                .Where(i => !matchedInvoiceIds.Contains(i.Id)).ToList();
            var activeTransactions = remainingTransactions
                .Where(t => !matchedTransactionIds.Contains(t.Id)).ToList();

            foreach (var invoice in activeInvoices)
            {
                var isInstallmentInvoice = TxPoolClassifier.IsPaymentPlanInvoice(invoice);
                if (isInstallmentInvoice)
                    continue;

                foreach (var txn in activeTransactions)
                {
                    if (matchedInvoiceIds.Contains(invoice.Id) ||
                        matchedTransactionIds.Contains(txn.Id))
                        continue;

                    if (!isInstallmentInvoice && TxPoolClassifier.IsInstallmentTxn(txn))
                        continue;

                    var fuzzyScore = ComputeFuzzyScore(invoice, txn);
                    if (fuzzyScore <= FALLBACK_FUZZY_THRESHOLD)
                        continue;

                    var txnAmount = Math.Abs(txn.Amount);
                    var amountVariance = invoice.TotalAmount > 0
                        ? Math.Abs(txnAmount - invoice.TotalAmount) / invoice.TotalAmount
                        : 1.0m;

                    if (amountVariance > FALLBACK_VARIANCE_THRESHOLD)
                        continue;

                    result.SuggestedMatches.Add(new SuggestedMatch
                    {
                        InvoiceId = invoice.Id,
                        InvoiceNumber = invoice.InvoiceNumber,
                        VendorName = invoice.VendorName,
                        InvoiceAmount = invoice.TotalAmount,
                        InvoiceDate = invoice.InvoiceDate,
                        TransactionId = txn.Id,
                        TransactionDescription = txn.Description,
                        TransactionAmount = txnAmount,
                        TransactionDate = txn.TransactionDate,
                        FuzzyScore = fuzzyScore,
                        AmountVariancePercent = amountVariance * 100
                    });
                }
            }

            result.SuggestedMatches = result.SuggestedMatches
                .OrderByDescending(s => s.FuzzyScore)
                .ThenBy(s => s.AmountVariancePercent)
                .ToList();
        }

        private static double ComputeFuzzyScore(InvoiceRow invoice, TransactionRow transaction)
        {
            var invoiceVendor = invoice.VendorName ?? string.Empty;
            var txnVendorRaw = !string.IsNullOrWhiteSpace(transaction.VendorName)
                ? transaction.VendorName
                : TextLaunderer.ExtractVendorFromDescription(transaction.Description);
            var txnVendor = txnVendorRaw ?? string.Empty;

            var normalizedInv = VendorNameNormalizer.Normalize(invoiceVendor);
            var normalizedTxn = VendorNameNormalizer.Normalize(txnVendor);

            return TextLaunderer.FuzzyScore(normalizedInv, normalizedTxn);
        }

        private static double ComputeFuzzyScoreForBatch(TransactionRow transaction, List<InvoiceRow> candidateInvoices)
        {
            if (candidateInvoices.Count == 0)
                return 0.0;

            var txnVendor = !string.IsNullOrWhiteSpace(transaction.VendorName)
                ? transaction.VendorName
                : TextLaunderer.ExtractVendorFromDescription(transaction.Description);
            var normalizedTxn = VendorNameNormalizer.Normalize(txnVendor);

            return candidateInvoices
                .Max(inv => TextLaunderer.FuzzyScore(
                    VendorNameNormalizer.Normalize(inv.VendorName ?? string.Empty),
                    normalizedTxn));
        }

        public static CreateMatchRequest ToCreateMatchRequest(MatchResult match, long matchedByUserId)
        {
            var isInstallmentMatch = match.InstallmentNumber.HasValue;

            return new CreateMatchRequest
            {
                InvoiceId = match.InvoiceId,
                TransactionId = match.TransactionId,
                MatchedAmount = match.MatchedAmount,
                MatchMethod = "automatic",
                MatchType = isInstallmentMatch ? "installment" : "full",
                MatchConfidence = (decimal)match.Confidence,
                MatchReason = $"[{match.RuleLayer}] {match.RuleName}: {match.MatchReason}",
                InstallmentNumber = match.InstallmentNumber,
                InstallmentNote = match.InstallmentNote
            };
        }
    }
}
