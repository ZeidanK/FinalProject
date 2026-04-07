using ClosedXML.Excel;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using System.Globalization;

namespace FinalProjectAuthAPI.BL
{
    public class ExcelExtractionService : IExcelExtractionService
    {
        // ── Header role constants ────────────────────────────────────────
        private const string HeaderDate = "date";
        private const string HeaderPostedDate = "postedDate";
        private const string HeaderDescription = "description";
        private const string HeaderAmount = "amount";
        private const string HeaderDebit = "debit";
        private const string HeaderCredit = "credit";
        private const string HeaderBalance = "balance";
        private const string HeaderReference = "reference";
        private const string HeaderType = "type";
        private const string HeaderCategory = "category";
        private const string HeaderVendorName = "vendorName";

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
                if (candidate.Count >= 2 && candidate.ContainsKey(HeaderDate))
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
            bool hasAmount = columnMap.ContainsKey(HeaderAmount) ||
                             (columnMap.ContainsKey(HeaderDebit) || columnMap.ContainsKey(HeaderCredit));
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

        private static Dictionary<string, int> DetectHeaders(IXLWorksheet sheet, int row, int firstCol, int lastCol)
        {
            var map = new Dictionary<string, int>();

            for (int c = firstCol; c <= lastCol; c++)
            {
                var cell = sheet.Cell(row, c);
                var text = cell.GetString().Trim();
                if (string.IsNullOrWhiteSpace(text)) continue;

                var lower = text.ToLowerInvariant();
                TryAddHeaderMapping(map, lower, c);
            }

            return map;
        }

        private static void TryAddHeaderMapping(Dictionary<string, int> map, string lower, int columnNumber)
        {
            var headerMappings = new (string HeaderKey, string[] Headers)[]
            {
                (HeaderDate, DateHeaders),
                (HeaderPostedDate, PostedDateHeaders),
                (HeaderDescription, DescriptionHeaders),
                (HeaderAmount, AmountHeaders),
                (HeaderDebit, DebitHeaders),
                (HeaderCredit, CreditHeaders),
                (HeaderBalance, BalanceHeaders),
                (HeaderReference, ReferenceHeaders),
                (HeaderType, TypeHeaders),
                (HeaderCategory, CategoryHeaders),
                (HeaderVendorName, VendorNameHeaders)
            };

            foreach (var (headerKey, headers) in headerMappings)
            {
                if (!map.ContainsKey(headerKey) && MatchesAny(lower, headers))
                {
                    map[headerKey] = columnNumber;
                    break;
                }
            }
        }

        private static bool MatchesAny(string value, string[] patterns) =>
            patterns.Any(p => value == p || value.Contains(p));

        // ── Row Parsing ──────────────────────────────────────────────────

        private ExtractedTransaction? ParseRow(IXLWorksheet sheet, int row, Dictionary<string, int> map)
        {
            // Skip entirely empty rows
            if (map.Values.All(col => sheet.Cell(row, col).IsEmpty()))
                return null;

            // 1. Date (required)
            var date = ParseDate(sheet.Cell(row, map[HeaderDate]));
            if (date == null) return null;

            // 2. Amount (required) – from single "amount" column or merged debit/credit
            var (amount, transactionType) = ParseAmount(sheet, row, map);
            if (amount == null || amount.Value == 0) return null;

            // 3. Description
            string description = GetCellString(sheet, row, map, HeaderDescription, string.Empty);

            // 4. Optional fields
            DateTime? postedDate = GetCellDate(sheet, row, map, HeaderPostedDate);
            decimal? balanceAfter = GetCellDecimal(sheet, row, map, HeaderBalance);
            string? reference = GetCellNullableString(sheet, row, map, HeaderReference);
            string? category = GetCellNullableString(sheet, row, map, HeaderCategory);
            string? vendorName = GetCellNullableString(sheet, row, map, HeaderVendorName);

            // Type column overrides auto-detected type
            string finalTransactionType = GetTransactionType(sheet, row, map, transactionType);

            return new ExtractedTransaction
            {
                TransactionDate = date.Value,
                PostedDate = postedDate,
                Description = string.IsNullOrWhiteSpace(description) ? "No description" : description,
                Amount = amount.Value,
                BalanceAfter = balanceAfter,
                TransactionType = finalTransactionType,
                Category = category,
                ReferenceNumber = reference,
                VendorName = vendorName
            };
        }

        private static (decimal?, string) ParseAmount(IXLWorksheet sheet, int row, Dictionary<string, int> map)
        {
            string transactionType = "debit";

            if (map.ContainsKey(HeaderAmount))
            {
                decimal? amount = ParseDecimal(sheet.Cell(row, map[HeaderAmount]));
                if (amount.HasValue)
                    transactionType = amount.Value >= 0 ? HeaderCredit : HeaderDebit;
                return (amount, transactionType);
            }

            // Split debit / credit columns
            decimal? debitVal = map.ContainsKey(HeaderDebit) ? ParseDecimal(sheet.Cell(row, map[HeaderDebit])) : null;
            decimal? creditVal = map.ContainsKey(HeaderCredit) ? ParseDecimal(sheet.Cell(row, map[HeaderCredit])) : null;

            if (debitVal.HasValue && debitVal.Value != 0)
                return (-Math.Abs(debitVal.Value), HeaderDebit);

            if (creditVal.HasValue && creditVal.Value != 0)
                return (Math.Abs(creditVal.Value), HeaderCredit);

            return (null, transactionType);
        }

        private static string GetCellString(IXLWorksheet sheet, int row, Dictionary<string, int> map, string headerKey, string defaultValue)
        {
            return map.ContainsKey(headerKey)
                ? sheet.Cell(row, map[headerKey]).GetString().Trim()
                : defaultValue;
        }

        private static string? GetCellNullableString(IXLWorksheet sheet, int row, Dictionary<string, int> map, string headerKey)
        {
            return map.ContainsKey(headerKey)
                ? NullIfEmpty(sheet.Cell(row, map[headerKey]).GetString().Trim())
                : null;
        }

        private static DateTime? GetCellDate(IXLWorksheet sheet, int row, Dictionary<string, int> map, string headerKey)
        {
            return map.ContainsKey(headerKey)
                ? ParseDate(sheet.Cell(row, map[headerKey]))
                : null;
        }

        private static decimal? GetCellDecimal(IXLWorksheet sheet, int row, Dictionary<string, int> map, string headerKey)
        {
            return map.ContainsKey(headerKey)
                ? ParseDecimal(sheet.Cell(row, map[headerKey]))
                : null;
        }

        private static string GetTransactionType(IXLWorksheet sheet, int row, Dictionary<string, int> map, string defaultType)
        {
            if (map.ContainsKey(HeaderType))
            {
                var typeVal = sheet.Cell(row, map[HeaderType]).GetString().Trim();
                if (!string.IsNullOrWhiteSpace(typeVal))
                    return typeVal.ToLowerInvariant();
            }
            return defaultType;
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
            if (text.StartsWith('(') && text.EndsWith(')'))
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
