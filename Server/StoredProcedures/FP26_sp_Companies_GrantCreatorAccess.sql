IF OBJECT_ID('dbo.FP26_sp_Companies_GrantCreatorAccess', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_GrantCreatorAccess;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_GrantCreatorAccess
    @UserId    BIGINT,
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.FP26_user_company_access
        WHERE user_id = @UserId AND company_id = @CompanyId
    )
    BEGIN
        INSERT INTO dbo.FP26_user_company_access
            (user_id, company_id, access_level, status, granted_by_user_id, granted_at, created_at)
        VALUES
            (@UserId, @CompanyId, 'full', 'active', @UserId, GETDATE(), GETDATE());
    END
END
GO
