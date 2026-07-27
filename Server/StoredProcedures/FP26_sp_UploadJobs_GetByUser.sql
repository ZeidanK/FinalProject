IF OBJECT_ID('dbo.FP26_sp_UploadJobs_GetByUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_UploadJobs_GetByUser;
GO

CREATE PROCEDURE dbo.FP26_sp_UploadJobs_GetByUser
    @Take      INT = 50,
    @UserId    BIGINT = NULL,
    @CompanyId BIGINT = NULL,
    @Status    VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Take)
        id, job_type, status, file_path, file_original_name, file_type, file_size,
        company_id, user_id, bank_account_id, payload_json, result_json, error_message,
        progress_percent, hangfire_job_id, created_at, updated_at, completed_at
    FROM dbo.FP26_upload_jobs
    WHERE (@UserId IS NULL OR user_id = @UserId)
      AND (@CompanyId IS NULL OR company_id = @CompanyId)
      AND (@Status IS NULL OR status = @Status)
    ORDER BY created_at DESC;
END
GO
