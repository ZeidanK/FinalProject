CREATE OR ALTER PROCEDURE dbo.FP26_sp_Users_GetPasswordHash
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 password_hash
    FROM dbo.FP26_users
    WHERE id = @Id;
END
