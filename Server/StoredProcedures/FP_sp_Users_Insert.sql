-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_Insert
    @Email        VARCHAR(255),
    @PasswordHash VARCHAR(255),
    @Name         VARCHAR(255),
    @Role         VARCHAR(50)  = 'business_owner'
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_users
        (email, password_hash, name, role, is_active, created_at, updated_at)
    VALUES
        (@Email, @PasswordHash, @Name, @Role, 1, GETDATE(), GETDATE());

    -- Return the new identity so C# can read it via ExecuteScalar
    SELECT SCOPE_IDENTITY() AS id;
END
GO
