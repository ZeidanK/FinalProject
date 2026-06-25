using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Interface for a single matching rule within the pipeline.
    /// Each rule evaluates whether a given invoice and transaction pair should match.
    /// </summary>
    public interface IMatchingRule
    {
        /// <summary>
        /// The layer number this rule belongs to (1-5).
        /// </summary>
        int Layer { get; }

        /// <summary>
        /// Human-readable name of this rule.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// Confidence level assigned when this rule produces a match (0.0 to 1.0).
        /// </summary>
        double Confidence { get; }

        /// <summary>
        /// Evaluates whether the given invoice and transaction match according to this rule.
        /// </summary>
        RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore);
    }

    /// <summary>
    /// Base class with shared helpers for all rules.
    /// </summary>
    public abstract class BaseRule : IMatchingRule
    {
        public abstract int Layer { get; }
        public abstract string Name { get; }
        public abstract double Confidence { get; }
        public abstract RuleEvalResult Evaluate(InvoiceRow invoice, TransactionRow transaction, double fuzzyScore);

        /// <summary>
        /// Returns the absolute number of days between two dates.
        /// </summary>
        protected static int AbsoluteDaysBetween(DateTime d1, DateTime d2)
        {
            return Math.Abs((d1.Date - d2.Date).Days);
        }

        /// <summary>
        /// Determines whether a transaction description or vendor name contains 
        /// a given substring (used for containment checks).
        /// </summary>
        protected static bool TextContains(string haystack, string needle)
        {
            if (string.IsNullOrWhiteSpace(haystack) || string.IsNullOrWhiteSpace(needle))
                return false;
            return haystack.Contains(needle, StringComparison.OrdinalIgnoreCase);
        }
    }
}