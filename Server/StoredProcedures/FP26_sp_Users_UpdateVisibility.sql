IF OBJECT_ID('dbo.FP26_sp_Users_UpdateVisibility', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_UpdateVisibility;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_UpdateVisibility
    @Id       BIGINT,
    @IsPublic BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_users
    SET is_public = @IsPublic
    WHERE id = @Id;
    SELECT @@ROWCOUNT;
END
GO
