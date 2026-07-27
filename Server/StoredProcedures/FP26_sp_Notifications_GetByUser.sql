CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_GetByUser
    @UserId BIGINT,
    @Take   INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Take)
        id, user_id, event_type, title, body, severity,
        is_read, company_id, link, created_at, read_at
    FROM dbo.FP26_notifications
    WHERE user_id = @UserId
    ORDER BY created_at DESC;
END
