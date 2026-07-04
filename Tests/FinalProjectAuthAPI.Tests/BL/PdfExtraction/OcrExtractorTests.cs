using FinalProjectAuthAPI.BL.PdfExtraction;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.PdfExtraction
{
    public class OcrExtractorTests
    {
        [Fact]
        public void Constructor_NullTessdataPath_DoesNotThrow()
        {
            var extractor = new OcrExtractor(null!);
            Assert.NotNull(extractor);
        }

        [Fact]
        public void ExtractText_TessdataPathNotFound_ReturnsEmptyString()
        {
            var extractor = new OcrExtractor("C:\\nonexistent\\tessdata");
            var stream = new System.IO.MemoryStream(new byte[] { 0, 1, 2 });
            var result = extractor.ExtractText(stream);
            Assert.NotNull(result);
            Assert.Equal("", result);
        }

        [Fact]
        public void ExtractText_EmptyStream_TessdataMissing_ReturnsEmptyString()
        {
            var extractor = new OcrExtractor("Z:\\invalid\\path");
            var result = extractor.ExtractText(new System.IO.MemoryStream());
            Assert.NotNull(result);
            Assert.Equal("", result);
        }
    }
}