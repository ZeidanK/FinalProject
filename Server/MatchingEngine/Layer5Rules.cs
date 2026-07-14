using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
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

        public static decimal GetInstallmentReconciliationAmount(TransactionRow txn)
        {
            if (TxPoolClassifier.IsInstallmentTxn(txn) &&
                txn.ChargeAmount.HasValue &&
                txn.ChargeAmount.Value > 0)
                return Math.Abs(txn.ChargeAmount.Value);

            return Math.Abs(txn.Amount);
        }

        public static decimal GetInstallmentReconciliationAmount(TransactionCandidate txn)
        {
            if (TxPoolClassifier.IsInstallmentTxn(txn) &&
                txn.ChargeAmount.HasValue &&
                txn.ChargeAmount.Value > 0)
                return Math.Abs(txn.ChargeAmount.Value);

            return Math.Abs(txn.Amount);
        }
    }

    public class Rule5_1_BatchInvoicePayment : BaseRule
    {
        public override int Layer => 5;
        public override string Name => "Batch Invoice Payment (5.1)";
        public override double Confidence => 0.80;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            return new RuleEvalResult { Matched = false };
        }

        public static List<InvoiceRow>? FindBatchMatch(
            TransactionRow transaction,
            List<InvoiceRow> candidateInvoices,
            double fuzzyScore)
        {
            if (fuzzyScore <= 0.85)
                return null;

            var txnAmount = Math.Abs(transaction.Amount);

            var eligible = candidateInvoices
                .Where(i => i.InvoiceDate.Date <= transaction.TransactionDate.Date)
                .ToList();

            if (eligible.Count == 0)
                return null;

            var allSubsets = CombinationEvaluator.FindAllExactSubsets(eligible, txnAmount);
            return allSubsets.FirstOrDefault();
        }
    }

    public class Rule5_2_InstallmentPlan : BaseRule
    {
        public override int Layer => 5;
        public override string Name => "Installment Plan (5.2)";
        public override double Confidence => 0.90;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (!TxPoolClassifier.IsPaymentPlanInvoice(invoice))
                return new RuleEvalResult { Matched = false };

            if (!TxPoolClassifier.IsInstallmentTxn(transaction))
                return new RuleEvalResult { Matched = false };

            if (transaction.TransactionDate.Date != invoice.InvoiceDate.Date)
                return new RuleEvalResult { Matched = false };

            var cardMatches = !string.IsNullOrWhiteSpace(invoice.LastFourDigitsCard) &&
                              !string.IsNullOrWhiteSpace(transaction.CardLast4) &&
                              string.Equals(invoice.LastFourDigitsCard, transaction.CardLast4, StringComparison.OrdinalIgnoreCase);

            if (fuzzyScore <= 0.80 && !cardMatches)
                return new RuleEvalResult { Matched = false };

            var effectiveAmount = TransactionAmountHelper.GetInstallmentReconciliationAmount(transaction);

            // Determine expected installment amount:
            // 1. Use PaymentPlanInstallmentAmount if available
            // 2. Fallback: estimate from TotalAmount / PaymentPlanTotalInstallments
            decimal? expectedAmount = null;

            if (invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0)
                expectedAmount = invoice.PaymentPlanInstallmentAmount.Value;
            else if (invoice.PaymentPlanTotalInstallments.HasValue &&
                     invoice.PaymentPlanTotalInstallments.Value > 1 &&
                     invoice.TotalAmount > 0)
                expectedAmount = invoice.TotalAmount / invoice.PaymentPlanTotalInstallments.Value;

            if (!expectedAmount.HasValue)
                return new RuleEvalResult { Matched = false };

            var deviationRatio = Math.Abs(effectiveAmount - expectedAmount.Value) / expectedAmount.Value;

            if (deviationRatio < 0.15m)
            {
                return new RuleEvalResult
                {
                    Matched = true,
                    MatchedAmount = effectiveAmount,
                    MatchReason = $"Installment payment matching expected amount of {expectedAmount.Value:F2} (deviation {deviationRatio:P1})"
                };
            }

            return new RuleEvalResult { Matched = false };
        }

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
            var sorted = candidateTransactions
                .OrderBy(t => t.TransactionDate)
                .ToList();

            for (int start = 0; start < sorted.Count; start++)
            {
                var window = new List<TransactionRow>();
                decimal runningSum = 0;

                for (int end = start; end < sorted.Count; end++)
                {
                    var txn = sorted[end];
                    var effectiveAmt = TransactionAmountHelper.GetInstallmentReconciliationAmount(txn);
                    window.Add(txn);
                    runningSum += effectiveAmt;

                    if (Math.Abs(runningSum - target) < 0.01m)
                        return window;

                    if (runningSum > target)
                    {
                        for (int remove = 0; remove < window.Count - 1 && runningSum > target; remove++)
                        {
                            var removedAmt = TransactionAmountHelper.GetInstallmentReconciliationAmount(window[remove]);
                            runningSum -= removedAmt;

                            if (Math.Abs(runningSum - target) < 0.01m)
                                return window.Skip(remove + 1).ToList();
                        }
                        break;
                    }
                }
            }

            return null;
        }
    }
}
