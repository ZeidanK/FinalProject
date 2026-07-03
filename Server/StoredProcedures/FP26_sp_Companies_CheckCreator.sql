IF OBJECT_ID('dbo.FP26_sp_Companies_CheckCreator', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_CheckCreator;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_CheckCreator
    @CompanyId BIGINT,
    @UserId    BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 1 FROM dbo.FP26_companies
    WHERE id = @CompanyId AND created_by_user_id = @UserId AND is_active = 1;
END
GO
