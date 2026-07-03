IF OBJECT_ID('dbo.FP26_sp_Companies_RevokeAccess', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_RevokeAccess;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_RevokeAccess
    @AccountantUserId BIGINT,
    @CompanyId        BIGINT,
    @RequestedByUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_user_company_access
    SET status             = 'revoked',
        revoked_at         = GETDATE(),
        revoked_by_user_id = @RequestedByUserId
    WHERE user_id    = @AccountantUserId
      AND company_id = @CompanyId
      AND status     = 'active';

    SELECT @@ROWCOUNT;
END
GO
