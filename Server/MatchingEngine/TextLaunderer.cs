using System.Text.RegularExpressions;

namespace FinalProjectAuthAPI.MatchingEngine
{
    /// <summary>
    /// Text laundering and fuzzy string matching utilities for the matching pipeline.
    /// </summary>
    public static class TextLaunderer
    {
        /// <summary>
        /// Standard corporate suffixes stripped during text laundering.
        /// </summary>
        private static readonly string[] CorporateSuffixes = {
            "inc", "llc", "ltd", "corp", "gmbh", "co", "limited", "sa", "pvt"
        };

        /// <summary>
        /// Cleans an input string for comparison:
        /// 1. Lowercases
        /// 2. Strips corporate suffixes
        /// 3. Removes punctuation and special chars (* - , . / \ _)
        /// 4. Normalizes whitespace
        /// </summary>
        public static string CleanText(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            var result = input.ToLowerInvariant().Trim();

            // Strip corporate suffixes (whole word match only)
            foreach (var suffix in CorporateSuffixes)
            {
                var pattern = $@"\b{suffix}\b";
                result = Regex.Replace(result, pattern, "");
            }

            // Remove punctuation and special characters
            result = Regex.Replace(result, @"[\*\-,\./\\_]", " ");

            // Normalize whitespace: collapse multiple spaces, trim
            result = Regex.Replace(result, @"\s+", " ").Trim();

            return result;
        }

        /// <summary>
        /// Computes Levenshtein distance between two strings.
        /// </summary>
        public static int LevenshteinDistance(string a, string b)
        {
            int lenA = a.Length;
            int lenB = b.Length;
            var dp = new int[lenA + 1, lenB + 1];

            for (int i = 0; i <= lenA; i++) dp[i, 0] = i;
            for (int j = 0; j <= lenB; j++) dp[0, j] = j;

            for (int i = 1; i <= lenA; i++)
            {
                for (int j = 1; j <= lenB; j++)
                {
                    int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
                    dp[i, j] = Math.Min(
                        Math.Min(dp[i - 1, j] + 1, dp[i, j - 1] + 1),
                        dp[i - 1, j - 1] + cost);
                }
            }

            return dp[lenA, lenB];
        }

        /// <summary>
        /// Returns a fuzzy similarity score from 0.0 (completely different) 
        /// to 1.0 (identical) using normalized Levenshtein distance.
        /// </summary>
        public static double FuzzyScore(string? a, string? b)
        {
            var cleanedA = CleanText(a ?? string.Empty);
            var cleanedB = CleanText(b ?? string.Empty);

            if (cleanedA.Length == 0 && cleanedB.Length == 0)
                return 1.0;
            if (cleanedA.Length == 0 || cleanedB.Length == 0)
                return 0.0;

            int distance = LevenshteinDistance(cleanedA, cleanedB);
            int maxLen = Math.Max(cleanedA.Length, cleanedB.Length);

            // Jaro-Winkler-like improvement: bonus for prefix match
            double baseScore = 1.0 - ((double)distance / maxLen);

            // Prefix bonus: up to 0.1 extra for matching first characters
            int prefixLen = 0;
            int maxPrefix = Math.Min(4, Math.Min(cleanedA.Length, cleanedB.Length));
            for (int i = 0; i < maxPrefix; i++)
            {
                if (cleanedA[i] == cleanedB[i])
                    prefixLen++;
                else
                    break;
            }
            double prefixBonus = prefixLen * 0.025;

            return Math.Min(1.0, baseScore + prefixBonus);
        }

        /// <summary>
        /// Extracts a meaningful vendor name from a transaction description
        /// by cleaning and removing common payment boilerplate.
        /// </summary>
        public static string ExtractVendorFromDescription(string? description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return string.Empty;

            var result = description.ToLowerInvariant().Trim();

            // Strip common payment prefixes in English & Hebrew
            string[] prefixes = {
                "payment to ", "payment - ", "bank transfer - ", "transfer to ",
                "wire transfer to ", "direct debit - ", "customer payment - ",
                "ach payment - ", "ach debit - ", "online payment - ",
                "credit card payment - ", "debit card payment - ",
                "העברה ל-", "העברה ל", "תשלום עבור ", "תשלום ל-", "תשלום ל",
                "העברת כספים - ", "חיוב - ", "כרטיס אשראי - ", "כרטיס חיוב - "
            };

            foreach (var p in prefixes)
            {
                if (result.StartsWith(p, StringComparison.OrdinalIgnoreCase))
                {
                    result = result[p.Length..].Trim();
                    break;
                }
            }

            return result;
        }
    }
}