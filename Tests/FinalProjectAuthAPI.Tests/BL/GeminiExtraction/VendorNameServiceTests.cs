using FinalProjectAuthAPI.BL.GeminiExtraction;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.GeminiExtraction
{
    public class VendorNameServiceTests
    {
        private readonly GeminiSettings _settings;
        private readonly GeminiApiKeyPool _keyPool;

        public VendorNameServiceTests()
        {
            _settings = new GeminiSettings
            {
                ApiKeys = new List<string> { "test-key" },
                Model = "gemini-2.0-flash"
            };
            _keyPool = new GeminiApiKeyPool(_settings);
        }

        [Fact]
        public async Task TranslateVendorNameAsync_EmptyVendorName_ReturnsOriginal()
        {
            var logger = new Mock<ILogger<GeminiApiClient>>();
            var apiClient = new GeminiApiClient(_keyPool, _settings, logger.Object);
            var service = new VendorNameService(apiClient);
            var result = await service.TranslateVendorNameAsync("");
            Assert.Single(result);
            Assert.Equal("", result[0]);
        }

        [Fact]
        public async Task TranslateVendorNameAsync_WhitespaceVendorName_ReturnsOriginal()
        {
            var logger = new Mock<ILogger<GeminiApiClient>>();
            var apiClient = new GeminiApiClient(_keyPool, _settings, logger.Object);
            var service = new VendorNameService(apiClient);
            var result = await service.TranslateVendorNameAsync("   ");
            Assert.Single(result);
            Assert.Equal("   ", result[0]);
        }

        [Fact]
        public async Task TranslateVendorNameAsync_ApiReturnsNull_ReturnsOriginal()
        {
            var logger = new Mock<ILogger<GeminiApiClient>>();
            var apiClient = new GeminiApiClient(_keyPool, _settings, logger.Object);
            var service = new VendorNameService(apiClient);
            var result = await service.TranslateVendorNameAsync("Acme Corp");
            Assert.Single(result);
            Assert.Equal("Acme Corp", result[0]);
        }

        [Fact]
        public async Task CompareVendorNamesAsync_EmptyTransactionList_ReturnsEmpty()
        {
            var logger = new Mock<ILogger<GeminiApiClient>>();
            var apiClient = new GeminiApiClient(_keyPool, _settings, logger.Object);
            var service = new VendorNameService(apiClient);
            var result = await service.CompareVendorNamesAsync("Acme", new List<string>());
            Assert.Empty(result);
        }
    }
}