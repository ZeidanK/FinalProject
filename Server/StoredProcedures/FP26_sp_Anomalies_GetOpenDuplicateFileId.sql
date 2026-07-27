IF OBJECT_ID('dbo.FP26_sp_Anomalies_GetOpenDuplicateFileId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_GetOpenDuplicateFileId;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_GetOpenDuplicateFileId
    @CompanyId BIGINT,
    @FileHash  VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 a.id
    FROM dbo.FP26_transaction_file_uploads tfu
    INNER JOIN dbo.FP26_anomalies a ON a.id = tfu.anomaly_id
    WHERE tfu.company_id = @CompanyId
      AND tfu.file_hash_sha256 = @FileHash
      AND a.anomaly_type = 'duplicate_transaction_file'
      AND a.status = 'open'
    ORDER BY a.created_at ASC;
END
GO
