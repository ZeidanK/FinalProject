IF OBJECT_ID('dbo.FP26_sp_Users_CheckIsActive', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_CheckIsActive;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_CheckIsActive
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 CASE WHEN is_active = 1 AND is_banned = 0 THEN 1 ELSE 0 END
    FROM dbo.FP26_users WHERE id = @UserId;
END
GO
