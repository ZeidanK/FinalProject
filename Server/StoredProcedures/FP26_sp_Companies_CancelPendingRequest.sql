IF OBJECT_ID('dbo.FP26_sp_Companies_CancelPendingRequest', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_CancelPendingRequest;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_CancelPendingRequest
    @AccountantUserId  BIGINT,
    @CompanyId         BIGINT,
    @RequestedByUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_user_company_access
    SET status             = 'revoked',
        revoked_at         = GETDATE(),
        revoked_by_user_id = @RequestedByUserId
    WHERE user_id           = @AccountantUserId
      AND company_id        = @CompanyId
      AND status            = 'pending'
      AND granted_by_user_id = @RequestedByUserId;

    SELECT @@ROWCOUNT;
END
GO
