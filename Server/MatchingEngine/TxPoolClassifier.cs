using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    public static class TxPoolClassifier
    {
        public static bool IsPaymentPlanInvoice(InvoiceRow invoice)
        {
            if (invoice == null) return false;
            return invoice.PaymentPlanTotalInstallments.HasValue && invoice.PaymentPlanTotalInstallments.Value > 1;
        }

        public static bool IsInstallmentType(string? transactionType)
        {
            return string.Equals(transactionType, "תשלומים", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(transactionType, "×ª×©×œ×•×ž×™×", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsInstallmentTxn(TransactionRow txn)
        {
            return txn != null && IsInstallmentType(txn.TransactionType);
        }

        public static bool IsInstallmentTxn(TransactionCandidate txn)
        {
            return txn != null && IsInstallmentType(txn.TransactionType);
        }

        public static bool IsMonthlyChargeTxn(TransactionRow txn)
        {
            return txn != null && string.Equals(txn.TransactionType, "חיוב חודשי", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsImmediateChargeTxn(TransactionRow txn)
        {
            return txn != null && string.Equals(txn.TransactionType, "חיוב עסקות מיידי", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsCreditTxn(TransactionRow txn)
        {
            return txn != null && string.Equals(txn.TransactionType, "קרדיט", StringComparison.OrdinalIgnoreCase);
        }

        public static bool IsRegularTxn(TransactionRow txn)
        {
            return txn != null && string.Equals(txn.TransactionType, "רגילה", StringComparison.OrdinalIgnoreCase);
        }

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
