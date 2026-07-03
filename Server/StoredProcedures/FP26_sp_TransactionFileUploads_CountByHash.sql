IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_CountByHash', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_CountByHash;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_CountByHash
    @CompanyId BIGINT,
    @FileHash  VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(1)
    FROM dbo.FP26_transaction_file_uploads
    WHERE company_id = @CompanyId AND file_hash_sha256 = @FileHash;
END
GO
