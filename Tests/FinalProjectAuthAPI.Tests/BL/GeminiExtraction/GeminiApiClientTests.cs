using FinalProjectAuthAPI.BL.GeminiExtraction;
using FinalProjectAuthAPI.Models;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.GeminiExtraction
{
    public class GeminiApiClientTests
    {
        private readonly GeminiSettings _settings;
        private readonly Mock<ILogger<GeminiApiClient>> _mockLogger;
        private readonly GeminiApiKeyPool _keyPool;

        public GeminiApiClientTests()
        {
            _settings = new GeminiSettings
            {
                ApiKeys = new List<string> { "key1", "key2" },
                Model = "gemini-2.0-flash",
                Models = new List<string> { "gemini-2.0-flash" }
            };
            _mockLogger = new Mock<ILogger<GeminiApiClient>>();
            _keyPool = new GeminiApiKeyPool(_settings);
        }

        [Fact]
        public void Constructor_WithModelsList_UsesModels()
        {
            var client = new GeminiApiClient(_keyPool, _settings, _mockLogger.Object);
            Assert.NotNull(client);
        }

        [Fact]
        public void Constructor_EmptyModelsList_FallsBackToSingleModel()
        {
            var settings = new GeminiSettings
            {
                ApiKeys = new List<string> { "key1" },
                Model = "gemini-2.0-flash",
                Models = new List<string>()
            };
            var client = new GeminiApiClient(_keyPool, settings, _mockLogger.Object);
            Assert.NotNull(client);
        }

        [Fact]
        public async Task TryAllModelsAsync_AllModelsFail_ReturnsNull()
        {
            var client = new GeminiApiClient(_keyPool, _settings, _mockLogger.Object);
            var result = await client.TryAllModelsAsync<string>(async model =>
            {
                await Task.Delay(1);
                return null;
            }, "TestOperation");
            Assert.Null(result);
        }

        [Fact]
        public async Task TryAllModelsAsync_FirstModelSucceeds_ReturnsResult()
        {
            var client = new GeminiApiClient(_keyPool, _settings, _mockLogger.Object);
            var result = await client.TryAllModelsAsync<string>(async model =>
            {
                await Task.Delay(1);
                return "success";
            }, "TestOperation");
            Assert.Equal("success", result);
        }

        [Fact]
        public async Task TryAllModelsAsync_ExceptionOnFirst_RetriesNext()
        {
            int callCount = 0;
            var client = new GeminiApiClient(_keyPool, _settings, _mockLogger.Object);
            var result = await client.TryAllModelsAsync<string>(async model =>
            {
                await Task.Delay(1);
                callCount++;
                if (callCount == 1) throw new InvalidOperationException("First failed");
                return "second_ok";
            }, "TestOperation");
            Assert.Equal("second_ok", result);
            Assert.Equal(2, callCount);
        }

        [Fact]
        public async Task TryAllModelsAsync_QuotaExhaustion_LogsWarning()
        {
            int callCount = 0;
            var client = new GeminiApiClient(_keyPool, _settings, _mockLogger.Object);
            var result = await client.TryAllModelsAsync<string>(async model =>
            {
                await Task.Delay(1);
                callCount++;
                throw new HttpRequestException("429 Too Many Requests", null, System.Net.HttpStatusCode.TooManyRequests);
            }, "TestOperation");
            Assert.Null(result);
        }
    }
}