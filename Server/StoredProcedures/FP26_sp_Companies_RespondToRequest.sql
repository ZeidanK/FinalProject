IF OBJECT_ID('dbo.FP26_sp_Companies_RespondToRequest', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_RespondToRequest;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_RespondToRequest
    @RequestId        BIGINT,
    @AccountantUserId BIGINT,
    @Accept           BIT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Status VARCHAR(50) = CASE WHEN @Accept = 1 THEN 'active' ELSE 'revoked' END;

    UPDATE dbo.FP26_user_company_access
    SET status             = @Status,
        access_level       = CASE WHEN @Accept = 1 THEN 'full' ELSE access_level END,
        granted_at         = CASE WHEN @Accept = 1 THEN GETDATE() ELSE granted_at END,
        revoked_at         = CASE WHEN @Accept = 0 THEN GETDATE() ELSE revoked_at END,
        revoked_by_user_id = CASE WHEN @Accept = 0 THEN @AccountantUserId ELSE revoked_by_user_id END
    WHERE id      = @RequestId
      AND user_id = @AccountantUserId
      AND status  = 'pending';

    SELECT @@ROWCOUNT;
END
GO
