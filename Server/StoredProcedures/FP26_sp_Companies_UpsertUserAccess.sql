IF OBJECT_ID('dbo.FP26_sp_Companies_UpsertUserAccess', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_UpsertUserAccess;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_UpsertUserAccess
    @UserId          BIGINT,
    @CompanyId       BIGINT,
    @GrantedByUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM dbo.FP26_user_company_access
        WHERE user_id = @UserId
          AND company_id = @CompanyId
    )
    BEGIN
        UPDATE dbo.FP26_user_company_access
        SET access_level = 'full',
            status = 'active',
            granted_at = GETDATE()
        WHERE user_id = @UserId
          AND company_id = @CompanyId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.FP26_user_company_access
            (user_id, company_id, access_level, status, granted_by_user_id, granted_at, created_at)
        VALUES
            (@UserId, @CompanyId, 'full', 'active', @GrantedByUserId, GETDATE(), GETDATE());
    END
END
GO
