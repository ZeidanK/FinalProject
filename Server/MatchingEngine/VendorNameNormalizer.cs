using System.Text.RegularExpressions;

namespace FinalProjectAuthAPI.MatchingEngine
{
    public static class VendorNameNormalizer
    {
        /// <summary>
        /// Normalizes a vendor name for comparison by stripping trailing location info
        /// (all-caps location suffixes like "STOCKHOLM     SE", "GITHUB.COM    US"),
        /// extra whitespace, and common suffixes.
        /// </summary>
        public static string Normalize(string? vendorName)
        {
            if (string.IsNullOrWhiteSpace(vendorName))
                return string.Empty;

            var result = vendorName.Trim();

            // Strip trailing location pattern: multiple spaces followed by all-caps location
            // e.g., "GITHUB, INC.           GITHUB.COM    US" -> "GITHUB, INC."
            // e.g., "AMAZON MKTPL*K93JY3BF3 AMZN.COM/BILL US" -> no change (no trailing location)
            result = Regex.Replace(result, @"\s{2,}[A-Z0-9.\/\*]+\s{2,}[A-Z]{2}\s*$", "");

            // Strip trailing single location word (e.g., "KRAKEN        GB" -> "KRAKEN")
            result = Regex.Replace(result, @"\s{2,}[A-Z]{2}\s*$", "");

            // Strip trailing "COUNTRY" pattern (e.g., "STOCKHOLM     SE" after previous)
            result = Regex.Replace(result, @"\s{2,}[A-Z][A-Z\s]+\s*$", "");

            // Replace multiple spaces with single space
            result = Regex.Replace(result, @"\s+", " ").Trim();

            // Remove trailing comma/period/space
            result = result.TrimEnd(',', '.', ' ', '\t');

            return result;
        }

        /// <summary>
        /// Gets a cleaned, normalized version for display.
        /// </summary>
        public static string GetDisplayName(string? vendorName)
        {
            var normalized = Normalize(vendorName);
            if (string.IsNullOrWhiteSpace(normalized))
                return string.Empty;

            // Capitalize first letter of each word
            return Regex.Replace(normalized.ToLowerInvariant(), @"\b[a-z]", m => m.Value.ToUpperInvariant());
        }
    }
}
