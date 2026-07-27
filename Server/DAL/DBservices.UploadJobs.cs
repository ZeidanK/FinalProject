using System.Data;
using System.Data.SqlClient;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public partial class DBservices
    {
        public virtual long CreateUploadJob(CreateUploadJobRequest request)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Insert", con,
                    new Dictionary<string, object?>
                    {
                        { "@JobType", request.JobType },
                        { "@Status", UploadJobStatuses.Queued },
                        { "@FilePath", request.FilePath },
                        { "@FileOriginalName", (object?)request.FileOriginalName ?? DBNull.Value },
                        { "@FileType", (object?)request.FileType ?? DBNull.Value },
                        { "@FileSize", (object?)request.FileSize ?? DBNull.Value },
                        { "@CompanyId", request.CompanyId },
                        { "@UserId", request.UserId },
                        { "@BankAccountId", (object?)request.BankAccountId ?? DBNull.Value },
                        { "@PayloadJson", (object?)request.PayloadJson ?? DBNull.Value }
                    });

                var result = cmd.ExecuteScalar();
                return result != null ? Convert.ToInt64(result) : 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool SetUploadJobHangfireId(long jobId, string? hangfireJobId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@HangfireJobId", (object?)hangfireJobId ?? DBNull.Value }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool MarkUploadJobProcessing(long jobId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@Status", UploadJobStatuses.Processing }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool MarkUploadJobCompleted(long jobId, string? resultJson)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@Status", UploadJobStatuses.Completed },
                        { "@ResultJson", (object?)resultJson ?? DBNull.Value }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool TryBeginUploadJobVerification(long jobId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@Status", UploadJobStatuses.Verifying },
                        { "@ExpectedCurrentStatus", UploadJobStatuses.Completed }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool MarkUploadJobVerified(long jobId, string? resultJson = null)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@Status", UploadJobStatuses.Verified },
                        { "@ResultJson", (object?)resultJson ?? DBNull.Value }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool RestoreUploadJobCompleted(long jobId, string? resultJson, string? errorMessage = null)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@Status", UploadJobStatuses.Completed },
                        { "@ResultJson", (object?)resultJson ?? DBNull.Value },
                        { "@ErrorMessage", (object?)errorMessage ?? DBNull.Value },
                        { "@ExpectedCurrentStatus", UploadJobStatuses.Verifying }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool MarkUploadJobFailed(long jobId, string errorMessage)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@Status", UploadJobStatuses.Failed },
                        { "@ErrorMessage", errorMessage }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual bool UpdateUploadJobProgress(long jobId, int progressPercent, string? resultJson = null)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Update", con,
                    new Dictionary<string, object?>
                    {
                        { "@Id", jobId },
                        { "@ProgressPercent", Math.Clamp(progressPercent, 0, 100) },
                        { "@ResultJson", (object?)resultJson ?? DBNull.Value }
                    });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }

        public virtual UploadJobRow? GetUploadJobById(long jobId)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_GetById", con,
                    new Dictionary<string, object?> { { "@Id", jobId } });
                reader = cmd.ExecuteReader();
                return reader.Read() ? MapUploadJob(reader) : null;
            }
            finally
            {
                reader?.Close();
                con?.Close();
            }
        }

        public virtual List<UploadJobRow> GetUploadJobsByUser(long userId, long? companyId = null, string? status = null, int take = 50)
        {
            SqlConnection? con = null;
            SqlDataReader? reader = null;
            var rows = new List<UploadJobRow>();
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_GetByUser", con,
                    new Dictionary<string, object?>
                    {
                        { "@Take", Math.Clamp(take, 1, 200) },
                        { "@UserId", userId <= 0 ? (object?)DBNull.Value : userId },
                        { "@CompanyId", (object?)companyId ?? DBNull.Value },
                        { "@Status", string.IsNullOrWhiteSpace(status) ? DBNull.Value : status }
                    });
                reader = cmd.ExecuteReader();
                while (reader.Read())
                    rows.Add(MapUploadJob(reader));
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

        public virtual bool DeleteUploadJob(long jobId)
        {
            SqlConnection? con = null;
            try
            {
                con = Connect();
                var cmd = CreateCommandWithStoredProcedure(
                    "FP26_sp_UploadJobs_Delete", con,
                    new Dictionary<string, object?> { { "@Id", jobId } });
                return cmd.ExecuteNonQuery() > 0;
            }
            finally { con?.Close(); }
        }
    }
}
