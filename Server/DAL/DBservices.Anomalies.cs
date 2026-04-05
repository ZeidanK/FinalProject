using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        // ── Anomalies ─────────────────────────────────────────────────────────

        public List<AnomalyRow> GetAnomaliesByCompany(
            long companyId, string? status, string? severity, string? type)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var list = new List<AnomalyRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetByCompany", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId", companyId },
                        { "@Status",    status    },
                        { "@Severity",  severity  },
                        { "@Type",      type      }
                    });

                reader = cmd.ExecuteReader();
                while (reader.Read())
                    list.Add(MapAnomaly(reader));
                return list;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public AnomalyRow? GetAnomalyById(long id)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetById", con,
                    new Dictionary<string, object?> { { "@Id", id } });

                reader = cmd.ExecuteReader();
                return reader.Read() ? MapAnomaly(reader) : null;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        public long CreateAnomaly(
            long companyId, string anomalyType, string title,
            string description, string severity, string? suggestedAction,
            long? relatedInvoiceId, long? relatedTransactionId,
            long? relatedMatchId, decimal? amount,
            string detectionMethod, decimal? detectionConfidence)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@CompanyId",             companyId            },
                        { "@AnomalyType",           anomalyType          },
                        { "@Title",                 title                },
                        { "@Description",           description          },
                        { "@Severity",              severity             },
                        { "@SuggestedAction",       suggestedAction      },
                        { "@RelatedInvoiceId",      relatedInvoiceId     },
                        { "@RelatedTransactionId",  relatedTransactionId },
                        { "@RelatedMatchId",        relatedMatchId       },
                        { "@Amount",                amount               },
                        { "@DetectionMethod",       detectionMethod      },
                        { "@DetectionConfidence",   detectionConfidence  }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public bool ResolveAnomaly(
            long id, long resolvedByUserId,
            string? resolutionNotes, string status)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_Resolve", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id",                id                },
                        { "@ResolvedByUserId",  resolvedByUserId  },
                        { "@ResolutionNotes",   resolutionNotes   },
                        { "@Status",            status            }
                    });

                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
            finally { con?.Close(); }
        }

        public AnomalyStatsRow GetAnomalyStats(long companyId)
        {
            SqlConnection? con    = null;
            SqlDataReader? reader = null;
            var stats = new AnomalyStatsRow();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_Anomalies_GetStats", con,
                    new Dictionary<string, object?> { { "@CompanyId", companyId } });

                reader = cmd.ExecuteReader();

                // First result set — by status
                while (reader.Read())
                    stats.ByStatus[reader["status"]?.ToString()!] = Convert.ToInt32(reader["count"]);

                // Second result set — by severity
                if (reader.NextResult())
                    while (reader.Read())
                        stats.BySeverity[reader["severity"]?.ToString()!] = Convert.ToInt32(reader["count"]);

                return stats;
            }
            finally { reader?.Close(); con?.Close(); }
        }

        // ── Mapping helper ────────────────────────────────────────────────────

        private static AnomalyRow MapAnomaly(SqlDataReader r) => new()
        {
            Id                   = Convert.ToInt64(r["id"]),
            CompanyId            = Convert.ToInt64(r["company_id"]),
            AnomalyType          = r["anomaly_type"]?.ToString()!,
            Title                = r["title"]?.ToString()!,
            Description          = r["description"]?.ToString()!,
            Severity             = r["severity"]?.ToString() ?? "warning",
            Status               = r["status"]?.ToString()   ?? "open",
            SuggestedAction      = r["suggested_action"]          as string,
            RelatedInvoiceId     = r["related_invoice_id"]     != DBNull.Value ? Convert.ToInt64(r["related_invoice_id"])     : null,
            RelatedTransactionId = r["related_transaction_id"] != DBNull.Value ? Convert.ToInt64(r["related_transaction_id"]) : null,
            RelatedMatchId       = r["related_match_id"]       != DBNull.Value ? Convert.ToInt64(r["related_match_id"])       : null,
            Amount               = r["amount"]                 != DBNull.Value ? Convert.ToDecimal(r["amount"])               : null,
            DetectionMethod      = r["detection_method"]?.ToString()   ?? "ai",
            DetectionConfidence  = r["detection_confidence"]   != DBNull.Value ? Convert.ToDecimal(r["detection_confidence"]) : null,
            ResolvedByUserId     = r["resolved_by_user_id"]    != DBNull.Value ? Convert.ToInt64(r["resolved_by_user_id"])    : null,
            ResolvedByName       = r.HasColumn("resolved_by_name") ? r["resolved_by_name"] as string : null,
            ResolutionNotes      = r["resolution_notes"]           as string,
            ResolvedAt           = r["resolved_at"]            != DBNull.Value ? Convert.ToDateTime(r["resolved_at"]) : null,
            CreatedAt            = Convert.ToDateTime(r["created_at"]),
            UpdatedAt            = Convert.ToDateTime(r["updated_at"]),
        };
    }
}
