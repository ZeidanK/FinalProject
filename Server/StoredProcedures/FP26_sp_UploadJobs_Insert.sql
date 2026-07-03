IF OBJECT_ID('dbo.FP26_sp_UploadJobs_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_UploadJobs_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_UploadJobs_Insert
    @JobType           VARCHAR(50),
    @Status            VARCHAR(50),
    @FilePath          VARCHAR(500),
    @FileOriginalName  VARCHAR(255) = NULL,
    @FileType          VARCHAR(50)  = NULL,
    @FileSize          BIGINT = NULL,
    @CompanyId         BIGINT,
    @UserId            BIGINT,
    @BankAccountId     BIGINT = NULL,
    @PayloadJson       NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.FP26_upload_jobs
    (
        job_type, status, file_path, file_original_name, file_type, file_size,
        company_id, user_id, bank_account_id, payload_json,
        progress_percent, created_at, updated_at
    )
    VALUES
    (
        @JobType, @Status, @FilePath, @FileOriginalName, @FileType, @FileSize,
        @CompanyId, @UserId, @BankAccountId, @PayloadJson,
        0, GETDATE(), GETDATE()
    );
    SELECT SCOPE_IDENTITY();
END
GO
