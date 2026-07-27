using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    public class Rule1_1_ExactMetadataToken : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Exact Metadata Token (1.1)";
        public override double Confidence => 0.999;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (TxPoolClassifier.IsInstallmentTxn(transaction))
                return new RuleEvalResult { Matched = false };

            if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber) || invoice.InvoiceNumber.Length <= 3)
                return new RuleEvalResult { Matched = false };

            var invNum = invoice.InvoiceNumber.Trim();

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

    public class Rule1_2_TrinityMatch : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Trinity Match (1.2)";
        public override double Confidence => 0.999;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (TxPoolClassifier.IsInstallmentTxn(transaction))
                return new RuleEvalResult { Matched = false };

            if (Math.Abs(Math.Abs(transaction.Amount) - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            var normalizedTxn = VendorNameNormalizer.Normalize(transaction.VendorName);
            var normalizedInv = VendorNameNormalizer.Normalize(invoice.VendorName);
            var cleanedTxn = TextLaunderer.CleanText(normalizedTxn);
            var cleanedInv = TextLaunderer.CleanText(normalizedInv);
            if (!string.Equals(cleanedTxn, cleanedInv, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

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

    public class Rule1_3_TokenizedCardMatch : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Tokenized Card Match (1.3)";
        public override double Confidence => 0.999;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (TxPoolClassifier.IsInstallmentTxn(transaction))
                return new RuleEvalResult { Matched = false };

            if (string.IsNullOrWhiteSpace(transaction.CardLast4))
                return new RuleEvalResult { Matched = false };

            if (!string.Equals(transaction.CardLast4, invoice.LastFourDigitsCard, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
            if (Math.Abs(effectiveAmount - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            if (AbsoluteDaysBetween(transaction.TransactionDate, invoice.InvoiceDate) > 3)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = effectiveAmount,
                MatchReason = $"Card last-4 '{transaction.CardLast4}' match with amount and date within 3 days"
            };
        }
    }

    public class Rule1_4_CardAndAmountMatch : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Card + Amount Match (1.4)";
        public override double Confidence => 0.99;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (TxPoolClassifier.IsInstallmentTxn(transaction))
                return new RuleEvalResult { Matched = false };

            if (string.IsNullOrWhiteSpace(transaction.CardLast4) || string.IsNullOrWhiteSpace(invoice.LastFourDigitsCard))
                return new RuleEvalResult { Matched = false };

            if (!string.Equals(transaction.CardLast4, invoice.LastFourDigitsCard, StringComparison.OrdinalIgnoreCase))
                return new RuleEvalResult { Matched = false };

            var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
            if (Math.Abs(effectiveAmount - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = effectiveAmount,
                MatchReason = $"Card last-4 '{transaction.CardLast4}' and amount ({effectiveAmount:F2}) match invoice"
            };
        }
    }

    public class Rule1_5_AmountAndVendorFuzzyMatch : BaseRule
    {
        public override int Layer => 1;
        public override string Name => "Amount + Vendor Fuzzy Match (1.5)";
        public override double Confidence => 0.95;

        public override RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore)
        {
            if (TxPoolClassifier.IsInstallmentTxn(transaction))
                return new RuleEvalResult { Matched = false };

            var effectiveAmount = TransactionAmountHelper.GetEffectiveAmount(transaction);
            if (Math.Abs(effectiveAmount - invoice.TotalAmount) > 0.001m)
                return new RuleEvalResult { Matched = false };

            if (fuzzyScore <= 0.85)
                return new RuleEvalResult { Matched = false };

            return new RuleEvalResult
            {
                Matched = true,
                MatchedAmount = effectiveAmount,
                MatchReason = $"Amount ({effectiveAmount:F2}) matches invoice total with vendor similarity={fuzzyScore:P1}"
            };
        }
    }
}
