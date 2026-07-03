IF OBJECT_ID('dbo.FP26_sp_Users_UpdateLastLogin', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_UpdateLastLogin;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_UpdateLastLogin
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_users
    SET last_login_at = GETDATE(),
        updated_at = GETDATE()
    WHERE id = @Id;
END
GO
