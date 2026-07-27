IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_SetAnomaly', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_SetAnomaly;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_SetAnomaly
    @UploadId   BIGINT,
    @AnomalyId  BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_transaction_file_uploads
    SET anomaly_id = @AnomalyId
    WHERE id = @UploadId;
    SELECT @@ROWCOUNT;
END
GO
