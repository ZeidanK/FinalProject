using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Layer 1: Absolute Direct Matches (Confidence: 99.9%)
    /// </summary>
    public class Rule1_1_ExactMetadataToken : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Exact Metadata Token (1.1)";
        public override double Confidence => 0.999;

        /// <summary>
        /// Rule 1.1: transaction.reference_number or transaction.description 
        /// contains the exact string sequence of invoice.invoice_number 
        /// (where invoice number length > 3).
        /// </summary>
        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber) || invoice.InvoiceNumber.Length <= 3)
                return new RuleEvalResult { Matched = false };

            var invNum = invoice.InvoiceNumber.Trim();

            // Check reference_number
            if (!string.IsNullOrWhiteSpace(transaction.ReferenceNumber) &&
                transaction.ReferenceNumber.IndexOf(invNum, StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new RuleEvalResult
                {
                    Matched = true,
                    MatchedAmount = Math.Abs(transaction.Amount),
                    MatchReason = $"Invoice number '{invNum}' found in transaction reference"
                };
            }

            // Check description
            if (!string.IsNullOrWhiteSpace(transaction.Description) &&
                transaction.Description.IndexOf(invNum, StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return new RuleEvalResult
                {
                    Matched = true,
                    MatchedAmount = Math.Abs(transaction.Amount),
                    MatchReason = $"Invoice number '{invNum}' found in transaction description"
                };
            }

            return new RuleEvalResult { Matched = false };
        }
    }

    /// <summary>
    /// Rule 1.2: The Trinity Match — amount AND vendor name AND date all match exactly.
    /// </summary>
    public class Rule1_2_TrinityMatch : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Trinity Match (1.2)";
        public override double Confidence => 0.999;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.amount == invoice.total_amount
            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // clean_text(transaction.vendor_name) == clean_text(invoice.vendor_name)
            var cleanedTxnVendor = TextLaunderer.CleanText(transaction.VendorName);
            var cleanedInvVendor = TextLaunderer.CleanText(invoice.VendorName);
            if (!string.Equals(cleanedTxnVendor, cleanedInvVendor, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            // transaction.transaction_date == invoice.invoice_date
            if (transaction.TransactionDate.Date != invoice.InvoiceDate.Date)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = "Exact amount, vendor name, and date match (Trinity Match)"
            };
        }
    }

    /// <summary>
    /// Rule 1.3: Tokenized Card Match — card last4 + amount + date window ≤ 3 days.
    /// </summary>
    public class Rule1_3_TokenizedCardMatch : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Tokenized Card Match (1.3)";
        public override double Confidence => 0.999;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            // transaction.card_last4 must not be null
            if (string.IsNullOrWhiteSpace(transaction.CardLast4))
                return new RuleEvalResult { Matched = false };

            // card_last4 matches invoice.last_four_digits_card
            if (!string.Equals(transaction.CardLast4, invoice.LastFourDigitsCard, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            // transaction.amount == invoice.total_amount
            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            // AbsoluteDaysBetween(transaction.transaction_date, invoice.invoice_date) <= 3
            if (AbsoluteDaysBetween(transaction.TransactionDate, invoice.InvoiceDate) > 3)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = Math.Abs(transaction.Amount),
                MatchReason = $"Card last-4 '{transaction.CardLast4}' match with amount and date within 3 days"
            };
        }
    }
}