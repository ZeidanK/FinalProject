IF OBJECT_ID('dbo.FP26_sp_Users_CheckIsActive', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_CheckIsActive;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_CheckIsActive
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 is_active FROM dbo.FP26_users WHERE id = @UserId;
END
GO
