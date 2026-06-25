using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        public long CreateUploadJob(CreateUploadJobRequest request)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                const string sql = @"
INSERT INTO dbo.FP26_upload_jobs
(
    job_type,
    status,
    file_path,
    file_original_name,
    file_type,
    file_size,
    company_id,
    user_id,
    bank_account_id,
    payload_json,
    progress_percent,
    created_at,
    updated_at
)
VALUES
(
    @JobType,
    @Status,
    @FilePath,
    @FileOriginalName,
    @FileType,
    @FileSize,
    @CompanyId,
    @UserId,
    @BankAccountId,
    @PayloadJson,
    0,
    GETDATE(),
    GETDATE()
);
SELECT SCOPE_IDENTITY();";

                using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@JobType", request.JobType);
                cmd.Parameters.AddWithValue("@Status", UploadJobStatuses.Queued);
                cmd.Parameters.AddWithValue("@FilePath", request.FilePath);
                cmd.Parameters.AddWithValue("@FileOriginalName", (object?)request.FileOriginalName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FileType", (object?)request.FileType ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FileSize", (object?)request.FileSize ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@CompanyId", request.CompanyId);
                cmd.Parameters.AddWithValue("@UserId", request.UserId);
                cmd.Parameters.AddWithValue("@BankAccountId", (object?)request.BankAccountId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PayloadJson", (object?)request.PayloadJson ?? DBNull.Value);

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally
            {
                con?.Close();
            }
        }

        public bool SetUploadJobHangfireId(long jobId, string? hangfireJobId)
        {
            return UpdateUploadJobSimple(
                @"UPDATE dbo.FP26_upload_jobs
                  SET hangfire_job_id = @HangfireJobId,
                      updated_at = GETDATE()
                  WHERE id = @Id",
                new Dictionary<string, object?>
                {
                    { "@Id", jobId },
                    { "@HangfireJobId", (object?)hangfireJobId ?? DBNull.Value }
                });
        }

        public bool MarkUploadJobProcessing(long jobId)
        {
            return UpdateUploadJobSimple(
                @"UPDATE dbo.FP26_upload_jobs
                  SET status = @Status,
                      progress_percent = CASE WHEN progress_percent < 5 THEN 5 ELSE progress_percent END,
                      error_message = NULL,
                      updated_at = GETDATE()
                  WHERE id = @Id",
                new Dictionary<string, object?>
                {
                    { "@Id", jobId },
                    { "@Status", UploadJobStatuses.Processing }
                });
        }

        public bool MarkUploadJobCompleted(long jobId, string? resultJson)
        {
            return UpdateUploadJobSimple(
                @"UPDATE dbo.FP26_upload_jobs
                  SET status = @Status,
                      progress_percent = 100,
                      result_json = @ResultJson,
                      error_message = NULL,
                      completed_at = GETDATE(),
                      updated_at = GETDATE()
                  WHERE id = @Id",
                new Dictionary<string, object?>
                {
                    { "@Id", jobId },
                    { "@Status", UploadJobStatuses.Completed },
                    { "@ResultJson", (object?)resultJson ?? DBNull.Value }
                });
        }

        public bool MarkUploadJobVerified(long jobId)
        {
            return UpdateUploadJobSimple(
                @"UPDATE dbo.FP26_upload_jobs
                  SET status = @Status,
                      completed_at = COALESCE(completed_at, GETDATE()),
                      updated_at = GETDATE()
                  WHERE id = @Id",
                new Dictionary<string, object?>
                {
                    { "@Id", jobId },
                    { "@Status", UploadJobStatuses.Verified }
                });
        }

        public bool MarkUploadJobFailed(long jobId, string errorMessage)
        {
            return UpdateUploadJobSimple(
                @"UPDATE dbo.FP26_upload_jobs
                  SET status = @Status,
                      error_message = @ErrorMessage,
                      updated_at = GETDATE()
                  WHERE id = @Id",
                new Dictionary<string, object?>
                {
                    { "@Id", jobId },
                    { "@Status", UploadJobStatuses.Failed },
                    { "@ErrorMessage", errorMessage }
                });
        }

        public bool UpdateUploadJobProgress(long jobId, int progressPercent, string? resultJson = null)
        {
            var boundedProgress = Math.Clamp(progressPercent, 0, 100);
            return UpdateUploadJobSimple(
                @"UPDATE dbo.FP26_upload_jobs
                  SET progress_percent = @ProgressPercent,
                      result_json = COALESCE(@ResultJson, result_json),
                      updated_at = GETDATE()
                  WHERE id = @Id",
                new Dictionary<string, object?>
                {
                    { "@Id", jobId },
                    { "@ProgressPercent", boundedProgress },
                    { "@ResultJson", (object?)resultJson ?? DBNull.Value }
                });
        }

        public UploadJobRow? GetUploadJobById(long jobId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                const string sql = @"
SELECT
    id,
    job_type,
    status,
    file_path,
    file_original_name,
    file_type,
    file_size,
    company_id,
    user_id,
    bank_account_id,
    payload_json,
    result_json,
    error_message,
    progress_percent,
    hangfire_job_id,
    created_at,
    updated_at,
    completed_at
FROM dbo.FP26_upload_jobs
WHERE id = @Id";

                using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Id", jobId);
                reader = cmd.ExecuteReader();

                return reader.Read() ? MapUploadJob(reader) : null;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public List<UploadJobRow> GetUploadJobsByUser(long userId, long? companyId = null, string? status = null, int take = 50)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<UploadJobRow>();
            try
            {
                con = Connect();
                const string sql = @"
SELECT TOP (@Take)
    id,
    job_type,
    status,
    file_path,
    file_original_name,
    file_type,
    file_size,
    company_id,
    user_id,
    bank_account_id,
    payload_json,
    result_json,
    error_message,
    progress_percent,
    hangfire_job_id,
    created_at,
    updated_at,
    completed_at
FROM dbo.FP26_upload_jobs
WHERE (@UserId IS NULL OR user_id = @UserId)
  AND (@CompanyId IS NULL OR company_id = @CompanyId)
  AND (@Status IS NULL OR status = @Status)
ORDER BY created_at DESC";

                using var cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Take", Math.Clamp(take, 1, 200));
                cmd.Parameters.AddWithValue("@UserId", userId <= 0 ? (object?)DBNull.Value : userId);
                cmd.Parameters.AddWithValue("@CompanyId", (object?)companyId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Status", string.IsNullOrWhiteSpace(status) ? DBNull.Value : status);

                reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    rows.Add(MapUploadJob(reader));
                }

                return rows;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        private static UploadJobRow MapUploadJob(SqlDataReader r) => new()
        {
            Id = Convert.ToInt64(r["id"]),
            JobType = r["job_type"]?.ToString() ?? string.Empty,
            Status = r["status"]?.ToString() ?? UploadJobStatuses.Queued,
            FilePath = r["file_path"]?.ToString() ?? string.Empty,
            FileOriginalName = r["file_original_name"] == DBNull.Value ? null : r["file_original_name"].ToString(),
            FileType = r["file_type"] == DBNull.Value ? null : r["file_type"].ToString(),
            FileSize = r["file_size"] == DBNull.Value ? null : Convert.ToInt64(r["file_size"]),
            CompanyId = Convert.ToInt64(r["company_id"]),
            UserId = Convert.ToInt64(r["user_id"]),
            BankAccountId = r["bank_account_id"] == DBNull.Value ? null : Convert.ToInt64(r["bank_account_id"]),
            PayloadJson = r["payload_json"] == DBNull.Value ? null : r["payload_json"].ToString(),
            ResultJson = r["result_json"] == DBNull.Value ? null : r["result_json"].ToString(),
            ErrorMessage = r["error_message"] == DBNull.Value ? null : r["error_message"].ToString(),
            ProgressPercent = r["progress_percent"] == DBNull.Value ? 0 : Convert.ToInt32(r["progress_percent"]),
            HangfireJobId = r["hangfire_job_id"] == DBNull.Value ? null : r["hangfire_job_id"].ToString(),
            CreatedAt = Convert.ToDateTime(r["created_at"]),
            UpdatedAt = Convert.ToDateTime(r["updated_at"]),
            CompletedAt = r["completed_at"] == DBNull.Value ? null : Convert.ToDateTime(r["completed_at"])
        };

        public bool DeleteUploadJob(long jobId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(
                    "DELETE FROM dbo.FP26_upload_jobs WHERE id = @Id",
                    con);
                cmd.Parameters.AddWithValue("@Id", jobId);
                return cmd.ExecuteNonQuery() > 0;
            }
            finally
            {
                con?.Close();
            }
        }

        private bool UpdateUploadJobSimple(string sql, Dictionary<string, object?> parameters)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                using var cmd = new SqlCommand(sql, con)
                {
                    CommandType = CommandType.Text,
                    CommandTimeout = 10
                };

                foreach (var kvp in parameters)
                {
                    cmd.Parameters.AddWithValue(kvp.Key, kvp.Value ?? DBNull.Value);
                }

                return cmd.ExecuteNonQuery() > 0;
            }
            finally
            {
                con?.Close();
            }
        }
    }
}
