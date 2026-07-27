IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_GetClosestHash', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_GetClosestHash;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_GetClosestHash
    @CompanyId         BIGINT,
    @AnomalyCreatedAt  DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 file_hash_sha256
    FROM dbo.FP26_transaction_file_uploads
    WHERE company_id = @CompanyId
    ORDER BY ABS(DATEDIFF_BIG(MILLISECOND, created_at, @AnomalyCreatedAt)), created_at ASC;
END
GO
