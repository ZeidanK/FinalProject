using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Centralizes the logic for deciding whether an invoice should be matched
    /// against installment transactions ("תשלומים") only, or normal transactions only.
    /// </summary>
    public static class TxPoolClassifier
    {
        /// <summary>
        /// Heuristic definition of a "payment-plan" invoice.
        /// </summary>
        public static bool IsPaymentPlanInvoice(InvoiceRow invoice)
        {
            if (invoice == null) return false;

            return (invoice.PaymentPlanTotalInstallments.HasValue && invoice.PaymentPlanTotalInstallments.Value > 1)
                || (invoice.PaymentPlanInstallmentAmount.HasValue && invoice.PaymentPlanInstallmentAmount.Value > 0)
                || !string.IsNullOrWhiteSpace(invoice.PaymentPlanDescription);
        }

        public static bool IsInstallmentTxn(TransactionRow txn)
        {
            return txn != null && string.Equals(txn.TransactionType, "תשלומים", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Filters transactions to the pool allowed for a given invoice.
        /// </summary>
        public static List<TransactionRow> FilterTxnsForInvoice(
            InvoiceRow invoice,
            List<TransactionRow> candidateTransactions)
        {
            if (candidateTransactions == null) return new List<TransactionRow>();

            var wantsInstallmentsOnly = IsPaymentPlanInvoice(invoice);

            return candidateTransactions
                .Where(t => wantsInstallmentsOnly ? IsInstallmentTxn(t) : !IsInstallmentTxn(t))
                .ToList();
        }
    }
}

