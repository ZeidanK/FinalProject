IF OBJECT_ID('dbo.FP26_sp_Notifications_DeleteExpired', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Notifications_DeleteExpired;
GO

CREATE PROCEDURE dbo.FP26_sp_Notifications_DeleteExpired
    @ReadDays   INT,
    @UnreadDays INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.FP26_notifications
    WHERE (is_read = 1 AND created_at < DATEADD(DAY, -@ReadDays, SYSUTCDATETIME()))
       OR (is_read = 0 AND created_at < DATEADD(DAY, -@UnreadDays, SYSUTCDATETIME()));
    SELECT @@ROWCOUNT;
END
GO
