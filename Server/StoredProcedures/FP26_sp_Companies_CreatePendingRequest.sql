IF OBJECT_ID('dbo.FP26_sp_Companies_CreatePendingRequest', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_CreatePendingRequest;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_CreatePendingRequest
    @AccountantUserId BIGINT,
    @CompanyId        BIGINT,
    @RequestedByUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ExistingStatus VARCHAR(50);

    SELECT @ExistingStatus = status
    FROM dbo.FP26_user_company_access
    WHERE user_id = @AccountantUserId AND company_id = @CompanyId;

    IF @ExistingStatus = 'active'
    BEGIN
        SELECT 'already_active' AS result;
        RETURN;
    END

    IF @ExistingStatus = 'pending'
    BEGIN
        SELECT 'already_pending' AS result;
        RETURN;
    END

    IF @ExistingStatus IS NULL
    BEGIN
        INSERT INTO dbo.FP26_user_company_access
            (user_id, company_id, access_level, status, granted_by_user_id, created_at)
        VALUES
            (@AccountantUserId, @CompanyId, 'view_only', 'pending', @RequestedByUserId, GETDATE());
    END
    ELSE
    BEGIN
        UPDATE dbo.FP26_user_company_access
        SET status              = 'pending',
            access_level        = 'view_only',
            granted_by_user_id  = @RequestedByUserId,
            granted_at          = NULL,
            revoked_at          = NULL,
            revoked_by_user_id  = NULL
        WHERE user_id = @AccountantUserId AND company_id = @CompanyId;
    END

    SELECT 'success' AS result;
END
GO
