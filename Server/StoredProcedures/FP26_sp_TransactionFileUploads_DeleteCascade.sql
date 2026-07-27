IF OBJECT_ID('dbo.FP26_sp_TransactionFileUploads_DeleteCascade', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_TransactionFileUploads_DeleteCascade;
GO

CREATE PROCEDURE dbo.FP26_sp_TransactionFileUploads_DeleteCascade
    @UploadId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CompanyId BIGINT;
    DECLARE @FileHash VARCHAR(64);
    DECLARE @AnomalyId BIGINT;
    DECLARE @DeletedRows INT = 0;

    SELECT
        @CompanyId = company_id,
        @FileHash = file_hash_sha256,
        @AnomalyId = anomaly_id
    FROM dbo.FP26_transaction_file_uploads
    WHERE id = @UploadId;

    IF @CompanyId IS NULL
    BEGIN
        SELECT @DeletedRows;
        RETURN;
    END

    DELETE FROM dbo.FP26_transaction_file_uploads
    WHERE id = @UploadId;
    SET @DeletedRows = @@ROWCOUNT;

    IF (
        SELECT COUNT(1)
        FROM dbo.FP26_transaction_file_uploads
        WHERE company_id = @CompanyId
          AND file_hash_sha256 = @FileHash
    ) < 2
    BEGIN
        DELETE a
        FROM dbo.FP26_anomalies a
        WHERE a.company_id = @CompanyId
          AND a.anomaly_type = 'duplicate_transaction_file'
          AND a.status = 'open'
          AND (
              a.id = @AnomalyId
              OR EXISTS (
                  SELECT 1
                  FROM dbo.FP26_transaction_file_uploads tfu
                  WHERE tfu.anomaly_id = a.id
                    AND tfu.file_hash_sha256 = @FileHash
              )
          );
    END

    SELECT @DeletedRows;
END
GO
