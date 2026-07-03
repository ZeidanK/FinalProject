IF OBJECT_ID('dbo.FP26_sp_Notifications_GetActiveUserIds', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Notifications_GetActiveUserIds;
GO

CREATE PROCEDURE dbo.FP26_sp_Notifications_GetActiveUserIds
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT uca.user_id
    FROM dbo.FP26_user_company_access uca
    INNER JOIN dbo.FP26_users u ON u.id = uca.user_id
    INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
    WHERE uca.company_id = @CompanyId
      AND uca.status = 'active'
      AND (uca.expires_at IS NULL OR uca.expires_at > SYSUTCDATETIME())
      AND u.is_active = 1
      AND c.is_active = 1;
END
GO
