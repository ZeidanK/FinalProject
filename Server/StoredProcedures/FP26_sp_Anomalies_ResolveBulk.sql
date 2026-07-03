IF OBJECT_ID('dbo.FP26_sp_Anomalies_ResolveBulk', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_ResolveBulk;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_ResolveBulk
    @Id                BIGINT,
    @Status            VARCHAR(50),
    @ResolvedByUserId  BIGINT,
    @ResolutionNotes   NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_anomalies
    SET status = @Status,
        resolved_by_user_id = CASE WHEN @Status = 'open' THEN NULL ELSE @ResolvedByUserId END,
        resolution_notes = CASE WHEN @Status = 'open' THEN NULL ELSE @ResolutionNotes END,
        resolved_at = CASE WHEN @Status = 'open' THEN NULL ELSE GETDATE() END,
        updated_at = GETDATE()
    WHERE id = @Id;
    SELECT @@ROWCOUNT;
END
GO
