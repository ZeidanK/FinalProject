using System.Data;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.DAL
{
    // ── Match row ─────────────────────────────────────────────────────────────
    public class MatchRow
    {
        public long     Id                          { get; set; }
        public long     InvoiceId                   { get; set; }
        public string?  InvoiceNumber               { get; set; }
        public string?  VendorName                  { get; set; }
        public decimal? InvoiceAmount               { get; set; }
        public long     TransactionId               { get; set; }
        public string?  TransactionDescription      { get; set; }
        public DateTime? TransactionDate            { get; set; }
        public decimal? TransactionAmount           { get; set; }
        public string?  TransactionType             { get; set; }
        public string   MatchType                   { get; set; } = "full";
        public decimal  MatchedAmount               { get; set; }
        public string   MatchMethod                 { get; set; } = string.Empty;
        public decimal? MatchConfidence             { get; set; }
        public string?  MatchReason                 { get; set; }
        public long?    MatchedByUserId             { get; set; }
        public string?  MatchedByName               { get; set; }
        public DateTime CreatedAt                   { get; set; }
        public DateTime UpdatedAt                   { get; set; }
    }

    public class MatchSuggestionRow
    {
        public long     Id               { get; set; }
        public DateTime TransactionDate  { get; set; }
        public string   Description      { get; set; } = string.Empty;
        public decimal  Amount           { get; set; }
        public string   TransactionType  { get; set; } = string.Empty;
        public string?  ReferenceNumber  { get; set; }
        public decimal  AmountDifference { get; set; }
    }

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
            string matchType, decimal? matchConfidence, string? matchReason)
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
                        { "@MatchReason",     matchReason     }
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
                    });
                }
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
            CreatedAt              = Convert.ToDateTime(r["created_at"]),
            UpdatedAt              = r.HasColumn("updated_at") && r["updated_at"] != DBNull.Value
                                        ? Convert.ToDateTime(r["updated_at"]) : DateTime.MinValue,
        };
    }
}
