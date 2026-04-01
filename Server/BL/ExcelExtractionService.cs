using ClosedXML.Excel;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using System.Globalization;

namespace FinalProjectAuthAPI.BL
{
    public class ExcelExtractionService : IExcelExtractionService
    {
        // ── Known header patterns (English + Hebrew) ─────────────────────

        private static readonly string[] DateHeaders =
            { "date", "transaction date", "value date", "תאריך", "תאריך עסקה", "תאריך ערך" };

        private static readonly string[] PostedDateHeaders =
            { "posted date", "posting date", "תאריך רישום" };

        private static readonly string[] DescriptionHeaders =
            { "description", "details", "memo", "particulars", "narrative", "תיאור", "פרטים", "הערות" };

        private static readonly string[] AmountHeaders =
            { "amount", "sum", "total", "סכום", "סה\"כ" };

        private static readonly string[] DebitHeaders =
            { "debit", "withdrawal", "חובה", "משיכה" };

        private static readonly string[] CreditHeaders =
            { "credit", "deposit", "זכות", "הפקדה" };

        private static readonly string[] BalanceHeaders =
            { "balance", "balance after", "running balance", "יתרה" };

        private static readonly string[] ReferenceHeaders =
            { "reference", "ref", "reference number", "check number", "אסמכתא", "מספר אסמכתא" };

        private static readonly string[] TypeHeaders =
            { "type", "transaction type", "סוג", "סוג עסקה" };

        private static readonly string[] CategoryHeaders =
            { "category", "קטגוריה" };

        private static readonly string[] VendorNameHeaders =
            { "vendor name", "vendor", "supplier", "supplier name", "business name",
              "שם בית העסק", "שם בית עסק", "שם ספק", "שם עסק", "בית עסק" };

        public ExcelExtractionResult Extract(Stream excelStream, string fileName)
        {
            var result = new ExcelExtractionResult { FileName = fileName };

            using var workbook = new XLWorkbook(excelStream);

            foreach (var worksheet in workbook.Worksheets)
            {
                var sheetResult = ProcessSheet(worksheet);
                result.Sheets.Add(sheetResult.SheetInfo);
                result.Transactions.AddRange(sheetResult.Transactions);
            }

            result.TotalExtracted = result.Transactions.Count;
            result.TotalSkipped = result.Sheets.Sum(s => s.RowsSkipped);
            return result;
        }

        // ─────────────────────────────────────────────────────────────────

        private (SheetResult SheetInfo, List<ExtractedTransaction> Transactions) ProcessSheet(IXLWorksheet sheet)
        {
            var sheetInfo = new SheetResult { SheetName = sheet.Name };
            var transactions = new List<ExtractedTransaction>();

            var usedRange = sheet.RangeUsed();
            if (usedRange == null)
            {
                sheetInfo.Errors.Add("Sheet is empty.");
                return (sheetInfo, transactions);
            }

            // Find header row (first row that has >= 2 recognizable headers)
            int headerRowNumber = -1;
            var columnMap = new Dictionary<string, int>(); // role -> column number

            int firstRow = usedRange.FirstRow().RowNumber();
            int lastRow = usedRange.LastRow().RowNumber();
            int firstCol = usedRange.FirstColumn().ColumnNumber();
            int lastCol = usedRange.LastColumn().ColumnNumber();

            for (int r = firstRow; r <= Math.Min(firstRow + 10, lastRow); r++)
            {
                var candidate = DetectHeaders(sheet, r, firstCol, lastCol);
                if (candidate.Count >= 2 && candidate.ContainsKey("date"))
                {
                    headerRowNumber = r;
                    columnMap = candidate;
                    break;
                }
            }

            if (headerRowNumber < 0)
            {
                sheetInfo.Errors.Add("Could not detect a header row with recognizable column names.");
                return (sheetInfo, transactions);
            }

            // Require at least a date column and either amount or debit/credit columns
            bool hasAmount = columnMap.ContainsKey("amount") ||
                             (columnMap.ContainsKey("debit") || columnMap.ContainsKey("credit"));
            if (!hasAmount)
            {
                sheetInfo.Errors.Add("No amount, debit, or credit column found.");
                return (sheetInfo, transactions);
            }

            // Parse data rows
            for (int r = headerRowNumber + 1; r <= lastRow; r++)
            {
                try
                {
                    var txn = ParseRow(sheet, r, columnMap);
                    if (txn != null)
                    {
                        txn.SheetName = sheet.Name;
                        txn.RowNumber = r;
                        transactions.Add(txn);
                        sheetInfo.RowsExtracted++;
                    }
                    else
                    {
                        sheetInfo.RowsSkipped++;
                    }
                }
                catch (Exception ex)
                {
                    sheetInfo.RowsSkipped++;
                    sheetInfo.Errors.Add($"Row {r}: {ex.Message}");
                }
            }

            return (sheetInfo, transactions);
        }

