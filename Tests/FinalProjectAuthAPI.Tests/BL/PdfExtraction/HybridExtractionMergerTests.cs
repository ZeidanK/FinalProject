using FinalProjectAuthAPI.BL.PdfExtraction;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.PdfExtraction
{
    public class HybridExtractionMergerTests
    {
        [Fact]
        public void Merge_LowConfidenceLocalCore_UsesGeminiCoreAndKeepsLocalOptionals()
        {
            var merger = new HybridExtractionMerger(new HybridExtractionSettings
            {
                LocalConfidenceThreshold = 0.75m
            });
            var local = new PdfExtractionResult
            {
                VendorName = "Local Vendor",
                InvoiceNumber = "LOC-1",
                InvoiceDate = new DateTime(2026, 7, 1),
                TotalAmount = 10m,
                DueDate = new DateTime(2026, 7, 15),
                VendorTaxId = "514444444",
                ExtractionConfidence = 0.40m,
                ExtractionSource = "localmodel"
            };
            var gemini = new PdfExtractionResult
            {
                VendorName = "Gemini Vendor",
                InvoiceNumber = "GEM-100",
                InvoiceDate = new DateTime(2026, 7, 2),
                TotalAmount = 100m,
                DueDate = null,
                VendorTaxId = null,
                ExtractionConfidence = 0.92m,
                ExtractionSource = "gemini"
            };

            var merged = merger.Merge(local, gemini);

            Assert.Equal("Gemini Vendor", merged.Result.VendorName);
            Assert.Equal("GEM-100", merged.Result.InvoiceNumber);
            Assert.Equal(new DateTime(2026, 7, 2), merged.Result.InvoiceDate);
            Assert.Equal(100m, merged.Result.TotalAmount);
            Assert.Equal(new DateTime(2026, 7, 15), merged.Result.DueDate);
            Assert.Equal("514444444", merged.Result.VendorTaxId);
            Assert.Equal("gemini", merged.FieldSources["vendorName"]);
            Assert.Equal("gemini", merged.FieldSources["invoiceNumber"]);
            Assert.Equal("gemini", merged.FieldSources["invoiceDate"]);
            Assert.Equal("gemini", merged.FieldSources["totalAmount"]);
            Assert.Equal("localmodel", merged.FieldSources["dueDate"]);
            Assert.Equal("localmodel", merged.FieldSources["vendorTaxId"]);
        }

        [Fact]
        public void Merge_ChoosesHigherScoringLineItems_AndDerivesItemCount()
        {
            var merger = new HybridExtractionMerger(new HybridExtractionSettings());
            var local = new PdfExtractionResult
            {
                ExtractionConfidence = 0.95m,
                ExtractionSource = "localmodel",
                LineItems = new List<ExtractedLineItem>
                {
                    new()
                    {
                        Description = "Service plan",
                        Quantity = 1,
                        UnitPrice = 0,
                        TotalAmount = 0
                    }
                }
            };
            var gemini = new PdfExtractionResult
            {
                ExtractionConfidence = 0.85m,
                ExtractionSource = "gemini",
                LineItems = new List<ExtractedLineItem>
                {
                    new()
                    {
                        Description = "Chair",
                        Quantity = 2,
                        UnitPrice = 50,
                        TotalAmount = 100
                    },
                    new()
                    {
                        Description = "Desk",
                        Quantity = 1,
                        UnitPrice = 120,
                        TotalAmount = 120
                    }
                }
            };

            var merged = merger.Merge(local, gemini);

            Assert.Equal(2, merged.Result.LineItems.Count);
            Assert.Equal(2, merged.Result.ItemCount);
            Assert.Equal("gemini", merged.FieldSources["lineItems"]);
            Assert.Equal("derived", merged.FieldSources["itemCount"]);
        }
    }
}
