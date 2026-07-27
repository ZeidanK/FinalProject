IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_Insert
    @CompanyId         BIGINT,
    @FileHash          VARCHAR(64),
    @FileOriginalName  VARCHAR(255) = NULL,
    @FilePath          VARCHAR(500) = NULL,
    @FileSize          BIGINT = NULL,
    @UploadedByUserId  BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.FP26_transaction_file_uploads
        (company_id, file_hash_sha256, file_original_name, file_path, file_size, uploaded_by_user_id, created_at)
    VALUES
        (@CompanyId, @FileHash, @FileOriginalName, @FilePath, @FileSize, @UploadedByUserId, GETDATE());
    SELECT SCOPE_IDENTITY();
END
GO
