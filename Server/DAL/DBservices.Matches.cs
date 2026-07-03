using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Matches ───────────────────────────────────────────────────────────

        public List<MatchRow> GetMatchesByCompany(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<MatchRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_GetByCompany", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapMatch(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public MatchRow? GetMatchById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                return reader.Read() ? MapMatch(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public long CreateMatch(
            long invoiceId, long transactionId, decimal matchedAmount,
            string matchMethod, long? matchedByUserId,
            string matchType, decimal? matchConfidence, string? matchReason,
            int? installmentNumber = null, string? installmentNote = null)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@InvoiceId",       invoiceId       },
                        { "@TransactionId",   transactionId   },
                        { "@MatchedAmount",   matchedAmount   },
                        { "@MatchMethod",     matchMethod     },
                        { "@MatchedByUserId", matchedByUserId },
                        { "@MatchType",       matchType       },
                        { "@MatchConfidence", matchConfidence },
                        { "@MatchReason",     matchReason     },
                        { "@InstallmentNumber", installmentNumber },
                        { "@InstallmentNote",   installmentNote   }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public bool DeleteMatch(long id)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_Delete", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public List<MatchSuggestionRow> GetMatchSuggestionsForInvoice(long invoiceId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<MatchSuggestionRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_GetSuggestionsForInvoice", con,
                    new Dictionary<string, object?> { { "@InvoiceId", invoiceId } });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new MatchSuggestionRow
                    {
                        Id               = Convert.ToInt64(reader["id"]),
                        TransactionDate  = Convert.ToDateTime(reader["transaction_date"]),
                        Description      = reader["description"]?.ToString()!,
                        Amount           = Convert.ToDecimal(reader["amount"]),
                        TransactionType  = reader["transaction_type"]?.ToString()!,
                        ReferenceNumber  = reader["reference_number"] as string,
                        AmountDifference = Convert.ToDecimal(reader["amount_difference"]),
                        MatchScore       = Convert.ToDecimal(reader["match_score"]),
                        DaysDifference   = Convert.ToInt32(reader["days_difference"])
                    });
                }
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public List<MatchRow> GetMatchesByInvoice(long invoiceId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var list = new List<MatchRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_GetByInvoice", con,
                    new Dictionary<string, object?> { { "@InvoiceId", invoiceId } });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapMatch(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static MatchRow MapMatch(SqlDataReader r) => new()
        {
            Id                     = Convert.ToInt64(r["id"]),
            InvoiceId              = Convert.ToInt64(r["invoice_id"]),
            InvoiceNumber          = r.HasColumn("invoice_number")           ? r["invoice_number"]           as string  : null,
            VendorName             = r.HasColumn("vendor_name")              ? r["vendor_name"]               as string  : null,
            InvoiceAmount          = r.HasColumn("invoice_amount")           && r["invoice_amount"]           != DBNull.Value ? Convert.ToDecimal(r["invoice_amount"])  : null,
            TransactionId          = Convert.ToInt64(r["transaction_id"]),
            TransactionVendorName  = r.HasColumn("transaction_vendor_name")  ? r["transaction_vendor_name"]   as string  : null,
            TransactionDescription = r.HasColumn("transaction_description")  ? r["transaction_description"]   as string  : null,
            TransactionDate        = r.HasColumn("transaction_date")         && r["transaction_date"]         != DBNull.Value ? Convert.ToDateTime(r["transaction_date"]) : null,
            TransactionAmount      = r.HasColumn("transaction_amount")       && r["transaction_amount"]       != DBNull.Value ? Convert.ToDecimal(r["transaction_amount"]) : null,
            TransactionType        = r.HasColumn("transaction_type")         ? r["transaction_type"]          as string  : null,
            MatchType              = r["match_type"]?.ToString() ?? "full",
            MatchedAmount          = Convert.ToDecimal(r["matched_amount"]),
            MatchMethod            = r["match_method"]?.ToString()!,
            MatchConfidence        = r["match_confidence"]  != DBNull.Value ? Convert.ToDecimal(r["match_confidence"]) : null,
            MatchReason            = r["match_reason"]      as string,
            MatchedByUserId        = r["matched_by_user_id"] != DBNull.Value ? Convert.ToInt64(r["matched_by_user_id"]) : null,
            MatchedByName          = r.HasColumn("matched_by_name") ? r["matched_by_name"] as string : null,
            InstallmentNumber      = r.HasColumn("installment_number") && r["installment_number"] != DBNull.Value ? Convert.ToInt32(r["installment_number"]) : null,
            InstallmentNote        = r.HasColumn("installment_note") ? r["installment_note"] as string : null,
            CreatedAt              = Convert.ToDateTime(r["created_at"]),
            UpdatedAt              = r.HasColumn("updated_at") && r["updated_at"] != DBNull.Value
                                        ? Convert.ToDateTime(r["updated_at"]) : DateTime.MinValue,
        };

        // ── Candidate transactions for C# scoring ────────────────────────────

        public List<TransactionCandidate> GetCandidateTransactions(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<TransactionCandidate>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Matches_GetCandidates", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new TransactionCandidate
                    {
                        Id              = Convert.ToInt64(reader["id"]),
                        TransactionDate = Convert.ToDateTime(reader["transaction_date"]),
                        PostedDate      = reader["posted_date"] != DBNull.Value ? Convert.ToDateTime(reader["posted_date"]) : null,
                        Description     = reader["description"]?.ToString() ?? string.Empty,
                        Amount          = Convert.ToDecimal(reader["amount"]),
                        ChargeAmount    = reader["charge_amount"] != DBNull.Value ? Convert.ToDecimal(reader["charge_amount"]) : null,
                        TransactionType = reader["transaction_type"]?.ToString() ?? string.Empty,
                        ReferenceNumber = reader["reference_number"] as string,
                        VendorName      = reader["vendor_name"] as string
                    });
                }
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        // ── Vendor aliases ────────────────────────────────────────────────────

        public List<VendorAlias> GetVendorAliases(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<VendorAlias>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_VendorAliases_GetByCompany", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new VendorAlias
                    {
                        Id                 = Convert.ToInt64(reader["id"]),
                        CompanyId          = Convert.ToInt64(reader["company_id"]),
                        VendorName         = reader["vendor_name"]?.ToString() ?? string.Empty,
                        TransactionPattern = reader["transaction_pattern"]?.ToString() ?? string.Empty,
                        ConfirmationCount  = Convert.ToInt32(reader["confirmation_count"]),
                        RejectionCount     = Convert.ToInt32(reader["rejection_count"]),
                        IsActive           = Convert.ToBoolean(reader["is_active"]),
                        CreatedAt          = Convert.ToDateTime(reader["created_at"])
                    });
                }
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public void RecordVendorAlias(long companyId, string vendorName, string transactionDescription)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var pattern = StripTransactionBoilerplate(transactionDescription);
                if (string.IsNullOrWhiteSpace(pattern)) return;

                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_VendorAliases_Upsert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@VendorName", vendorName },
                        { "@Pattern", pattern }
                    });
                cmd.ExecuteNonQuery();
            }
            finally { con?.Close(); }
        }

        public void RejectVendorAlias(long companyId, string vendorName, string transactionDescription)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var pattern = StripTransactionBoilerplate(transactionDescription);
                if (string.IsNullOrWhiteSpace(pattern)) return;

                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_VendorAliases_Reject", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@VendorName", vendorName },
                        { "@Pattern", pattern }
                    });
                cmd.ExecuteNonQuery();
            }
            finally { con?.Close(); }
        }

        private static string StripTransactionBoilerplate(string description)
        {
            if (string.IsNullOrWhiteSpace(description)) return string.Empty;
            var stripped = description.Trim();
            // Remove common prefixes in English & Hebrew
            string[] prefixes = {
                "payment to ", "bank transfer - ", "transfer to ", "payment - ",
                "customer payment - ", "wire transfer - ", "direct debit - ",
                "העברה ל-", "העברה ל", "תשלום עבור ", "תשלום ל-", "תשלום ל",
                "העברת כספים - ", "חיוב - "
            };
            foreach (var p in prefixes)
            {
                if (stripped.StartsWith(p, StringComparison.OrdinalIgnoreCase))
                {
                    stripped = stripped[p.Length..].Trim();
                    break;
                }
            }
            return stripped;
        }
    }
}
