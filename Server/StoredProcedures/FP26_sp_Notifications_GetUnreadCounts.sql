IF OBJECT_ID('dbo.FP26_sp_Notifications_GetUnreadCounts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Notifications_GetUnreadCounts;
GO

CREATE PROCEDURE dbo.FP26_sp_Notifications_GetUnreadCounts
    @UserId    BIGINT,
    @View      VARCHAR(20),
    @CompanyId BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        SUM(CASE WHEN is_read = 0 AND scope = 'personal' THEN 1 ELSE 0 END) AS personal_unread,
        SUM(CASE WHEN is_read = 0 AND scope = 'company' AND company_id = @CompanyId THEN 1 ELSE 0 END) AS company_unread,
        SUM(CASE WHEN is_read = 0 AND (
            (@View = 'personal' AND scope = 'personal') OR
            (@View = 'company' AND scope = 'company' AND company_id = @CompanyId) OR
            (@View = 'combined')
        ) THEN 1 ELSE 0 END) AS visible_unread
    FROM dbo.FP26_notifications
    WHERE user_id = @UserId;
END
GO
