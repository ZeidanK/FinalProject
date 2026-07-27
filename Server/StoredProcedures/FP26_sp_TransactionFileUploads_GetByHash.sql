IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_GetByHash', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_GetByHash;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_GetByHash
    @CompanyId     BIGINT,
    @FileHash      VARCHAR(64),
    @CreatedBefore DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, company_id, file_hash_sha256, file_original_name, file_path, file_size, uploaded_by_user_id, created_at, anomaly_id
    FROM dbo.FP26_transaction_file_uploads
    WHERE company_id = @CompanyId
      AND file_hash_sha256 = @FileHash
      AND (@CreatedBefore IS NULL OR created_at <= @CreatedBefore)
    ORDER BY created_at ASC;
END
GO
