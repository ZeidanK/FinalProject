using System.Text;
using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class PdfExtractionServiceTests
    {
        private readonly Mock<IWebHostEnvironment> _mockEnv;
        private readonly Mock<IGeminiExtractionService> _mockGemini;
        private readonly Mock<ILogger<PdfExtractionService>> _mockLogger;
        private readonly IServiceProvider _serviceProvider;
        private readonly PdfExtractionService _service;

        public PdfExtractionServiceTests()
        {
            _mockEnv = new Mock<IWebHostEnvironment>();
            _mockEnv.Setup(x => x.ContentRootPath).Returns(Path.GetTempPath());
            _mockEnv.Setup(x => x.WebRootPath).Returns(Path.GetTempPath());
            _mockGemini = new Mock<IGeminiExtractionService>();
            _mockLogger = new Mock<ILogger<PdfExtractionService>>();
            _serviceProvider = new ServiceCollection().BuildServiceProvider();
            var mockServiceProvider = new Mock<IServiceProvider>();
            _service = new PdfExtractionService(
                _mockEnv.Object,
                _mockGemini.Object, mockServiceProvider.Object,
                _serviceProvider,
                _mockLogger.Object,
                new HybridExtractionSettings { Enabled = false });
        }

        private static MemoryStream MakePdfStream(string text = "dummy text")
        {
            var bytes = Encoding.UTF8.GetBytes(text);
            return new MemoryStream(bytes);
        }

        [Fact]
        public async Task ExtractAsync_GeminiReturnsResult_ReturnsResult()
        {
            var expected = new PdfExtractionResult
            {
                VendorName = "Acme",
                ExtractionConfidence = 0.95m,
                ExtractionSource = "gemini"
            };
            _mockGemini.Setup(x => x.ParseInvoiceTextAsync(It.IsAny<string>()))
                .ReturnsAsync(expected);

            var result = await _service.ExtractAsync(MakePdfStream("invoice text"), "test.pdf");

            Assert.NotNull(result);
            Assert.Equal("Acme", result.ExtractedData.VendorName);
        }

        [Fact]
        public async Task ExtractAsync_GeminiReturnsNull_FallsBackToRegex()
        {
            _mockGemini.Setup(x => x.ParseInvoiceTextAsync(It.IsAny<string>()))
                .ReturnsAsync((PdfExtractionResult?)null);

            var result = await _service.ExtractAsync(MakePdfStream("Invoice #123 from Vendor"), "test.pdf");

            Assert.NotNull(result);
            Assert.Equal("regex", result.ExtractedData.ExtractionSource);
            Assert.True(result.UsedRegexFallback);
        }

        [Fact]
        public async Task ExtractAsync_GeminiThrows_FallsBackToRegex()
        {
            _mockGemini.Setup(x => x.ParseInvoiceTextAsync(It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("API error"));

            var result = await _service.ExtractAsync(MakePdfStream("simple text"), "test.pdf");

            Assert.NotNull(result);
            Assert.Equal("regex", result.ExtractedData.ExtractionSource);
            Assert.True(result.UsedRegexFallback);
        }
    }
}
