using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        public virtual DashboardStatsRow GetDashboardStats(long companyId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var stats = new DashboardStatsRow();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Reports_GetDashboardStats", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    stats.TotalInvoices = Convert.ToInt32(reader["total_invoices"]);
                    stats.MatchedInvoices = Convert.ToInt32(reader["matched_invoices"]);
                    stats.UnmatchedInvoices = Convert.ToInt32(reader["unmatched_invoices"]);
                    stats.UploadedInvoices = Convert.ToInt32(reader["uploaded_invoices"]);
                    stats.ProcessingInvoices = Convert.ToInt32(reader["processing_invoices"]);
                    stats.TotalInvoiceAmount = Convert.ToDecimal(reader["total_invoice_amount"]);
                    stats.AvgInvoiceAmount = Convert.ToDecimal(reader["avg_invoice_amount"]);
                }

                if (reader.NextResult() && reader.Read())
                {
                    stats.TotalTransactions = Convert.ToInt32(reader["total_transactions"]);
                    stats.MatchedTransactions = Convert.ToInt32(reader["matched_transactions"]);
                    stats.UnmatchedTransactions = Convert.ToInt32(reader["unmatched_transactions"]);
                    stats.TotalTransactionVolume = Convert.ToDecimal(reader["total_transaction_volume"]);
                    stats.TotalDebits = Convert.ToDecimal(reader["total_debits"]);
                    stats.TotalCredits = Convert.ToDecimal(reader["total_credits"]);
                }

                if (reader.NextResult() && reader.Read())
                {
                    stats.TotalAnomalies = Convert.ToInt32(reader["total_anomalies"]);
                    stats.OpenAnomalies = Convert.ToInt32(reader["open_anomalies"]);
                    stats.CriticalAnomalies = Convert.ToInt32(reader["critical_anomalies"]);
                    stats.ResolvedAnomalies = Convert.ToInt32(reader["resolved_anomalies"]);
                }

                if (reader.NextResult() && reader.Read())
                {
                    stats.TotalMatches = Convert.ToInt32(reader["total_matches"]);
                    stats.TotalMatchedAmount = Convert.ToDecimal(reader["total_matched_amount"]);
                }

                return stats;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public virtual ReconciliationReport GetReconciliationReport(
            long companyId, DateTime? startDate, DateTime? endDate)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var report = new ReconciliationReport
            {
                StartDate = startDate?.Date,
                EndDate = endDate?.Date
            };

            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Reports_GetReconciliationReport", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@StartDate", startDate?.Date },
                        { "@EndDate", endDate?.Date }
                    });

                reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    report.StartDate = reader["start_date"] != DBNull.Value
                        ? Convert.ToDateTime(reader["start_date"])
                        : null;
                    report.EndDate = reader["end_date"] != DBNull.Value
                        ? Convert.ToDateTime(reader["end_date"])
                        : null;
                    report.CompanyCurrency = reader["company_currency"]?.ToString() ?? "USD";
                    report.Summary = new ReconciliationSummary
                    {
                        LedgerEntryCount = Convert.ToInt32(reader["ledger_entry_count"]),
                        BankTransactionCount = Convert.ToInt32(reader["bank_transaction_count"]),
                        FullyMatchedLedgerCount = Convert.ToInt32(reader["fully_matched_ledger_count"]),
                        PartiallyMatchedLedgerCount = Convert.ToInt32(reader["partially_matched_ledger_count"]),
                        UnmatchedLedgerCount = Convert.ToInt32(reader["unmatched_ledger_count"]),
                        MatchedBankTransactionCount = Convert.ToInt32(reader["matched_bank_transaction_count"]),
                        UnmatchedBankTransactionCount = Convert.ToInt32(reader["unmatched_bank_transaction_count"])
                    };
                }

                if (reader.NextResult())
                {
                    while (reader.Read())
                    {
                        report.Rows.Add(new ReconciliationRow
                        {
                            ReconciliationStatus = reader["reconciliation_status"]?.ToString() ?? string.Empty,
                            InvoiceId = reader["invoice_id"] != DBNull.Value ? Convert.ToInt64(reader["invoice_id"]) : null,
                            InvoiceNumber = reader["invoice_number"] as string,
                            VendorName = reader["vendor_name"] as string,
                            InvoiceDate = reader["invoice_date"] != DBNull.Value ? Convert.ToDateTime(reader["invoice_date"]) : null,
                            DueDate = reader["due_date"] != DBNull.Value ? Convert.ToDateTime(reader["due_date"]) : null,
                            InvoiceAmount = reader["invoice_amount"] != DBNull.Value ? Convert.ToDecimal(reader["invoice_amount"]) : null,
                            InvoiceCurrency = reader["invoice_currency"] as string,
                            InvoiceStatus = reader["invoice_status"] as string,
                            InvoiceMatchedAmount = reader["invoice_matched_amount"] != DBNull.Value ? Convert.ToDecimal(reader["invoice_matched_amount"]) : null,
                            OutstandingAmount = reader["outstanding_amount"] != DBNull.Value ? Convert.ToDecimal(reader["outstanding_amount"]) : null,
                            MatchId = reader["match_id"] != DBNull.Value ? Convert.ToInt64(reader["match_id"]) : null,
                            MatchedAmount = reader["matched_amount"] != DBNull.Value ? Convert.ToDecimal(reader["matched_amount"]) : null,
                            MatchMethod = reader["match_method"] as string,
                            MatchConfidence = reader["match_confidence"] != DBNull.Value ? Convert.ToDecimal(reader["match_confidence"]) : null,
                            TransactionId = reader["transaction_id"] != DBNull.Value ? Convert.ToInt64(reader["transaction_id"]) : null,
                            TransactionDate = reader["transaction_date"] != DBNull.Value ? Convert.ToDateTime(reader["transaction_date"]) : null,
                            TransactionDescription = reader["transaction_description"] as string,
                            TransactionAmount = reader["transaction_amount"] != DBNull.Value ? Convert.ToDecimal(reader["transaction_amount"]) : null,
                            TransactionCurrency = reader["transaction_currency"] as string,
                            OriginalTransactionAmount = reader["original_transaction_amount"] != DBNull.Value ? Convert.ToDecimal(reader["original_transaction_amount"]) : null,
                            OriginalTransactionCurrency = reader["original_transaction_currency"] as string,
                            TransactionType = reader["transaction_type"] as string
                        });
                    }
                }

                return report;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public virtual PayablesAgingReport GetPayablesAgingReport(long companyId, DateTime asOfDate)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var report = new PayablesAgingReport { AsOfDate = asOfDate.Date };

            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Reports_GetPayablesAging", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@AsOfDate", asOfDate.Date }
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    report.Rows.Add(new PayablesAgingRow
                    {
                        InvoiceId = Convert.ToInt64(reader["invoice_id"]),
                        InvoiceNumber = reader["invoice_number"]?.ToString() ?? string.Empty,
                        VendorName = reader["vendor_name"]?.ToString() ?? string.Empty,
                        InvoiceDate = Convert.ToDateTime(reader["invoice_date"]),
                        DueDate = reader["due_date"] != DBNull.Value ? Convert.ToDateTime(reader["due_date"]) : null,
                        EffectiveDueDate = Convert.ToDateTime(reader["effective_due_date"]),
                        DaysPastDue = Convert.ToInt32(reader["days_past_due"]),
                        BucketKey = reader["bucket_key"]?.ToString() ?? string.Empty,
                        BucketLabel = reader["bucket_label"]?.ToString() ?? string.Empty,
                        OriginalAmount = Convert.ToDecimal(reader["original_amount"]),
                        MatchedAmount = Convert.ToDecimal(reader["matched_amount"]),
                        OutstandingAmount = Convert.ToDecimal(reader["outstanding_amount"]),
                        Currency = reader["currency"]?.ToString() ?? "USD",
                        PaymentStatus = reader["payment_status"]?.ToString() ?? string.Empty
                    });
                }

                report.TotalInvoiceCount = report.Rows.Count;
                report.TotalsByCurrency = report.Rows
                    .GroupBy(row => row.Currency, StringComparer.OrdinalIgnoreCase)
                    .Select(group => new CurrencyAmount
                    {
                        Currency = group.Key.ToUpperInvariant(),
                        Amount = group.Sum(row => row.OutstandingAmount)
                    })
                    .OrderBy(total => total.Currency)
                    .ToList();

                var bucketDefinitions = new[]
                {
                    (Key: "current", Label: "Current"),
                    (Key: "1_30", Label: "1-30 days"),
                    (Key: "31_60", Label: "31-60 days"),
                    (Key: "61_90", Label: "61-90 days"),
                    (Key: "91_plus", Label: "91+ days")
                };

                report.Buckets = bucketDefinitions.Select(bucket =>
                {
                    var rows = report.Rows
                        .Where(row => string.Equals(row.BucketKey, bucket.Key, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    return new AgingBucketSummary
                    {
                        Key = bucket.Key,
                        Label = bucket.Label,
                        InvoiceCount = rows.Count,
                        AmountsByCurrency = rows
                            .GroupBy(row => row.Currency, StringComparer.OrdinalIgnoreCase)
                            .Select(group => new CurrencyAmount
                            {
                                Currency = group.Key.ToUpperInvariant(),
                                Amount = group.Sum(row => row.OutstandingAmount)
                            })
                            .OrderBy(total => total.Currency)
                            .ToList()
                    };
                }).ToList();

                return report;
            }
            finally { reader?.Close(); con?.Close(); }
        }
    }
}
