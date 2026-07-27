IF OBJECT_ID('dbo.FP26_sp_Companies_CheckUserAccess', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_CheckUserAccess;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_CheckUserAccess
    @UserId    BIGINT,
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 1
    FROM dbo.FP26_user_company_access uca
    INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
    INNER JOIN dbo.FP26_users u ON u.id = uca.user_id
    WHERE uca.user_id = @UserId
      AND uca.company_id = @CompanyId
      AND uca.status = 'active'
      AND (uca.expires_at IS NULL OR uca.expires_at > SYSUTCDATETIME())
      AND u.is_active = 1
      AND u.is_banned = 0
      AND c.is_active = 1;
END
GO
