using System.Net;
using System.Text.Json;
using FinalProjectAuthAPI.BL;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class OllamaExtractionServiceTests
    {
        private readonly OllamaSettings _settings;
        private readonly Mock<ILogger<OllamaExtractionService>> _mockLogger;
        private readonly Mock<HttpMessageHandler> _mockHandler;
        private readonly HttpClient _httpClient;
        private readonly Mock<IHttpClientFactory> _mockFactory;

        public OllamaExtractionServiceTests()
        {
            _settings = new OllamaSettings { Url = "http://localhost:11434", Model = "test-model" };
            _mockLogger = new Mock<ILogger<OllamaExtractionService>>();
            _mockHandler = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_mockHandler.Object);
            _mockFactory = new Mock<IHttpClientFactory>();
            _mockFactory.Setup(x => x.CreateClient("ollama")).Returns(_httpClient);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_NullText_ReturnsNull()
        {
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync(null!);

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_EmptyText_ReturnsNull()
        {
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("");

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_WhitespaceText_ReturnsNull()
        {
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("   ");

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_ApiReturnsValidJson_ReturnsResult()
        {
            var ollamaResponse = new
            {
                response = "{\"vendorName\":\"Acme Corp\",\"invoiceNumber\":\"INV-001\",\"totalAmount\":1500.50,\"currency\":\"USD\",\"overallConfidence\":0.95,\"lineItems\":[]}"
            };
            SetupHttpResponse(JsonSerializer.Serialize(ollamaResponse));
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("some invoice text");

            Assert.NotNull(result);
            Assert.Equal("Acme Corp", result!.VendorName);
            Assert.Equal("INV-001", result.InvoiceNumber);
            Assert.Equal(1500.50m, result.TotalAmount);
            Assert.Equal("USD", result.Currency);
            Assert.Equal("ollama", result.ExtractionSource);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_ApiReturnsEmptyResponse_ReturnsNull()
        {
            SetupHttpResponse("{\"response\":\"\"}");
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("some text");

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_ApiReturnsNonJson_ReturnsNull()
        {
            SetupHttpResponse("{\"response\":\"some prose without json\"}");
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("some text");

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_ApiThrows_ReturnsNull()
        {
            _mockHandler.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ThrowsAsync(new HttpRequestException("connection failed"));
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("some text");

            Assert.Null(result);
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_JsonHasExtraProse_ExtractsJson()
        {
            var ollamaResponse = new
            {
                response = "Here is the extracted data: {\"vendorName\":\"Beta Ltd\",\"invoiceNumber\":\"B-100\",\"totalAmount\":200.00,\"currency\":\"ILS\",\"overallConfidence\":0.85,\"lineItems\":[]}"
            };
            SetupHttpResponse(JsonSerializer.Serialize(ollamaResponse));
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.ParseInvoiceTextAsync("some text");

            Assert.NotNull(result);
            Assert.Equal("Beta Ltd", result!.VendorName);
            Assert.Equal("B-100", result.InvoiceNumber);
            Assert.Equal(200.00m, result.TotalAmount);
            Assert.Equal("ILS", result.Currency);
        }

        [Fact]
        public async Task TranslateVendorNameAsync_Empty_ReturnsOriginal()
        {
            SetupHttpResponse("{\"response\":\"[\\\"TestCorp\\\"]\"}");
            var service = new OllamaExtractionService(_settings, _mockFactory.Object, _mockLogger.Object);

            var result = await service.TranslateVendorNameAsync("");

            Assert.Single(result);
            Assert.Equal("", result[0]);
        }

        private void SetupHttpResponse(string jsonContent)
        {
            _mockHandler.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonContent)
                });
        }
    }
}
