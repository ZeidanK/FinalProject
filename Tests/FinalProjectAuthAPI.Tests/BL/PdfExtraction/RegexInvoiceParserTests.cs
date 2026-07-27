using FinalProjectAuthAPI.BL.PdfExtraction;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.PdfExtraction
{
    public class RegexInvoiceParserTests
    {
        private readonly RegexInvoiceParser _parser = new();

        // ── Parse (overall) ───────────────────────────────────────────────────

        [Fact]
        public void Parse_NullText_ReturnsResultWithZeroConfidence()
        {
            var result = _parser.Parse(null!);
            Assert.NotNull(result);
            Assert.Equal(0, result.ExtractionConfidence);
        }

        [Fact]
        public void Parse_EmptyText_ReturnsResultWithZeroConfidence()
        {
            var result = _parser.Parse("");
            Assert.NotNull(result);
            Assert.Equal(0, result.ExtractionConfidence);
        }

        [Fact]
        public void Parse_WhitespaceText_ReturnsResultWithZeroConfidence()
        {
            var result = _parser.Parse("   \n  \t  ");
            Assert.NotNull(result);
            Assert.Equal(0, result.ExtractionConfidence);
        }

        // ── Invoice Number ────────────────────────────────────────────────────

        [Fact]
        public void Parse_InvoiceNumber_StandardLabel_Extracts()
        {
            var result = _parser.Parse("Invoice #INV-001\nTotal: $100");
            Assert.Equal("INV-001", result.InvoiceNumber);
        }

        [Fact]
        public void Parse_InvoiceNumber_ReceiptLabel_Extracts()
        {
            var result = _parser.Parse("Receipt No: 12345\nTotal: $50");
            Assert.Equal("12345", result.InvoiceNumber);
        }

        [Fact]
        public void Parse_InvoiceNumber_BillLabel_Extracts()
        {
            var result = _parser.Parse("Bill Number: B-789\nTotal: $200");
            Assert.Equal("B-789", result.InvoiceNumber);
        }

        [Fact]
        public void Parse_InvoiceNumber_Hebrew_Extracts()
        {
            var result = _parser.Parse("חשבונית מס' 9876\nסכום: ₪500");
            Assert.Equal("9876", result.InvoiceNumber);
        }

        [Fact]
        public void Parse_InvoiceNumber_ShortPrefix_Extracts()
        {
            var result = _parser.Parse("inv-42\nTotal: $100");
            Assert.Equal("42", result.InvoiceNumber);
        }

        // ── Vendor Name ───────────────────────────────────────────────────────

        [Fact]
        public void Parse_VendorName_FromLabel_Extracts()
        {
            var result = _parser.Parse("From: Acme Corp\nInvoice #123");
            Assert.Equal("Acme Corp", result.VendorName);
        }

        [Fact]
        public void Parse_VendorName_SupplierLabel_Extracts()
        {
            var result = _parser.Parse("Supplier: Beta Ltd\nInvoice #456");
            Assert.Equal("Beta Ltd", result.VendorName);
        }

        [Fact]
        public void Parse_VendorName_HebrewFrom_Extracts()
        {
            var result = _parser.Parse("מאת: חברה בע\"מ\nInvoice #789");
            Assert.Contains("חברה", result.VendorName);
        }

        [Fact]
        public void Parse_VendorName_FallbackToFirstLines_Extracts()
        {
            var result = _parser.Parse("Acme Corporation\n123 Main St\nInvoice #100\nTotal: $500");
            Assert.Equal("Acme Corporation", result.VendorName);
        }

        [Fact]
        public void Parse_VendorName_FallbackSkipsDateInvoiceLines()
        {
            var result = _parser.Parse("Date: 01/06/2026\nInvoice #100\nTotal: $500");
            Assert.Null(result.VendorName);
        }

        // ── Invoice Date ──────────────────────────────────────────────────────

        [Fact]
        public void Parse_InvoiceDate_StandardLabel_Extracts()
        {
            var result = _parser.Parse("Invoice Date: 01/06/2026\nTotal: $100");
            Assert.Equal(new System.DateTime(2026, 6, 1), result.InvoiceDate);
        }

        [Fact]
        public void Parse_InvoiceDate_UsFormat_Extracts()
        {
            var result = _parser.Parse("Invoice Date: 06/15/2026\nTotal: $100");
            Assert.Equal(new System.DateTime(2026, 6, 15), result.InvoiceDate);
        }

        [Fact]
        public void Parse_InvoiceDate_IsoFormat_Extracts()
        {
            var result = _parser.Parse("date of issue: 2026-07-04\nTotal: $100");
            Assert.Equal(new System.DateTime(2026, 7, 4), result.InvoiceDate);
        }

        [Fact]
        public void Parse_InvoiceDate_MonthName_Extracts()
        {
            var result = _parser.Parse("Invoice Date: June 1, 2026\nTotal: $100");
            Assert.Equal(new System.DateTime(2026, 6, 1), result.InvoiceDate);
        }

        [Fact]
        public void Parse_InvoiceDate_Fallback_Extracts()
        {
            var result = _parser.Parse("Some random text with 15/03/2026 date\nTotal: $200");
            Assert.Equal(new System.DateTime(2026, 3, 15), result.InvoiceDate);
        }

        // ── Currency ──────────────────────────────────────────────────────────

        [Fact]
        public void Parse_Currency_Shekel_ReturnsILS()
        {
            var result = _parser.Parse("Total: ₪500");
            Assert.Equal("ILS", result.Currency);
        }

        [Fact]
        public void Parse_Currency_Nis_ReturnsILS()
        {
            var result = _parser.Parse("Total: NIS 500");
            Assert.Equal("ILS", result.Currency);
        }

        [Fact]
        public void Parse_Currency_Dollar_ReturnsUSD()
        {
            var result = _parser.Parse("Amount Due: $1,500.00");
            Assert.Equal("USD", result.Currency);
        }

        [Fact]
        public void Parse_Currency_Euro_ReturnsEUR()
        {
            var result = _parser.Parse("Total: €2,000.00");
            Assert.Equal("EUR", result.Currency);
        }

        [Fact]
        public void Parse_Currency_Pound_ReturnsGBP()
        {
            var result = _parser.Parse("Total: £750.00");
            Assert.Equal("GBP", result.Currency);
        }

        [Fact]
        public void Parse_Currency_Unknown_ReturnsNull()
        {
            var result = _parser.Parse("Total: 500.00");
            Assert.Null(result.Currency);
        }

        // ── Total Amount ──────────────────────────────────────────────────────

        [Fact]
        public void Parse_TotalAmount_GrandTotal_Extracts()
        {
            var result = _parser.Parse("Grand Total: $1,500.50");
            Assert.Equal(1500.50m, result.TotalAmount);
        }

        [Fact]
        public void Parse_TotalAmount_AmountDue_Extracts()
        {
            var result = _parser.Parse("Amount Due: $2,000.00");
            Assert.Equal(2000.00m, result.TotalAmount);
        }

        [Fact]
        public void Parse_TotalAmount_TotalDue_Extracts()
        {
            var result = _parser.Parse("Total Due: $750.25");
            Assert.Equal(750.25m, result.TotalAmount);
        }

        [Fact]
        public void Parse_TotalAmount_TotalLabel_Extracts()
        {
            var result = _parser.Parse("Total: $100.00");
            Assert.Equal(100.00m, result.TotalAmount);
        }

        [Fact]
        public void Parse_TotalAmount_HebrewTotal_Extracts()
        {
            var result = _parser.Parse("סה\"כ: ₪500.00");
            Assert.Equal(500.00m, result.TotalAmount);
        }

        [Fact]
        public void Parse_TotalAmount_CommaSeparated_Extracts()
        {
            var result = _parser.Parse("Grand Total: $1,234,567.89");
            Assert.Equal(1234567.89m, result.TotalAmount);
        }

        // ── Subtotal ──────────────────────────────────────────────────────────

        [Fact]
        public void Parse_Subtotal_Extracts()
        {
            var result = _parser.Parse("Subtotal: $800.00\nTax: $200.00");
            Assert.Equal(800.00m, result.Subtotal);
        }

        [Fact]
        public void Parse_Subtotal_Hebrew_Extracts()
        {
            var result = _parser.Parse("סה\"כ לפני: ₪800.00\nמע\"מ: ₪152.00");
            Assert.Equal(800.00m, result.Subtotal);
        }

        // ── Vat Amount ────────────────────────────────────────────────────────

        [Fact]
        public void Parse_VatAmount_SalesTax_Extracts()
        {
            var result = _parser.Parse("Sales Tax: $150.00\nTotal: $950.00");
            Assert.Equal(150.00m, result.VatAmount);
        }

        [Fact]
        public void Parse_VatAmount_VatLabel_Extracts()
        {
            var result = _parser.Parse("VAT Amount: 17.00\nTotal: 117.00");
            Assert.Equal(17.00m, result.VatAmount);
        }

        [Fact]
        public void Parse_VatAmount_Hebrew_Extracts()
        {
            var result = _parser.Parse("מע\"מ סכום: ₪152.00\nסה\"כ: ₪952.00");
            Assert.Equal(152.00m, result.VatAmount);
        }

        // ── Vat Rate ──────────────────────────────────────────────────────────

        [Fact]
        public void Parse_VatRate_Extracts()
        {
            var result = _parser.Parse("VAT (17%): $17.00\nTotal: $117.00");
            Assert.Equal(17m, result.VatRate);
        }

        [Fact]
        public void Parse_VatRate_DecimalRate_Extracts()
        {
            var result = _parser.Parse("Tax: 8.25%\nTotal: $108.25");
            Assert.Equal(8.25m, result.VatRate);
        }

        // ── Vendor Tax ID ─────────────────────────────────────────────────────

        [Fact]
        public void Parse_VendorTaxId_TaxIdLabel_Extracts()
        {
            var result = _parser.Parse("Tax ID: 123456789\nTotal: $500");
            Assert.Equal("123456789", result.VendorTaxId);
        }

        [Fact]
        public void Parse_VendorTaxId_VatReg_Extracts()
        {
            var result = _parser.Parse("VAT Reg: IL-123456789\nTotal: $500");
            Assert.Contains("123456789", result.VendorTaxId);
        }

        [Fact]
        public void Parse_VendorTaxId_Hebrew_Extracts()
        {
            var result = _parser.Parse("ע.מ: 512345678\nTotal: ₪1,000");
            Assert.Contains("512345678", result.VendorTaxId);
        }

        // ── Last Four Digits ──────────────────────────────────────────────────

        [Fact]
        public void Parse_LastFourDigits_AsteriskFormat_Extracts()
        {
            var result = _parser.Parse("Card: ****1234\nTotal: $100");
            Assert.Equal("1234", result.LastFourDigitsCard);
        }

        [Fact]
        public void Parse_LastFourDigits_EndingIn_Extracts()
        {
            var result = _parser.Parse("Card ending in 5678\nTotal: $100");
            Assert.Equal("5678", result.LastFourDigitsCard);
        }

        [Fact]
        public void Parse_LastFourDigits_Last4_Extracts()
        {
            var result = _parser.Parse("Last 4: 9012\nTotal: $100");
            Assert.Equal("9012", result.LastFourDigitsCard);
        }

        // ── Line Items ────────────────────────────────────────────────────────

        [Fact]
        public void Parse_LineItems_DescriptionFirst4Col_Parses()
        {
            var text = @"Widget A    2    $25.00   $50.00
Widget B    1    $30.00   $30.00
Subtotal: $80.00";
            var result = _parser.Parse(text);
            Assert.NotEmpty(result.LineItems);
            Assert.Equal(2, result.LineItems.Count);
            Assert.Contains(result.LineItems, li => li.Description.Contains("Widget A") && li.TotalAmount == 50m);
            Assert.Contains(result.LineItems, li => li.Description.Contains("Widget B") && li.TotalAmount == 30m);
        }

        [Fact]
        public void Parse_LineItems_QuantityFirst4Col_Parses()
        {
            var text = @"Qty  Description    Price   Total
2    Product X    $25.00   $50.00
1    Product Y    $30.00   $30.00
Total: $80.00";
            var result = _parser.Parse(text);
            Assert.NotEmpty(result.LineItems);
            Assert.Equal(2, result.LineItems.Count);
        }

        [Fact]
        public void Parse_LineItems_DescriptionFirst3Col_Parses()
        {
            var text = @"Service A    $100.00   $100.00
Service B    $200.00   $200.00
Total: $300.00";
            var result = _parser.Parse(text);
            Assert.NotEmpty(result.LineItems);
            Assert.Equal(2, result.LineItems.Count);
        }

        [Fact]
        public void Parse_LineItems_DescriptionFirst2Col_Parses()
        {
            var text = @"Consulting    $500.00
Training      $300.00
Total: $800.00";
            var result = _parser.Parse(text);
            Assert.NotEmpty(result.LineItems);
            Assert.Equal(2, result.LineItems.Count);
            Assert.Equal(500.00m, result.LineItems[0].TotalAmount);
        }

        [Fact]
        public void Parse_LineItems_SkipsHeaderAndFooterLines()
        {
            var text = @"Description    Qty    Price   Total
Item A    1    $10.00   $10.00
Item B    2    $15.00   $30.00
Sales Tax: $4.00
Total: $44.00";
            var result = _parser.Parse(text);
            Assert.Equal(2, result.LineItems.Count);
        }

        [Fact]
        public void Parse_LineItems_EmptyBody_ReturnsNone()
        {
            var text = @"Invoice #123
From: Vendor
Total: $100.00";
            var result = _parser.Parse(text);
            Assert.Empty(result.LineItems);
        }

        // ── Computed Amounts ──────────────────────────────────────────────────

        [Fact]
        public void Parse_TotalFromSubtotalPlusVat_ComputesTotal()
        {
            var result = _parser.Parse("Subtotal: $800.00\nVAT Amount: $152.00");
            Assert.Equal(800m, result.Subtotal);
            Assert.Equal(152m, result.VatAmount);
            Assert.Equal(952m, result.TotalAmount);
        }

        [Fact]
        public void Parse_SubtotalFromTotalMinusVat_ComputesSubtotal()
        {
            var result = _parser.Parse("Total: $1,000.00\nVAT Amount: $170.00");
            Assert.Equal(1000m, result.TotalAmount);
            Assert.Equal(170m, result.VatAmount);
            Assert.Equal(830m, result.Subtotal);
        }

        // ── Confidence Score ──────────────────────────────────────────────────

        [Fact]
        public void Parse_FullExtraction_HighConfidence()
        {
            var text = @"Invoice #INV-001
From: Acme Corp
Invoice Date: 01/06/2026
Tax ID: 123456789
Card: ****1234
Grand Total: $1,000.00
Subtotal: $800.00
VAT Amount: $200.00
Currency: USD";
            var result = _parser.Parse(text);
            Assert.True(result.ExtractionConfidence >= 0.5m);
        }
    }
}