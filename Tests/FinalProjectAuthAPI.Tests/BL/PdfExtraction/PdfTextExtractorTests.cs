using FinalProjectAuthAPI.BL.PdfExtraction;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.PdfExtraction
{
    public class PdfTextExtractorTests
    {
        [Fact]
        public void ExtractText_InvalidPdfStream_ReturnsEmptyString()
        {
            var extractor = new PdfTextExtractor();
            var stream = new System.IO.MemoryStream(new byte[] { 0, 1, 2, 3, 4 });
            var result = extractor.ExtractText(stream);
            Assert.NotNull(result);
            Assert.Equal("", result);
        }

        [Fact]
        public void ExtractText_EmptyStream_ReturnsEmptyString()
        {
            var extractor = new PdfTextExtractor();
            var stream = new System.IO.MemoryStream();
            var result = extractor.ExtractText(stream);
            Assert.NotNull(result);
            Assert.Equal("", result);
        }

        [Fact]
        public void ExtractText_NullStream_Throws()
        {
            var extractor = new PdfTextExtractor();
            Assert.Throws<System.ArgumentNullException>(() => extractor.ExtractText(null!));
        }
    }
}