IF OBJECT_ID('dbo.FP26_sp_Admin_ClearAuditLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_ClearAuditLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_ClearAuditLogs
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.FP26_audit_logs;
    SELECT @@ROWCOUNT;
END
GO
