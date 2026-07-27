IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_GetById
    @UploadId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, company_id, file_hash_sha256, file_original_name, file_path, file_size, uploaded_by_user_id, created_at, anomaly_id
    FROM dbo.FP26_transaction_file_uploads
    WHERE id = @UploadId;
END
GO
