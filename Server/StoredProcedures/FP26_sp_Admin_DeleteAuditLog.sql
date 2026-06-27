-- ============================================================
-- Deletes one audit log entry and returns deleted row count.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_DeleteAuditLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_DeleteAuditLog;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_DeleteAuditLog
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeletedCount INT;

    DELETE FROM dbo.FP26_audit_logs
    WHERE id = @Id;

    SET @DeletedCount = @@ROWCOUNT;
    SELECT @DeletedCount AS deleted_count;
END
GO
