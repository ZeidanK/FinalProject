using System.Text.Json;
using FinalProjectAuthAPI.BL.GeminiExtraction;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.GeminiExtraction
{
    public class GeminiResponseParserTests
    {
        private readonly GeminiResponseParser _parser = new();

        [Fact]
        public void Parse_NullText_ReturnsNull()
        {
            Assert.Null(_parser.Parse(null!));
        }

        [Fact]
        public void Parse_EmptyText_ThrowsJsonException_ReturnsNull()
        {
            Assert.Null(_parser.Parse(""));
        }

        [Fact]
        public void Parse_WhitespaceText_Throws_ReturnsNull()
        {
            Assert.Null(_parser.Parse("   "));
        }

        [Fact]
        public void Parse_InvalidJson_ReturnsNull()
        {
            Assert.Null(_parser.Parse("{invalid json}"));
        }

        [Fact]
        public void Parse_ValidFullInvoice_ReturnsPdfExtractionResult()
        {
            var json = @"{
                ""vendorName"": ""Acme Corp"",
                ""invoiceNumber"": ""INV-001"",
                ""invoiceDate"": ""2026-06-01"",
                ""dueDate"": ""2026-07-01"",
                ""totalAmount"": 1500.50,
                ""subtotal"": 1200.00,
                ""vatRate"": 17,
                ""vatAmount"": 204.00,
                ""currency"": ""USD"",
                ""vendorTaxId"": ""12-3456789"",
                ""lastFourDigitsCard"": ""1234"",
                ""itemCount"": 2,
                ""overallConfidence"": 0.95,
                ""lineItems"": [
                    { ""description"": ""Widget"", ""quantity"": 2, ""unitPrice"": 500, ""totalAmount"": 1000 },
                    { ""description"": ""Gadget"", ""quantity"": 1, ""unitPrice"": 200, ""totalAmount"": 200 }
                ]
            }";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Equal("Acme Corp", result!.VendorName);
            Assert.Equal("INV-001", result.InvoiceNumber);
            Assert.Equal(new System.DateTime(2026, 6, 1), result.InvoiceDate);
            Assert.Equal(new System.DateTime(2026, 7, 1), result.DueDate);
            Assert.Equal(1500.50m, result.TotalAmount);
            Assert.Equal(1200.00m, result.Subtotal);
            Assert.Equal(17m, result.VatRate);
            Assert.Equal(204.00m, result.VatAmount);
            Assert.Equal("USD", result.Currency);
            Assert.Equal("12-3456789", result.VendorTaxId);
            Assert.Equal("1234", result.LastFourDigitsCard);
            Assert.Equal(2, result.ItemCount);
            Assert.Equal(0.95m, result.ExtractionConfidence);
            Assert.Equal("gemini", result.ExtractionSource);
            Assert.Equal(2, result.LineItems.Count);
        }

        [Fact]
        public void Parse_MissingOptionalFields_DefaultsGracefully()
        {
            var json = @"{""vendorName"": ""Beta""}";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Equal("Beta", result!.VendorName);
            Assert.Equal("USD", result.Currency);
            Assert.Equal(0.5m, result.ExtractionConfidence);
            Assert.Empty(result.LineItems);
        }

        [Fact]
        public void Parse_EmptyLineItems_ReturnsEmptyList()
        {
            var json = @"{""vendorName"": ""Gamma"", ""lineItems"": []}";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Empty(result!.LineItems);
        }

        [Fact]
        public void Parse_WithMarkdownCodeBlock_StripsMarkdown()
        {
            var json = @"```json
{""vendorName"": ""Delta"", ""invoiceNumber"": ""D-100"", ""totalAmount"": 500, ""overallConfidence"": 0.9}
```";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Equal("Delta", result!.VendorName);
            Assert.Equal("D-100", result.InvoiceNumber);
        }

        [Fact]
        public void Parse_WithMarkdownCodeBlockNoLang_StripsMarkdown()
        {
            var json = @"```
{""vendorName"": ""Epsilon"", ""invoiceNumber"": ""E-200"", ""totalAmount"": 750, ""overallConfidence"": 0.85}
```";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Equal("Epsilon", result!.VendorName);
        }

        [Fact]
        public void Parse_NumbersAsStrings_ReadsFromString()
        {
            var json = @"{
                ""vendorName"": ""Zeta"",
                ""totalAmount"": ""1234.56"",
                ""overallConfidence"": ""0.88"",
                ""lineItems"": [{ ""description"": ""Item"", ""totalAmount"": ""100.00"" }]
            }";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Equal(1234.56m, result!.TotalAmount);
            Assert.Equal(0.88m, result.ExtractionConfidence);
            Assert.Single(result.LineItems);
            Assert.Equal(100.00m, result.LineItems[0].TotalAmount);
        }

        [Fact]
        public void Parse_PaymentPlan_ParsesCorrectly()
        {
            var json = @"{
                ""vendorName"": ""Eta"",
                ""totalAmount"": 3000,
                ""overallConfidence"": 0.9,
                ""paymentPlan"": {
                    ""totalInstallments"": 3,
                    ""installmentAmount"": 1000,
                    ""frequency"": ""monthly"",
                    ""currentInstallment"": 1,
                    ""description"": ""Monthly payment plan""
                }
            }";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.NotNull(result!.PaymentPlan);
            Assert.Equal(3, result.PaymentPlan.TotalInstallments);
            Assert.Equal(1000m, result.PaymentPlan.InstallmentAmount);
            Assert.Equal("monthly", result.PaymentPlan.Frequency);
            Assert.Equal(1, result.PaymentPlan.CurrentInstallment);
            Assert.Equal("Monthly payment plan", result.PaymentPlan.Description);
        }

        [Fact]
        public void Parse_LineItemWithAllFields_Parses()
        {
            var json = @"{
                ""vendorName"": ""Theta"",
                ""totalAmount"": 300,
                ""overallConfidence"": 0.9,
                ""lineItems"": [{
                    ""description"": ""Item X"",
                    ""quantity"": 5,
                    ""unitPrice"": 50,
                    ""totalAmount"": 250,
                    ""vatRate"": 17,
                    ""category"": ""office"",
                    ""aiConfidenceScore"": 0.95
                }]
            }";

            var result = _parser.Parse(json);

            Assert.NotNull(result);
            Assert.Single(result!.LineItems);
            var li = result.LineItems[0];
            Assert.Equal("Item X", li.Description);
            Assert.Equal(5m, li.Quantity);
            Assert.Equal(50m, li.UnitPrice);
            Assert.Equal(250m, li.TotalAmount);
            Assert.Equal(17m, li.VatRate);
            Assert.Equal("office", li.Category);
            Assert.Equal(0.95m, li.AiConfidenceScore);
        }
    }
}