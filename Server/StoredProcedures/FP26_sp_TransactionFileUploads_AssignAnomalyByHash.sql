IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_AssignAnomalyByHash', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_AssignAnomalyByHash;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_AssignAnomalyByHash
    @AnomalyId  BIGINT,
    @CompanyId  BIGINT,
    @FileHash   VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_transaction_file_uploads
    SET anomaly_id = @AnomalyId
    WHERE company_id = @CompanyId
      AND file_hash_sha256 = @FileHash;
    SELECT @@ROWCOUNT;
END
GO
