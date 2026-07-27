IF OBJECT_ID('dbo.FP26_sp_Admin_DeleteSystemLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_DeleteSystemLog;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_DeleteSystemLog
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.FP26_system_logs WHERE id = @Id;
    SELECT @@ROWCOUNT;
END
GO
