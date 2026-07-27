using FinalProjectAuthAPI.MatchingEngine;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class TextLaundererTests
    {
        [Fact]
        public void CleanText_Lowercases()
        {
            Assert.Equal("acme company", TextLaunderer.CleanText("ACME COMPANY"));
        }

        [Fact]
        public void CleanText_StripsCorporateSuffixes()
        {
            Assert.Equal("acme", TextLaunderer.CleanText("Acme Inc"));
            Assert.Equal("acme", TextLaunderer.CleanText("Acme LLC"));
            Assert.Equal("acme", TextLaunderer.CleanText("Acme Corp"));
            Assert.Equal("acme", TextLaunderer.CleanText("Acme Ltd"));
        }

        [Fact]
        public void CleanText_RemovesPunctuation()
        {
            Assert.Equal("acme", TextLaunderer.CleanText("Acme-Corp"));
            Assert.Equal("acme corp", TextLaunderer.CleanText("Acme_Corp"));
        }

        [Fact]
        public void CleanText_ReturnsEmptyForNullOrWhitespace()
        {
            Assert.Equal("", TextLaunderer.CleanText(null));
            Assert.Equal("", TextLaunderer.CleanText(""));
            Assert.Equal("", TextLaunderer.CleanText("  "));
        }

        [Fact]
        public void CleanText_NormalizesWhitespace()
        {
            Assert.Equal("acme", TextLaunderer.CleanText("  Acme   Corp  "));
        }

        [Fact]
        public void LevenshteinDistance_IdenticalStrings_ReturnsZero()
        {
            Assert.Equal(0, TextLaunderer.LevenshteinDistance("hello", "hello"));
        }

        [Fact]
        public void LevenshteinDistance_CompletelyDifferent_ReturnsLength()
        {
            Assert.Equal(5, TextLaunderer.LevenshteinDistance("abcde", ""));
            Assert.Equal(5, TextLaunderer.LevenshteinDistance("", "abcde"));
        }

        [Fact]
        public void LevenshteinDistance_SingleInsertion_ReturnsOne()
        {
            Assert.Equal(1, TextLaunderer.LevenshteinDistance("cat", "cats"));
        }

        [Fact]
        public void FuzzyScore_IdenticalStrings_ReturnsOne()
        {
            Assert.Equal(1.0, TextLaunderer.FuzzyScore("Acme Corp", "Acme Corp"));
        }

        [Fact]
        public void FuzzyScore_SimilarStrings_ReturnsModerateScore()
        {
            var score = TextLaunderer.FuzzyScore("Acme Corporation", "Acme Corp");
            Assert.True(score > 0.3);
            Assert.True(score < 0.5);
        }

        [Fact]
        public void FuzzyScore_MatchingPrefix_ReturnsHighScore()
        {
            var score = TextLaunderer.FuzzyScore("Acme", "Acme Corp");
            Assert.True(score > 0.85);
        }

        [Fact]
        public void FuzzyScore_EmptyInputs_ReturnsOne()
        {
            Assert.Equal(1.0, TextLaunderer.FuzzyScore("", ""));
        }

        [Fact]
        public void FuzzyScore_OneEmpty_ReturnsZero()
        {
            Assert.Equal(0.0, TextLaunderer.FuzzyScore("hello", ""));
        }

        [Fact]
        public void ExtractVendorFromDescription_StripsPrefix()
        {
            Assert.Equal("amazon", TextLaunderer.ExtractVendorFromDescription("Payment to Amazon"));
            Assert.Equal("walmart", TextLaunderer.ExtractVendorFromDescription("Payment - Walmart"));
        }

        [Fact]
        public void ExtractVendorFromDescription_HandlesEmpty()
        {
            Assert.Equal("", TextLaunderer.ExtractVendorFromDescription(null));
            Assert.Equal("", TextLaunderer.ExtractVendorFromDescription(""));
        }

        [Fact]
        public void ExtractVendorFromDescription_ReturnsTrimmed()
        {
            Assert.Equal("vendor", TextLaunderer.ExtractVendorFromDescription("  bank transfer - vendor  "));
        }
    }
}
