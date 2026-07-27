using ClosedXML.Excel;
using FinalProjectAuthAPI.BL;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class ExcelExtractionServiceTests
    {
        private readonly ExcelExtractionService _service = new();

        private static Stream MakeExcel(Action<IXLWorkbook> build)
        {
            var wb = new XLWorkbook();
            build(wb);
            var ms = new MemoryStream();
            wb.SaveAs(ms);
            ms.Position = 0;
            return ms;
        }

        private static void AddSheet(IXLWorkbook wb, string name, string[] headers, params string[][] rows)
        {
            var ws = wb.Worksheets.Add(name);
            for (int c = 0; c < headers.Length; c++)
                ws.Cell(1, c + 1).Value = headers[c];
            for (int r = 0; r < rows.Length; r++)
                for (int c = 0; c < rows[r].Length; c++)
                    ws.Cell(r + 2, c + 1).Value = rows[r][c];
        }

        [Fact]
        public void Extract_EmptySheet_ReturnsError()
        {
            var stream = MakeExcel(wb =>
            {
                var ws = wb.Worksheets.Add("Sheet1");
                ws.Cell(1, 1).Value = "irrelevant";
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal("test.xlsx", result.FileName);
            Assert.Single(result.Sheets);
            Assert.NotEmpty(result.Sheets[0].Errors);
            Assert.Empty(result.Transactions);
        }

        [Fact]
        public void Extract_NoHeaderRow_ReturnsError()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "random", "stuff" },
                    new[] { "x", "y" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Single(result.Sheets);
            Assert.NotEmpty(result.Sheets[0].Errors);
            Assert.Empty(result.Transactions);
        }

        [Fact]
        public void Extract_MissingRequiredColumns_ReturnsError()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "description", "reference" },
                    new[] { "Some desc", "REF001" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Single(result.Sheets);
            Assert.NotEmpty(result.Sheets[0].Errors);
            Assert.Empty(result.Transactions);
        }

        [Fact]
        public void Extract_ValidStandardColumns_ParsesRows()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "Payment to supplier", "1500.50" },
                    new[] { "02/06/2026", "Office supplies", "-200.00" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(2, result.TotalExtracted);
            Assert.Equal(0, result.TotalSkipped);
            Assert.Equal("Payment to supplier", result.Transactions[0].Description);
            Assert.Equal(1500.50m, result.Transactions[0].Amount);
            Assert.Equal("credit", result.Transactions[0].TransactionType);
            Assert.Equal("Office supplies", result.Transactions[1].Description);
            Assert.Equal(-200.00m, result.Transactions[1].Amount);
            Assert.Equal("debit", result.Transactions[1].TransactionType);
        }

        [Fact]
        public void Extract_DebitCreditColumns_ParsesRows()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "debit", "credit" },
                    new[] { "01/06/2026", "Withdrawal", "500.00", "" },
                    new[] { "02/06/2026", "Deposit", "", "1200.00" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(2, result.TotalExtracted);
            Assert.Equal(-500.00m, result.Transactions[0].Amount);
            Assert.Equal("debit", result.Transactions[0].TransactionType);
            Assert.Equal(1200.00m, result.Transactions[1].Amount);
            Assert.Equal("credit", result.Transactions[1].TransactionType);
        }

        [Fact]
        public void Extract_HebrewHeaders_ParsesRows()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "תאריך", "תיאור", "סכום עסקה" },
                    new[] { "15/03/2026", "רשת מזון", "320.90" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Single(result.Transactions);
            Assert.Equal("רשת מזון", result.Transactions[0].Description);
            Assert.Equal(320.90m, result.Transactions[0].Amount);
        }

        [Fact]
        public void Extract_DateFormats_ParsesCorrectly()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "2026-06-01", "ISO format", "100" },
                    new[] { "06/15/2026", "US format", "200" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(2, result.TotalExtracted);
            Assert.Equal(new DateTime(2026, 6, 1), result.Transactions[0].TransactionDate);
            Assert.Equal(new DateTime(2026, 6, 15), result.Transactions[1].TransactionDate);
        }

        [Fact]
        public void Extract_AmountWithCurrencySymbol_ParsesCorrectly()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "Payment", "₪1,500.50" },
                    new[] { "02/06/2026", "Refund", "$200.00" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(1500.50m, result.Transactions[0].Amount);
            Assert.Equal(200.00m, result.Transactions[1].Amount);
        }

        [Fact]
        public void Extract_ParenthesesNegative_ParsesCorrectly()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "Payment", "(500.00)" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(-500.00m, result.Transactions[0].Amount);
            Assert.Equal("debit", result.Transactions[0].TransactionType);
        }

        [Fact]
        public void Extract_EmptyRows_Skipped()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "Valid", "100" },
                    new[] { "", "", "" },
                    new[] { "03/06/2026", "Another", "200" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(2, result.TotalExtracted);
            Assert.Equal(1, result.TotalSkipped);
        }

        [Fact]
        public void Extract_NoAmountColumnForDate_Skipped()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "Valid", "0" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Empty(result.Transactions);
        }

        [Fact]
        public void Extract_MultipleSheets_CombinesTransactions()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Jan", new[] { "date", "description", "amount" },
                    new[] { "01/01/2026", "Jan txn", "100" });
                AddSheet(wb, "Feb", new[] { "date", "description", "amount" },
                    new[] { "01/02/2026", "Feb txn", "200" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(2, result.TotalExtracted);
            Assert.Equal(2, result.Sheets.Count);
            Assert.Equal("Jan", result.Transactions[0].SheetName);
            Assert.Equal("Feb", result.Transactions[1].SheetName);
        }

        [Fact]
        public void Extract_CreditCardHeaders_ParsesCardFields()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Card", new[] { "תאריך", "תיאור", "סכום חיוב", "4 ספרות אחרונות", "מטבע חיוב" },
                    new[] { "01/06/2026", "Online purchase", "350.00", "1234", "USD" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Single(result.Transactions);
            Assert.Equal(350.00m, result.Transactions[0].ChargeAmount);
            Assert.Equal("1234", result.Transactions[0].CardLast4);
            Assert.Equal("USD", result.Transactions[0].ChargeCurrency);
        }

        [Fact]
        public void Extract_PostedDateColumn_ParsesPostedDate()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "posted date", "description", "amount" },
                    new[] { "01/06/2026", "05/06/2026", "Purchase", "99.99" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal(new DateTime(2026, 6, 1), result.Transactions[0].TransactionDate);
            Assert.Equal(new DateTime(2026, 6, 5), result.Transactions[0].PostedDate);
        }

        [Fact]
        public void Extract_ReferenceAndVendor_ParsesOptionalFields()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount", "reference", "vendor name" },
                    new[] { "01/06/2026", "Payment", "250", "REF-001", "Acme Corp" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal("REF-001", result.Transactions[0].ReferenceNumber);
            Assert.Equal("Acme Corp", result.Transactions[0].VendorName);
        }

        [Fact]
        public void Extract_TypeColumn_OverridesAutoDetectedType()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount", "type" },
                    new[] { "01/06/2026", "Transfer", "500", "transfer" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal("transfer", result.Transactions[0].TransactionType);
        }

        [Fact]
        public void Extract_NoDescription_DefaultsToNoDescription()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "", "100" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Equal("No description", result.Transactions[0].Description);
        }

        [Fact]
        public void Extract_InvalidDate_SkipsRow()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "not-a-date", "Purchase", "100" },
                    new[] { "01/06/2026", "Valid", "200" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Single(result.Transactions);
            Assert.Equal(1, result.TotalSkipped);
        }

        [Fact]
        public void Extract_NullAmountColumn_ParsesNone()
        {
            var stream = MakeExcel(wb =>
            {
                AddSheet(wb, "Sheet1", new[] { "date", "description", "amount" },
                    new[] { "01/06/2026", "Null amount", "" });
            });

            var result = _service.Extract(stream, "test.xlsx");

            Assert.Empty(result.Transactions);
            Assert.Equal(1, result.TotalSkipped);
        }
    }
}