        private Dictionary<string, int> DetectHeaders(IXLWorksheet sheet, int row, int firstCol, int lastCol)
        {
            var map = new Dictionary<string, int>();

            for (int c = firstCol; c <= lastCol; c++)
            {
                var cell = sheet.Cell(row, c);
                var text = cell.GetString().Trim();
                if (string.IsNullOrWhiteSpace(text)) continue;

                var lower = text.ToLowerInvariant();

                if (MatchesAny(lower, DateHeaders) && !map.ContainsKey("date"))
                    map["date"] = c;
                else if (MatchesAny(lower, PostedDateHeaders) && !map.ContainsKey("postedDate"))
                    map["postedDate"] = c;
                else if (MatchesAny(lower, DescriptionHeaders) && !map.ContainsKey("description"))
                    map["description"] = c;
                else if (MatchesAny(lower, AmountHeaders) && !map.ContainsKey("amount"))
                    map["amount"] = c;
                else if (MatchesAny(lower, DebitHeaders) && !map.ContainsKey("debit"))
                    map["debit"] = c;
                else if (MatchesAny(lower, CreditHeaders) && !map.ContainsKey("credit"))
                    map["credit"] = c;
                else if (MatchesAny(lower, BalanceHeaders) && !map.ContainsKey("balance"))
                    map["balance"] = c;
                else if (MatchesAny(lower, ReferenceHeaders) && !map.ContainsKey("reference"))
                    map["reference"] = c;
                else if (MatchesAny(lower, TypeHeaders) && !map.ContainsKey("type"))
                    map["type"] = c;
                else if (MatchesAny(lower, CategoryHeaders) && !map.ContainsKey("category"))
                    map["category"] = c;
                else if (MatchesAny(lower, VendorNameHeaders) && !map.ContainsKey("vendorName"))
                    map["vendorName"] = c;
            }

            return map;
        }

        private static bool MatchesAny(string value, string[] patterns) =>
            patterns.Any(p => value == p || value.Contains(p));

        // ── Row Parsing ──────────────────────────────────────────────────

