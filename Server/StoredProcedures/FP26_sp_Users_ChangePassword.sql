CREATE OR ALTER PROCEDURE dbo.FP26_sp_Users_ChangePassword
    @Id              BIGINT,
    @NewPasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_users
    SET
        password_hash = @NewPasswordHash,
        updated_at    = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
