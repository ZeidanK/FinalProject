using FinalProjectAuthAPI.BL.InvoiceVerification;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.InvoiceVerification
{
    public class InvoiceJobValidatorTests
    {
        private readonly InvoiceJobValidator _validator = new();

        // ── ValidateExtractedInvoice ──────────────────────────────────────────

        [Fact]
        public void ValidateExtractedInvoice_NullInvoiceNumber_ReturnsError()
        {
            var extracted = new PdfExtractionResult
            {
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 1000m
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.NotNull(error);
            Assert.Contains("Invoice number", error);
        }

        [Fact]
        public void ValidateExtractedInvoice_EmptyInvoiceNumber_ReturnsError()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "",
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 1000m
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.NotNull(error);
        }

        [Fact]
        public void ValidateExtractedInvoice_NullVendorName_ReturnsError()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 1000m
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.NotNull(error);
            Assert.Contains("Vendor name", error);
        }

        [Fact]
        public void ValidateExtractedInvoice_EmptyVendorName_ReturnsError()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 1000m
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.NotNull(error);
        }

        [Fact]
        public void ValidateExtractedInvoice_NullInvoiceDate_ReturnsError()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                TotalAmount = 1000m
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.NotNull(error);
            Assert.Contains("Invoice date", error);
        }

        [Fact]
        public void ValidateExtractedInvoice_NullTotalAmount_ReturnsError()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1)
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.NotNull(error);
            Assert.Contains("Invoice total", error);
        }

        [Fact]
        public void ValidateExtractedInvoice_AllFieldsValid_ReturnsNull()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 1000m
            };

            var error = _validator.ValidateExtractedInvoice(extracted);

            Assert.Null(error);
        }

        // ── ValidateReviewedInvoice ───────────────────────────────────────────

        [Fact]
        public void ValidateReviewedInvoice_NullInvoiceNumber_ReturnsError()
        {
            var request = new CreateInvoiceRequest
            {
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 1000m
            };

            var error = _validator.ValidateReviewedInvoice(request);

            Assert.NotNull(error);
            Assert.Contains("Invoice number", error);
        }

        [Fact]
        public void ValidateReviewedInvoice_EmptyVendorName_ReturnsError()
        {
            var request = new CreateInvoiceRequest
            {
                InvoiceNumber = "INV-001",
                VendorName = "",
                InvoiceDate = new System.DateTime(2026, 6, 1)
            };

            var error = _validator.ValidateReviewedInvoice(request);

            Assert.NotNull(error);
            Assert.Contains("Vendor name", error);
        }

        [Fact]
        public void ValidateReviewedInvoice_DefaultInvoiceDate_ReturnsError()
        {
            var request = new CreateInvoiceRequest
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                InvoiceDate = default
            };

            var error = _validator.ValidateReviewedInvoice(request);

            Assert.NotNull(error);
            Assert.Contains("Invoice date", error);
        }

        [Fact]
        public void ValidateReviewedInvoice_AllFieldsValid_ReturnsNull()
        {
            var request = new CreateInvoiceRequest
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1)
            };

            var error = _validator.ValidateReviewedInvoice(request);

            Assert.Null(error);
        }

        // ── BuildInvoiceRequest ───────────────────────────────────────────────

        [Fact]
        public void BuildInvoiceRequest_ValidExtracted_MapsAllFields()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme Corp",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                DueDate = new System.DateTime(2026, 7, 1),
                TotalAmount = 1500.00m,
                Subtotal = 1200.00m,
                VatRate = 17m,
                VatAmount = 300.00m,
                Currency = "ILS",
                VendorTaxId = "123456789",
                LastFourDigitsCard = "1234",
                ItemCount = 2,
                PaymentPlan = new PaymentPlanInfo
                {
                    TotalInstallments = 3,
                    InstallmentAmount = 500m,
                    Frequency = "monthly",
                    CurrentInstallment = 1,
                    Description = "Plan"
                },
                LineItems = new List<ExtractedLineItem>
                {
                    new() { Description = "Item A", Quantity = 2, UnitPrice = 500, TotalAmount = 1000, VatRate = 17, Category = "office", AiConfidenceScore = 0.95m },
                    new() { Description = "", Quantity = 1, UnitPrice = 200, TotalAmount = 200 }
                }
            };

            var request = _validator.BuildInvoiceRequest(5, extracted);

            Assert.Equal(5, request.CompanyId);
            Assert.Equal("INV-001", request.InvoiceNumber);
            Assert.Equal("Acme Corp", request.VendorName);
            Assert.Equal(new System.DateTime(2026, 6, 1), request.InvoiceDate);
            Assert.Equal(new System.DateTime(2026, 7, 1), request.DueDate);
            Assert.Equal(1500.00m, request.TotalAmount);
            Assert.Equal(1200.00m, request.Subtotal);
            Assert.Equal(17m, request.VatRate);
            Assert.Equal(300.00m, request.VatAmount);
            Assert.Equal("ILS", request.Currency);
            Assert.Equal("123456789", request.VendorTaxId);
            Assert.Equal("1234", request.LastFourDigitsCard);
            Assert.Equal(2, request.ItemCount);
            Assert.Equal(3, request.PaymentPlanTotalInstallments);
            Assert.Equal(500m, request.PaymentPlanInstallmentAmount);
            Assert.Equal("monthly", request.PaymentPlanFrequency);
            Assert.Equal("Plan", request.PaymentPlanDescription);
            Assert.Equal(1, request.PaymentPlanCurrentInstallment);
            Assert.Equal(2, request.LineItems.Count);
            Assert.Equal("Item A", request.LineItems[0].Description);
            Assert.Equal("Item", request.LineItems[1].Description); // empty description defaults to "Item"
        }

        [Fact]
        public void BuildInvoiceRequest_NullCurrency_DefaultsToUSD()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 100m
            };

            var request = _validator.BuildInvoiceRequest(1, extracted);

            Assert.Equal("USD", request.Currency);
        }

        [Fact]
        public void BuildInvoiceRequest_WhitespaceCurrency_DefaultsToUSD()
        {
            var extracted = new PdfExtractionResult
            {
                InvoiceNumber = "INV-001",
                VendorName = "Acme",
                InvoiceDate = new System.DateTime(2026, 6, 1),
                TotalAmount = 100m,
                Currency = "  "
            };

            var request = _validator.BuildInvoiceRequest(1, extracted);

            Assert.Equal("USD", request.Currency);
        }
    }
}