-- ============================================================
-- Clears all system logs and returns deleted row count.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_ClearSystemLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_ClearSystemLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_ClearSystemLogs
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeletedCount INT;

    DELETE FROM dbo.FP26_system_logs;
    SET @DeletedCount = @@ROWCOUNT;

    SELECT @DeletedCount AS deleted_count;
END
GO
