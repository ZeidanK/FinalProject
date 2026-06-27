using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Main orchestrator for the transaction-to-invoice matching engine.
    /// Implements the 5-layer waterfall pipeline with pre-execution constraints,
    /// auto-matching, and fallback suggested matches for UI review.
    /// </summary>
    public class RulePipelineEngine
    {
        private readonly List<IMatchingRule> _layer1Rules;
        private readonly List<IMatchingRule> _layer2Rules;
        private readonly List<IMatchingRule> _layer3Rules;
        private readonly List<IMatchingRule> _layer4Rules;

        private const double FALLBACK_FUZZY_THRESHOLD = 0.60;
        private const decimal FALLBACK_VARIANCE_THRESHOLD = 0.15m; // 15%

        public RulePipelineEngine()
        {
            // Layer 1: Absolute Direct Matches
            _layer1Rules = new List<IMatchingRule>
            {
                new Rule1_1_ExactMetadataToken(),
                new Rule1_2_TrinityMatch(),
                new Rule1_3_TokenizedCardMatch()
            };

            // Layer 2: Temporal & Heuristic
            _layer2Rules = new List<IMatchingRule>
            {
                new Rule2_1_StandardPostDatedWindow(),
                new Rule2_2_RetroactivePrePaidWindow(),
                new Rule2_3_FuzzyNameContainment()
            };

            // Layer 3: Financial Variances & Discrepancies
            _layer3Rules = new List<IMatchingRule>
            {
                new Rule3_1_SubtotalMatch(),
                new Rule3_2_ShortPayWireFee(),
                new Rule3_3_SmallVarianceTolerance(),
                new Rule3_4_EarlyCashDiscount()
            };

            // Layer 4: International Multi-Currency
            _layer4Rules = new List<IMatchingRule>
            {
                new Rule4_1_FxOriginalCurrencyLedgerLock(),
                new Rule4_2_HistoricalFxEstimation()
            };
            // Layer 5 rules (batch/installment) are handled separately 
            // since they operate across multiple invoices/transactions.
        }

        /// <summary>
        /// Runs the full matching pipeline on the given invoice and transaction lists.
        /// </summary>
        /// <param name="invoices">Pool of invoices to match (pre-filtered by caller if needed).</param>
        /// <param name="transactions">Pool of transactions to match (pre-filtered by caller if needed).</param>
        /// <returns>PipelineResult with auto-matches and suggested manual-review matches.</returns>
        public PipelineResult Execute(List<InvoiceRow> invoices, List<TransactionRow> transactions)
        {
            var result = new PipelineResult();

            // Apply pre-execution constraints to filter the input pools
            var (filteredInvoices, filteredTransactions) = ApplyPreExecutionConstraints(invoices, transactions);

            result.InvoicesProcessed = filteredInvoices.Count;
            result.TransactionsProcessed = filteredTransactions.Count;

            Console.WriteLine($"[PIPELINE] After pre-execution constraints: {filteredInvoices.Count} invoices, {filteredTransactions.Count} transactions");
            foreach (var inv in filteredInvoices.Take(5))
                Console.WriteLine($"[PIPELINE]   Invoice #{inv.Id} '{inv.InvoiceNumber}' isMatched={inv.IsMatched} status={inv.Status} isDuplicate={inv.IsDuplicate}");
            foreach (var txn in filteredTransactions.Take(5))
                Console.WriteLine($"[PIPELINE]   Txn #{txn.Id} isMatched={txn.IsMatched} status={txn.Status} isDuplicate={txn.IsDuplicate} type={txn.TransactionType}");

            // Create mutable pools that we'll remove matched records from
            var remainingInvoices = new List<InvoiceRow>(filteredInvoices);
            var remainingTransactions = new List<TransactionRow>(filteredTransactions);

            // Track which records have been matched
            var matchedInvoiceIds = new HashSet<long>();
            var matchedTransactionIds = new HashSet<long>();

            // ── LAYER 1: Absolute Direct Matches ──────────────────────
            RunLayer(
                remainingInvoices,
                remainingTransactions,
                _layer1Rules,
                matchedInvoiceIds,
                matchedTransactionIds,
                result);


            // ── LAYER 2: Temporal & Heuristic Single Matches ──────────
            RunLayer(
                remainingInvoices,
                remainingTransactions,
                _layer2Rules,
                matchedInvoiceIds,
                matchedTransactionIds,
                result);

            // ── LAYER 3: Financial Variances ──────────────────────────
            RunLayer(
                remainingInvoices,
                remainingTransactions,
                _layer3Rules,
                matchedInvoiceIds,
                matchedTransactionIds,
                result);

            // ── LAYER 4: International Multi-Currency ─────────────────
            RunLayer(
                remainingInvoices,
                remainingTransactions,
                _layer4Rules,
                matchedInvoiceIds,
                matchedTransactionIds,
                result);



            // ── LAYER 5: One-to-Many & Many-to-One Splits ────────────
            RunLayer5(remainingInvoices, remainingTransactions,
                      matchedInvoiceIds, matchedTransactionIds, result);

            // ── FALLBACK: Suggested Matches for Manual Review ─────────
            GenerateFallbackSuggestions(remainingInvoices, remainingTransactions,
                                        matchedInvoiceIds, matchedTransactionIds, result);

            result.InvoicesRemaining = remainingInvoices.Count(i => !matchedInvoiceIds.Contains(i.Id));
            result.TransactionsRemaining = remainingTransactions.Count(t => !matchedTransactionIds.Contains(t.Id));

            return result;
        }

        /// <summary>
        /// Applies pre-execution constraints to both invoice and transaction lists.
        /// </summary>
        private (List<InvoiceRow>, List<TransactionRow>) ApplyPreExecutionConstraints(
            List<InvoiceRow> invoices, List<TransactionRow> transactions)
        {
            // Constraint 1: Scope Isolation — only process records where company_id matches
            // across both datasets. Already handled if caller passes company-filtered lists.
            // We don't cross-check across companies here; caller is responsible.

            // Constraint 2: Double-Booking Prevention
            var validInvoices = invoices
                .Where(i => !i.IsMatched && 
                            !string.Equals(i.Status, "matched", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var validTransactions = transactions
                .Where(t => !t.IsMatched &&
                            !string.Equals(t.Status, "matched", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Constraint 3: Duplicate Suppression
            validInvoices = validInvoices.Where(i => !i.IsDuplicate).ToList();
            validTransactions = validTransactions.Where(t => !t.IsDuplicate).ToList();

            // Constraint 4: Internal Sweep Exclusion
            validTransactions = validTransactions
                .Where(t => !string.Equals(t.Category, "Transfer", StringComparison.OrdinalIgnoreCase) &&
                            !IsInternalTransfer(t))
                .ToList();

            return (validInvoices, validTransactions);
        }

        /// <summary>
        /// Determines if a transaction represents an internal bank transfer or account sweep.
        /// </summary>
        private static bool IsInternalTransfer(TransactionRow txn)
        {
            if (string.IsNullOrWhiteSpace(txn.TransactionType) && string.IsNullOrWhiteSpace(txn.Description))
                return false;

            var type = (txn.TransactionType ?? string.Empty).ToLowerInvariant();
            var desc = (txn.Description ?? string.Empty).ToLowerInvariant();

            // Check transaction_type for internal transfer indicators
            string[] transferTypes = { "transfer", "sweep", "internal", "wire_internal", "ach_internal" };
            foreach (var tt in transferTypes)
            {
                if (type.Contains(tt, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            // Check description for internal transfer indicators
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

        /// <summary>
        /// Executes a set of rules for a given layer across all remaining invoice/transaction pairs.
        /// Removes matched records from the candidate pools.
        /// </summary>
        private void RunLayer(
            List<InvoiceRow> remainingInvoices,
            List<TransactionRow> remainingTransactions,
            List<IMatchingRule> rules,
            HashSet<long> matchedInvoiceIds,
            HashSet<long> matchedTransactionIds,
            PipelineResult result)
        {
            bool layerMadeMatch;
            do
            {
                layerMadeMatch = false;

                // Get active (unmatched) records
                var activeInvoices = remainingInvoices
                    .Where(i => !matchedInvoiceIds.Contains(i.Id)).ToList();
                var activeTransactions = remainingTransactions
                    .Where(t => !matchedTransactionIds.Contains(t.Id)).ToList();

                foreach (var invoice in activeInvoices)
                {
                    foreach (var txn in activeTransactions)
                    {
                        // Skip if either already matched in this layer iteration
                        if (matchedInvoiceIds.Contains(invoice.Id) || 
                            matchedTransactionIds.Contains(txn.Id))
                            continue;

                        // Enforce smart separation between normal vs installment txns.
                        // Payment-plan invoices should only consume installment transactions ("תשלומים").
                        if (TxPoolClassifier.IsPaymentPlanInvoice(invoice) && !TxPoolClassifier.IsInstallmentTxn(txn))
                            continue;
                        if (!TxPoolClassifier.IsPaymentPlanInvoice(invoice) && TxPoolClassifier.IsInstallmentTxn(txn))
                            continue;

                        // Compute fuzzy score once for all rules in this layer
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
                                    MatchReason = evalResult.MatchReason
                                });

                                matchedInvoiceIds.Add(invoice.Id);
                                matchedTransactionIds.Add(txn.Id);
                                layerMadeMatch = true;
                                break; // Move to next transaction
                            }
                        }
                    }
                }
            } while (layerMadeMatch); // Continue until no more matches found in this layer
        }

        /// <summary>
        /// Executes Layer 5 rules (batch payments and installment plans) 
        /// which operate across multiple records simultaneously.
        /// </summary>
        private void RunLayer5(
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

            // If we have installment/payment-plan invoices, we must NOT allow
            // 5.1 batch payment (one txn -> many invoices) to consume transactions,
            // otherwise 5.2 installment matching might never see them.
            var hasPaymentPlanInvoices = activeInvoices.Any(TxPoolClassifier.IsPaymentPlanInvoice);

            // ── Rule 5.1: Batch Invoice Payment (One Transaction → Many Invoices) ──
            if (!hasPaymentPlanInvoices)
            {
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

            // ── Rule 5.2: Installment Plan (Many Transactions → One Invoice) ──
            // Condition 1: Direct installment amount match
            foreach (var invoice in activeInvoices)
            {
                if (matchedInvoiceIds.Contains(invoice.Id))
                    continue;

                Console.WriteLine($"[PIPELINE][5.2] Checking invoice #{invoice.Id} '{invoice.InvoiceNumber}' Vendor='{invoice.VendorName}' Total={invoice.TotalAmount} InstallAmt={invoice.PaymentPlanInstallmentAmount} InstallCount={invoice.PaymentPlanTotalInstallments} IsMatched={invoice.IsMatched} Status={invoice.Status} IsDuplicate={invoice.IsDuplicate}");
                
                // Note: Installment amount is read directly from invoice.PaymentPlanInstallmentAmount
                // No derivation from transaction descriptions needed.

                int installmentCounter = 0;
                foreach (var txn in activeTransactions)
                {
                    if (matchedTransactionIds.Contains(txn.Id))
                        continue;

                    var effectiveAmt = TransactionAmountHelper.GetEffectiveAmount(txn);
                    var fuzzyScore = ComputeFuzzyScore(invoice, txn);
                    Console.WriteLine($"[PIPELINE][5.2]   Txn #{txn.Id}: Desc=\"{txn.Description}\" Amt={txn.Amount} ChargeAmt={txn.ChargeAmount} EffAmt={effectiveAmt} InvInstallAmt={invoice.PaymentPlanInstallmentAmount} Fuzzy={fuzzyScore:F4}");

                    // Evaluate the rule
                    var evalResult = new Rule5_2_InstallmentPlan().Evaluate(invoice, txn, fuzzyScore);

                    if (evalResult.Matched)
                    {
                        installmentCounter++;
                        Console.WriteLine($"[PIPELINE][5.2]   ✓ MATCHED! Amount={evalResult.MatchedAmount} Reason={evalResult.MatchReason}");
                        result.AutoMatches.Add(new MatchResult
                        {
                            InvoiceId = invoice.Id,
                            TransactionId = txn.Id,
                            MatchedAmount = evalResult.MatchedAmount,
                            RuleLayer = "Layer 5",
                            RuleName = "Installment Plan (5.2) - Direct",
                            Confidence = 0.80,
                            MatchReason = evalResult.MatchReason,
                            InstallmentNumber = installmentCounter,
                            InstallmentNote = $"Installment {installmentCounter} of {invoice.PaymentPlanTotalInstallments?.ToString() ?? "?"}"
                        });
                        matchedInvoiceIds.Add(invoice.Id);
                        matchedTransactionIds.Add(txn.Id);
                    }
                }
            }

            // Condition 2: Rolling 60-day window cumulative match
            foreach (var invoice in activeInvoices)
            {
                if (matchedInvoiceIds.Contains(invoice.Id))
                    continue;

                var fuzzyScore = ComputeFuzzyScore(invoice, activeTransactions.FirstOrDefault() 
                    ?? new TransactionRow()); // use first as representative

                var installmentTxns = Rule5_2_InstallmentPlan.FindInstallmentAccumulation(
                    invoice,
                    activeTransactions.Where(t => !matchedTransactionIds.Contains(t.Id)).ToList(),
                    fuzzyScore);

                if (installmentTxns != null && installmentTxns.Count >= 2)
                {
                    int installmentCounter = 0;
                    foreach (var txn in installmentTxns)
                    {
                        installmentCounter++;
                        var effectiveAmt = TransactionAmountHelper.GetEffectiveAmount(txn);
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
                    matchedInvoiceIds.Add(invoice.Id);
                }
            }
        }

        /// <summary>
        /// Generates fallback suggested matches for remaining unmatched pairs 
        /// where fuzzy_score > 0.60 AND amount variance < 15%.
        /// </summary>
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
                foreach (var txn in activeTransactions)
                {
                    if (matchedInvoiceIds.Contains(invoice.Id) || 
                        matchedTransactionIds.Contains(txn.Id))
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

            // Sort suggested matches by fuzzy score descending for priority
            result.SuggestedMatches = result.SuggestedMatches
                .OrderByDescending(s => s.FuzzyScore)
                .ThenBy(s => s.AmountVariancePercent)
                .ToList();
        }

        /// <summary>
        /// Computes the fuzzy score between an invoice and a transaction's vendor names.
        /// Uses the transaction's vendor_name or extracts it from the description.
        /// </summary>
        private static double ComputeFuzzyScore(InvoiceRow invoice, TransactionRow transaction)
        {
            var invoiceVendor = invoice.VendorName ?? string.Empty;
            var txnVendorRaw = !string.IsNullOrWhiteSpace(transaction.VendorName)
                ? transaction.VendorName
                : TextLaunderer.ExtractVendorFromDescription(transaction.Description);
            var txnVendor = txnVendorRaw ?? string.Empty;

            var score = TextLaunderer.FuzzyScore(invoiceVendor, txnVendor);
            
            // Targeted debug for known problematic invoices
            if (invoice.Id == 47 || invoice.Id == 72)
            {
                Console.WriteLine($"[FUZZY] Invoice #{invoice.Id} VendorName='{invoiceVendor}' | Txn #{transaction.Id} txnVendorName='{transaction.VendorName}' desc='{transaction.Description}' extractedVendor='{txnVendor}' score={score:F4}");
            }

            return score;
        }

        /// <summary>
        /// Computes the best fuzzy score for a transaction against a set of invoices 
        /// (used for batch payment matching).
        /// </summary>
        private static double ComputeFuzzyScoreForBatch(TransactionRow transaction, List<InvoiceRow> candidateInvoices)
        {
            if (candidateInvoices.Count == 0)
                return 0.0;

            var txnVendor = !string.IsNullOrWhiteSpace(transaction.VendorName)
                ? transaction.VendorName
                : TextLaunderer.ExtractVendorFromDescription(transaction.Description);

            // Take the best score across all candidate invoices
            return candidateInvoices
                .Max(inv => TextLaunderer.FuzzyScore(inv.VendorName ?? string.Empty, txnVendor));
        }

        /// <summary>
        /// Creates an auto-match from a MatchResult and persists it via the provided callback.
        /// </summary>
        public static CreateMatchRequest ToCreateMatchRequest(MatchResult match, long matchedByUserId)
        {
            var isInstallmentMatch = match.InstallmentNumber.HasValue;

            // Installment matches must never be persisted as "normal" full/partial.
            // MatchService will still classify full vs partial for non-installment matches.
            return new CreateMatchRequest
            {
                InvoiceId = match.InvoiceId,
                TransactionId = match.TransactionId,
                MatchedAmount = match.MatchedAmount,
                MatchMethod = "automatic",

                // Use a dedicated installment match type marker.
                // This guarantees installment matches never get written as plain "full".
                MatchType = isInstallmentMatch ? "installment" : "full",

                MatchConfidence = (decimal)match.Confidence,
                MatchReason = $"[{match.RuleLayer}] {match.RuleName}: {match.MatchReason}",
                InstallmentNumber = match.InstallmentNumber,
                InstallmentNote = match.InstallmentNote
            };
        }
    }
}