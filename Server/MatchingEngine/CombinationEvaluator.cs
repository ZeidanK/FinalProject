using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Evaluates subset-sum combinations of invoice totals to match 
    /// a single transaction amount (Rule 5.1: Batch Invoice Payment).
    /// </summary>
    public static class CombinationEvaluator
    {
        /// <summary>
        /// Finds any subset of the given invoices whose total_amount sums exactly to the target amount.
        /// Uses a recursive backtracking approach optimized for small sets (typically < 20 invoices).
        /// </summary>
        /// <param name="invoices">The pool of candidate invoices.</param>
        /// <param name="targetAmount">The transaction amount to match.</param>
        /// <param name="maxInvoices">Maximum number of invoices in a valid subset (default: unlimited).</param>
        /// <returns>The first valid subset found, or null if no subset sums to the target.</returns>
        public static List<InvoiceRow>? FindExactSubset(List<InvoiceRow> invoices, decimal targetAmount, int? maxInvoices = null)
        {
            if (invoices == null || invoices.Count == 0 || targetAmount <= 0)
                return null;

            // Sort by amount descending to optimize: larger amounts = fewer combinations to try
            var sorted = invoices.OrderByDescending(i => i.TotalAmount).ToList();

            var current = new List<InvoiceRow>();
            var result = FindSubset(sorted, targetAmount, 0, current, maxInvoices);
            return result;
        }

        /// <summary>
        /// Finds all subsets of invoices that sum exactly to the target amount.
        /// </summary>
        public static List<List<InvoiceRow>> FindAllExactSubsets(List<InvoiceRow> invoices, decimal targetAmount, int? maxInvoices = null)
        {
            var results = new List<List<InvoiceRow>>();
            if (invoices == null || invoices.Count == 0 || targetAmount <= 0)
                return results;

            var sorted = invoices.OrderByDescending(i => i.TotalAmount).ToList();
            FindAllSubsets(sorted, targetAmount, 0, new List<InvoiceRow>(), results, maxInvoices);

            // Return subsets sorted by count (prefer fewer invoices for simpler matches)
            return results.OrderBy(s => s.Count).ToList();
        }

        private static List<InvoiceRow>? FindSubset(
            List<InvoiceRow> invoices, decimal remaining, int startIndex,
            List<InvoiceRow> current, int? maxInvoices)
        {
            if (remaining == 0)
                return new List<InvoiceRow>(current);

            if (remaining < 0 || startIndex >= invoices.Count)
                return null;

            if (maxInvoices.HasValue && current.Count >= maxInvoices.Value)
                return null;

            for (int i = startIndex; i < invoices.Count; i++)
            {
                var inv = invoices[i];
                if (inv.TotalAmount > remaining)
                    continue;

                current.Add(inv);
                var result = FindSubset(invoices, remaining - inv.TotalAmount, i + 1, current, maxInvoices);
                if (result != null)
                    return result;
                current.RemoveAt(current.Count - 1);
            }

            return null;
        }

        private static void FindAllSubsets(
            List<InvoiceRow> invoices, decimal remaining, int startIndex,
            List<InvoiceRow> current, List<List<InvoiceRow>> results, int? maxInvoices)
        {
            if (remaining == 0)
            {
                results.Add(new List<InvoiceRow>(current));
                return;
            }

            if (remaining < 0 || startIndex >= invoices.Count)
                return;

            if (maxInvoices.HasValue && current.Count >= maxInvoices.Value)
                return;

            for (int i = startIndex; i < invoices.Count; i++)
            {
                var inv = invoices[i];
                if (inv.TotalAmount > remaining)
                    continue;

                current.Add(inv);
                FindAllSubsets(invoices, remaining - inv.TotalAmount, i + 1, current, results, maxInvoices);
                current.RemoveAt(current.Count - 1);
            }
        }
    }
}