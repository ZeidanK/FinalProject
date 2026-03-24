-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Anomalies_Resolve', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_Resolve;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_Resolve
    @Id                  BIGINT,
    @ResolvedByUserId    BIGINT,
    @ResolutionNotes     VARCHAR(MAX) = NULL,
    @Status              VARCHAR(50)  = 'resolved'
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_anomalies
    SET
        status               = @Status,
        resolved_by_user_id  = @ResolvedByUserId,
        resolution_notes     = @ResolutionNotes,
        resolved_at          = GETDATE(),
        updated_at           = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO
