using FinalProjectAuthAPI.BL.InvoiceVerification;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.InvoiceVerification
{
    public class InvoiceJobPayloadSerializerTests
    {
        private readonly InvoiceJobPayloadSerializer _serializer = new();

        // ── ReadStoredPayload ─────────────────────────────────────────────────

        [Fact]
        public void ReadStoredPayload_NullJson_ReturnsEmptyResult()
        {
            var result = _serializer.ReadStoredPayload(null);
            Assert.NotNull(result);
            Assert.Null(result.InvoiceId);
            Assert.False(result.IsDuplicate);
            Assert.Null(result.ExtractedData);
        }

        [Fact]
        public void ReadStoredPayload_EmptyJson_ReturnsEmptyResult()
        {
            var result = _serializer.ReadStoredPayload("");
            Assert.NotNull(result);
            Assert.Null(result.InvoiceId);
        }

        [Fact]
        public void ReadStoredPayload_WhitespaceJson_ReturnsEmptyResult()
        {
            var result = _serializer.ReadStoredPayload("   ");
            Assert.NotNull(result);
            Assert.Null(result.InvoiceId);
        }

        [Fact]
        public void ReadStoredPayload_InvalidJson_ReturnsEmptyResult()
        {
            var result = _serializer.ReadStoredPayload("{invalid}");
            Assert.NotNull(result);
            Assert.Null(result.InvoiceId);
        }

        [Fact]
        public void ReadStoredPayload_ValidJson_Deserializes()
        {
            var json = @"{""invoiceId"": 42, ""isDuplicate"": true, ""extractedData"": {""vendorName"": ""Acme"", ""totalAmount"": 1000}}";

            var result = _serializer.ReadStoredPayload(json);

            Assert.NotNull(result);
            Assert.Equal(42, result.InvoiceId);
            Assert.True(result.IsDuplicate);
            Assert.NotNull(result.ExtractedData);
            Assert.Equal("Acme", result.ExtractedData.VendorName);
            Assert.Equal(1000m, result.ExtractedData.TotalAmount);
        }

        [Fact]
        public void ReadStoredPayload_ValidJsonNoExtractedData_Deserializes()
        {
            var json = @"{""invoiceId"": 7, ""isDuplicate"": false}";

            var result = _serializer.ReadStoredPayload(json);

            Assert.NotNull(result);
            Assert.Equal(7, result.InvoiceId);
            Assert.False(result.IsDuplicate);
            Assert.Null(result.ExtractedData);
        }

        // ── BuildResultJson ───────────────────────────────────────────────────

        [Fact]
        public void BuildResultJson_WithAllFields_ReturnsJson()
        {
            var extracted = new PdfExtractionResult
            {
                VendorName = "Acme",
                TotalAmount = 1000m,
                ExtractionConfidence = 0.95m
            };
            var autoMatch = new InvoiceJobAutoMatchResult
            {
                Matched = true,
                MatchId = 5,
                MatchScore = 85m
            };

            var json = _serializer.BuildResultJson(extracted, 42, false, autoMatch, "Created");

            Assert.Contains("42", json);
            Assert.Contains("Acme", json);
            Assert.Contains("85", json);
            Assert.Contains("Created", json);
        }

        [Fact]
        public void BuildResultJson_NullExtracted_OmitsExtractedData()
        {
            var json = _serializer.BuildResultJson(null, 1, false, null, "OK");

            Assert.Contains("\"invoiceId\":1", json);
            Assert.DoesNotContain("extractedData", json);
        }

        [Fact]
        public void BuildResultJson_IsDuplicate_SerializesFlag()
        {
            var json = _serializer.BuildResultJson(null, 1, true, null, "Duplicate");

            Assert.Contains("\"isDuplicate\":true", json);
        }

        // ── Result ────────────────────────────────────────────────────────────

        [Fact]
        public void Result_WithAllFields_ReturnsVerificationResult()
        {
            var result = _serializer.Result(1, "verified", "OK", 0.95m, 42);

            Assert.Equal(1, result.JobId);
            Assert.Equal("verified", result.Outcome);
            Assert.Equal("OK", result.Message);
            Assert.Equal(0.95m, result.Confidence);
            Assert.Equal(42, result.InvoiceId);
        }

        [Fact]
        public void Result_WithoutOptionalFields_ReturnsDefaults()
        {
            var result = _serializer.Result(1, "failed", "Error");

            Assert.Equal(1, result.JobId);
            Assert.Equal("failed", result.Outcome);
            Assert.Equal("Error", result.Message);
            Assert.Null(result.Confidence);
            Assert.Null(result.InvoiceId);
        }
    }
}