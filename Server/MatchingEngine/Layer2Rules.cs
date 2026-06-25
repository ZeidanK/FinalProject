using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Rule 2.1: Standard Post-Dated Window
    /// Amount match + transaction date between invoice_date and (due_date + 14 days) + fuzzy_score > 0.85.
    /// </summary>
    public class Rule2_1_StandardPostDatedWindow : BaseRule
    {
        public override int Layer => 2;
        public override string Name => "Standard Post-Dated Window (2.1)";
        public override double Confidence => 0.90;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.amount == invoice.total_amount
            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // transaction.transaction_date is between invoice.invoice_date and (invoice.due_date + 14 days)
            var windowEnd = invoice.DueDate?.AddDays(14) ?? invoice.InvoiceDate.AddDays(14);
            if (transaction.TransactionDate.Date < invoice.InvoiceDate.Date ||
                transaction.TransactionDate.Date > windowEnd.Date)
                return new RuleEvalResult { Matched = false };

            // fuzzy_score(transaction.description/vendor_name, invoice.vendor_name) > 0.85
            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = $"Amount match within post-dated window (invoice={invoice.InvoiceDate:yyyy-MM-dd} to due+14d={windowEnd:yyyy-MM-dd}), vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule 2.2: Retroactive / Pre-Paid Deposit Window
    /// Amount match + transaction_date is up to 31 days *prior* to invoice_date + fuzzy_score > 0.90.
    /// </summary>
    public class Rule2_2_RetroactivePrePaidWindow : BaseRule
    {
        public override int Layer => 2;
        public override string Name => "Retroactive / Pre-Paid Window (2.2)";
        public override double Confidence => 0.90;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.amount == invoice.total_amount
            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // transaction.transaction_date is up to 31 days prior to invoice.invoice_date
            var daysBefore = (invoice.InvoiceDate.Date - transaction.TransactionDate.Date).Days;
            if (daysBefore < 0 || daysBefore > 31)
                return new RuleEvalResult { Matched = false };

            // fuzzy_score > 0.90
            if (fuzzyScore <= 0.90)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = $"Amount match with retroactive/pre-paid window (txn {daysBefore} days before invoice), vendor similarity={fuzzyScore:P1}"
            };
        }
    }

    /// <summary>
    /// Rule 2.3: Fuzzy Name Containment + Amount
    /// Amount match + clean_text(description) contains clean_text(vendor_name) OR vice versa.
    /// </summary>
    public class Rule2_3_FuzzyNameContainment : BaseRule
    {
        public override int Layer => 2;
        public override string Name => "Fuzzy Name Containment (2.3)";
        public override double Confidence => 0.90;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.amount == invoice.total_amount
            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            var cleanedInvVendor = TextLaunderer.CleanText(invoice.VendorName);
            if (string.IsNullOrWhiteSpace(cleanedInvVendor))
                return new RuleEvalResult { Matched = false };

            var cleanedDescription = TextLaunderer.CleanText(transaction.Description);
            var cleanedTxnVendor = TextLaunderer.CleanText(transaction.VendorName);

            // Check if clean_text(description) contains clean_text(vendor_name)
            bool descriptionContains = TextContains(cleanedDescription, cleanedInvVendor);

            // Check if clean_text(vendor_name) contains clean_text(transaction.vendor_name)
            bool invoiceContains = !string.IsNullOrWhiteSpace(cleanedTxnVendor) &&
                                   TextContains(cleanedInvVendor, cleanedTxnVendor);

            if (!descriptionContains && !invoiceContains)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = descriptionContains
                    ? $"Transaction description contains vendor name '{invoice.VendorName}'"
                    : $"Invoice vendor name contains transaction vendor '{transaction.VendorName}'"
            };
        }
    }
}