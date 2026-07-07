using System.Net;
using System.Text;
using System.Text.Json;
using FinalProjectAuthAPI.BL;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class LocalModelExtractionServiceTests
    {
        private sealed class JsonHandler : HttpMessageHandler
        {
            private readonly string _json;
            public JsonHandler(string json) => _json = json;

            protected override Task<HttpResponseMessage> SendAsync(
                HttpRequestMessage request,
                CancellationToken cancellationToken) =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(_json, Encoding.UTF8, "application/json")
                });
        }

        [Fact]
        public async Task ParseInvoiceTextAsync_MapsFullParityContract()
        {
            var json = JsonSerializer.Serialize(new
            {
                vendor_name = "Acme",
                invoice_number = "INV-1",
                invoice_date = "2026-07-01",
                total_amount = "120.00",
                currency = "ILS",
                last_four_digits_card = "2420",
                item_count = 1,
                payment_plan = new
                {
                    total_installments = 6,
                    installment_amount = 20,
                    frequency = "monthly",
                    current_installment = 2,
                    description = "Payment 2 of 6"
                },
                line_items = new[]
                {
                    new
                    {
                        description = "Chair",
                        quantity = 2,
                        unit_price = 50,
                        total_amount = 100,
                        vat_rate = 17,
                        category = (string?)null,
                        ai_confidence_score = 0.91m
                    }
                },
                confidence = 0.94m
            });
            var clientFactory = new Mock<IHttpClientFactory>();
            clientFactory.Setup(factory => factory.CreateClient("localmodel"))
                .Returns(new HttpClient(new JsonHandler(json)));
            var service = new LocalModelExtractionService(
                new LocalModelSettings { Url = "http://local.test" },
                clientFactory.Object,
                Mock.Of<ILogger<LocalModelExtractionService>>());

            var result = await service.ParseInvoiceTextAsync("invoice text");

            Assert.NotNull(result);
            Assert.Equal("2420", result!.LastFourDigitsCard);
            Assert.Equal(1, result.ItemCount);
            Assert.Equal(6, result.PaymentPlan!.TotalInstallments);
            Assert.Equal(20m, result.PaymentPlan.InstallmentAmount);
            Assert.Equal("monthly", result.PaymentPlan.Frequency);
            Assert.Single(result.LineItems);
            Assert.Equal("Chair", result.LineItems[0].Description);
            Assert.Equal(0.91m, result.LineItems[0].AiConfidenceScore);
        }
    }
}