        private ExtractedTransaction? ParseRow(IXLWorksheet sheet, int row, Dictionary<string, int> map)
        {
            // Skip entirely empty rows
            bool allEmpty = true;
            foreach (var col in map.Values)
            {
                if (!sheet.Cell(row, col).IsEmpty()) { allEmpty = false; break; }
            }
            if (allEmpty) return null;

            // 1. Date (required)
            var date = ParseDate(sheet.Cell(row, map["date"]));
            if (date == null) return null;

            // 2. Amount (required) – from single "amount" column or merged debit/credit
            decimal? amount = null;
            string transactionType = "debit";

            if (map.ContainsKey("amount"))
            {
                amount = ParseDecimal(sheet.Cell(row, map["amount"]));
                if (amount.HasValue)
                    transactionType = amount.Value >= 0 ? "credit" : "debit";
            }
            else
            {
                // Split debit / credit columns
                decimal? debitVal = map.ContainsKey("debit") ? ParseDecimal(sheet.Cell(row, map["debit"])) : null;
                decimal? creditVal = map.ContainsKey("credit") ? ParseDecimal(sheet.Cell(row, map["credit"])) : null;

                if (debitVal.HasValue && debitVal.Value != 0)
                {
                    amount = -Math.Abs(debitVal.Value);
                    transactionType = "debit";
                }
                else if (creditVal.HasValue && creditVal.Value != 0)
                {
                    amount = Math.Abs(creditVal.Value);
                    transactionType = "credit";
                }
            }

            if (amount == null || amount.Value == 0) return null;

            // 3. Description
            string description = map.ContainsKey("description")
                ? sheet.Cell(row, map["description"]).GetString().Trim()
                : string.Empty;

            // 4. Optional fields
            DateTime? postedDate = map.ContainsKey("postedDate")
                ? ParseDate(sheet.Cell(row, map["postedDate"]))
                : null;

            decimal? balanceAfter = map.ContainsKey("balance")
                ? ParseDecimal(sheet.Cell(row, map["balance"]))
                : null;

            string? reference = map.ContainsKey("reference")
                ? NullIfEmpty(sheet.Cell(row, map["reference"]).GetString().Trim())
                : null;

            string? category = map.ContainsKey("category")
                ? NullIfEmpty(sheet.Cell(row, map["category"]).GetString().Trim())
                : null;

            string? vendorName = map.ContainsKey("vendorName")
                ? NullIfEmpty(sheet.Cell(row, map["vendorName"]).GetString().Trim())
                : null;

            // Type column overrides auto-detected type
            if (map.ContainsKey("type"))
            {
                var typeVal = sheet.Cell(row, map["type"]).GetString().Trim();
                if (!string.IsNullOrWhiteSpace(typeVal))
                    transactionType = typeVal.ToLowerInvariant();
            }

            return new ExtractedTransaction
            {
                TransactionDate = date.Value,
                PostedDate = postedDate,
                Description = string.IsNullOrWhiteSpace(description) ? "No description" : description,
                Amount = amount.Value,
                BalanceAfter = balanceAfter,
                TransactionType = transactionType,
                Category = category,
                ReferenceNumber = reference,
                VendorName = vendorName
            };
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private static DateTime? ParseDate(IXLCell cell)
        {
            if (cell.IsEmpty()) return null;

            // If the cell is already typed as DateTime in Excel
            if (cell.DataType == XLDataType.DateTime)
                return cell.GetDateTime();

            var text = cell.GetString().Trim();
            if (string.IsNullOrWhiteSpace(text)) return null;

            // Try common date formats
            string[] formats =
            {
                "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d-M-yyyy",
                "MM/dd/yyyy", "M/d/yyyy",
                "yyyy-MM-dd", "yyyy/MM/dd",
                "dd.MM.yyyy", "d.M.yyyy",
                "dd/MM/yy", "d/M/yy",
                "MM/dd/yy", "M/d/yy"
            };

            if (DateTime.TryParseExact(text, formats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var parsed))
                return parsed;

            // Fallback: let .NET guess
            if (DateTime.TryParse(text, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var fallback))
                return fallback;

            return null;
        }

        private static decimal? ParseDecimal(IXLCell cell)
        {
            if (cell.IsEmpty()) return null;

            if (cell.DataType == XLDataType.Number)
                return (decimal)cell.GetDouble();

            var text = cell.GetString().Trim();
            if (string.IsNullOrWhiteSpace(text)) return null;

            // Strip common currency symbols and thousands separators
            text = text.Replace("₪", "").Replace("$", "").Replace("€", "").Replace("£", "")
                       .Replace(",", "").Replace(" ", "").Trim();

            // Handle parentheses as negative: (123.45) => -123.45
            if (text.StartsWith("(") && text.EndsWith(")"))
            {
                text = "-" + text.Trim('(', ')');
            }

            return decimal.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out var val)
                ? val
                : null;
        }

        private static string? NullIfEmpty(string? s) =>
            string.IsNullOrWhiteSpace(s) ? null : s;
    }
}
