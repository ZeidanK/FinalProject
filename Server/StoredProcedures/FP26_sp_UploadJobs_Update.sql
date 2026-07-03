IF OBJECT_ID('dbo.FP26_sp_UploadJobs_Update', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_UploadJobs_Update;
GO

CREATE PROCEDURE dbo.FP26_sp_UploadJobs_Update
    @Id                    BIGINT,
    @Status                VARCHAR(50) = NULL,
    @ProgressPercent       INT = NULL,
    @ResultJson            NVARCHAR(MAX) = NULL,
    @ErrorMessage          NVARCHAR(MAX) = NULL,
    @HangfireJobId         VARCHAR(255) = NULL,
    @CompletedAt           DATETIME2 = NULL,
    @ExpectedCurrentStatus VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_upload_jobs
    SET
        status = COALESCE(@Status, status),
        progress_percent = CASE
            WHEN @ProgressPercent IS NOT NULL THEN @ProgressPercent
            WHEN @Status = 'processing' AND progress_percent < 5 THEN 5
            ELSE progress_percent
        END,
        result_json = COALESCE(@ResultJson, result_json),
        error_message = CASE
            WHEN @ErrorMessage IS NOT NULL THEN @ErrorMessage
            WHEN @Status IN ('processing', 'completed', 'verifying') THEN NULL
            ELSE error_message
        END,
        hangfire_job_id = COALESCE(@HangfireJobId, hangfire_job_id),
        completed_at = COALESCE(@CompletedAt, completed_at),
        updated_at = GETDATE()
    WHERE id = @Id
      AND (@ExpectedCurrentStatus IS NULL OR status = @ExpectedCurrentStatus);

    SELECT @@ROWCOUNT;
END
GO
