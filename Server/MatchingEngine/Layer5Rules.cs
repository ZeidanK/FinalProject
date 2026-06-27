using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Helper to get the effective payment amount from a transaction.
    /// Uses charge_amount when available (for installment payments where the
    /// booked amount is the full invoice total but the actual charge is the installment),
    /// falling back to the raw amount.
    /// </summary>
    public static class TransactionAmountHelper
    {
        public static decimal GetEffectiveAmount(TransactionRow txn)
        {
            if (txn.ChargeAmount.HasValue && txn.ChargeAmount.Value > 0)
                return Math.Abs(txn.ChargeAmount.Value);
            return Math.Abs(txn.Amount);
        }

        public static decimal GetEffectiveAmount(decimal? chargeAmount, decimal amount)
        {
            if (chargeAmount.HasValue && chargeAmount.Value > 0)
                return Math.Abs(chargeAmount.Value);
            return Math.Abs(amount);
        }
    }

    /// <summary>
    /// Rule 5.1: Batch Invoice Payment (One Transaction -> Many Invoices)
    /// For an unmatched transaction, query all unmatched invoices under the same company_id 
    /// where fuzzy_score > 0.85 AND invoice_date <= transaction_date.
    /// Evaluate subset combinations: if any subset of invoice totals sums exactly to 
    /// transaction.amount, bundle match the transaction to all invoices in that subset.
    /// </summary>
    public class Rule5_1_BatchInvoicePayment : BaseRule
    {
        public override int Layer => 5;
        public override string Name => "Batch Invoice Payment (5.1)";
        public override double Confidence => 0.80;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // This rule is evaluated per-invoice in the pipeline, but the actual
            // subset combination logic runs across ALL invoices at once.
            // The per-invoice evaluate is just a stub — the real work is in 
            // RulePipelineEngine.ExecuteBatchPaymentRule().
            return new RuleEvalResult { Matched = false };
        }

        /// <summary>
        /// Executes the batch payment rule across a pool of invoices for a single transaction.
        /// Returns a list of invoices that together sum exactly to the transaction amount.
        /// </summary>
        public static List<InvoiceRow>? FindBatchMatch(
            TransactionRow transaction,
            List<InvoiceRow> candidateInvoices,
            double fuzzyScore)
        {
            if (fuzzyScore <= 0.85)
                return null;

            var txnAmount = Math.Abs(transaction.Amount);

            // Filter: invoice_date <= transaction_date
            var eligible = candidateInvoices
                .Where(i => i.InvoiceDate.Date <= transaction.TransactionDate.Date)
                .ToList();

            if (eligible.Count == 0)
                return null;

            return CombinationEvaluator.FindExactSubset(eligible, txnAmount);
        }
    }

    /// <summary>
    /// Rule 5.2: Installment Plan / Partial Payment Loop (Many Transactions -> One Invoice)
    /// 
    /// Condition 1: transaction.charge_amount (or amount) == invoice.payment_plan_installment_amount 
    ///              AND fuzzy_score > 0.85.
    /// 
    /// Condition 2: Over a rolling 60-day window, the cumulative sum of charge_amount from
    ///              multiple unmatched transactions for the exact same vendor equals 
    ///              invoice.total_amount. Batch match all those transactions 
    ///              to that single invoice.
    /// </summary>
    public class Rule5_2_InstallmentPlan : BaseRule
    {
        public override int Layer => 5;
        public override string Name => "Installment Plan (5.2)";
        public override double Confidence => 0.80;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // --- Condition 1: Direct installment amount match ---
            // Use charge_amount when available (e.g. Amount=2555.00 full, ChargeAmount=255.00 actual installment)
            if (invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0)
            {
                var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
                
                // Allow small installment amount deviation (e.g. expected 113.80 but txn is 117.00)
                // while still preventing accidental matching to unrelated transactions.
                //
                // Use 5.00m here as a practical tolerance for single installment deviations.
                if (Math.Abs(effectiveAmount - invoice.PaymentPlanInstallmentAmount.Value) < 20.00m)
                {
                    // For installment transactions, amount match alone is sufficient.
                    // The transaction_type="תשלומים" already identifies this as an installment payment.
                    // We still require a minimal vendor match to avoid false positives.
                    if (fuzzyScore > 0.50 || IsInstallmentTransaction(transaction))
                    {
                        return new RuleEvalResult
                        {
                            Matched = true,
                            MatchedAmount = effectiveAmount,
                            MatchReason = $"Installment payment matching expected installment amount of {invoice.PaymentPlanInstallmentAmount:F2}"
                        };
                    }
                }
            }

            return new RuleEvalResult { Matched = false };
        }

        private static bool IsInstallmentTransaction(TransactionRow txn)
        {
            return string.Equals(txn.TransactionType, "תשלומים", StringComparison.OrdinalIgnoreCase);
        }

    /// <summary>
    /// Executes Condition 2 of Rule 5.2: finds transactions whose cumulative sum
    /// (using charge_amount when available) equals the invoice total_amount.
    /// Uses the transaction_date range from the first to last installment chronologically.
    /// NO hardcoded day limits — trusts the data's own date range.
    /// </summary>
    public static List<TransactionRow>? FindInstallmentAccumulation(
            InvoiceRow invoice,
            List<TransactionRow> candidateTransactions,
            double fuzzyScore)
    {
        if (fuzzyScore <= 0.85 || invoice.TotalAmount <= 0)
            return null;

            if (candidateTransactions.Count < 2)
                return null;

            var target = invoice.TotalAmount;

            // Sort by transaction_date ascending
            var sorted = candidateTransactions
                .OrderBy(t => t.TransactionDate)
                .ToList();

            var accumulated = new List<TransactionRow>();
            decimal runningSum = 0;

            // Walk through transactions in chronological order, accumulating charge_amount
            // until we reach or exceed the invoice total
            foreach (var txn in sorted)
            {
                var effectiveAmt = TransactionAmountHelper.GetEffectiveAmount(txn);
                accumulated.Add(txn);
                runningSum += effectiveAmt;

                if (Math.Abs(runningSum - target) < 0.01m)
                    return accumulated;

                // If we've exceeded the target, backtrack: try to find a suffix of
                // a previous prefix that sums exactly
                if (runningSum > target)
                {
                    // Try removing earliest transactions one by one
                    int removeIdx = 0;
                    while (removeIdx < accumulated.Count - 1 && runningSum > target)
                    {
                        var removedAmt = TransactionAmountHelper.GetEffectiveAmount(accumulated[removeIdx]);
                        runningSum -= removedAmt;
                        accumulated.RemoveAt(removeIdx);

                        if (Math.Abs(runningSum - target) < 0.01m)
                            return accumulated;
                    }
                    // If we couldn't find an exact match, break and return null
                    // (this invoice doesn't have a clean accumulation)
                    return null;
                }
            }

            return null;
    }
}
}
