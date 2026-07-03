IF OBJECT_ID('dbo.FP26_sp_Users_SoftDelete', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_SoftDelete;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_SoftDelete
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_users
    SET is_active = 0,
        updated_at = GETDATE()
    WHERE id = @UserId;
    SELECT @@ROWCOUNT;
END
GO
