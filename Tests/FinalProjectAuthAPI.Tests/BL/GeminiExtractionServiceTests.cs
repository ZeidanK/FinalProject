using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.GeminiExtraction;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class GeminiExtractionServiceTests
    {
        [Fact]
        public async Task ParseInvoiceTextAsync_NullText_ReturnsNull()
        {
            var settings = new GeminiSettings();
            var keyPool = new GeminiApiKeyPool(new GeminiSettings());
            var loggerFactory = new Mock<ILoggerFactory>();
            loggerFactory.Setup(x => x.CreateLogger(It.IsAny<string>())).Returns(new Mock<ILogger>().Object);
            var logger = new Mock<ILogger<GeminiExtractionService>>();
            var service = new GeminiExtractionService(settings, keyPool, loggerFactory.Object, logger.Object);

            var result = await service.ParseInvoiceTextAsync(null!);

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_EmptyText_ReturnsNull()
        {
            var settings = new GeminiSettings();
            var keyPool = new GeminiApiKeyPool(new GeminiSettings());
            var loggerFactory = new Mock<ILoggerFactory>();
            loggerFactory.Setup(x => x.CreateLogger(It.IsAny<string>())).Returns(new Mock<ILogger>().Object);
            var logger = new Mock<ILogger<GeminiExtractionService>>();
            var service = new GeminiExtractionService(settings, keyPool, loggerFactory.Object, logger.Object);

            var result = await service.ParseInvoiceTextAsync("");

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_WhitespaceText_ReturnsNull()
        {
            var settings = new GeminiSettings();
            var keyPool = new GeminiApiKeyPool(new GeminiSettings());
            var loggerFactory = new Mock<ILoggerFactory>();
            loggerFactory.Setup(x => x.CreateLogger(It.IsAny<string>())).Returns(new Mock<ILogger>().Object);
            var logger = new Mock<ILogger<GeminiExtractionService>>();
            var service = new GeminiExtractionService(settings, keyPool, loggerFactory.Object, logger.Object);

            var result = await service.ParseInvoiceTextAsync("   ");

            Assert.Null(result);
        }
    }
}
