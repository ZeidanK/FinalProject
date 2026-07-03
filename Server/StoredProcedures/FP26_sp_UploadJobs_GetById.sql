IF OBJECT_ID('dbo.FP26_sp_UploadJobs_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_UploadJobs_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_UploadJobs_GetById
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        id, job_type, status, file_path, file_original_name, file_type, file_size,
        company_id, user_id, bank_account_id, payload_json, result_json, error_message,
        progress_percent, hangfire_job_id, created_at, updated_at, completed_at
    FROM dbo.FP26_upload_jobs
    WHERE id = @Id;
END
GO
