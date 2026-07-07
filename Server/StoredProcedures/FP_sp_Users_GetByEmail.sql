-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_GetByEmail', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_GetByEmail;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_GetByEmail
    @Email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        id,
        email,
        password_hash,
        name,
        role,
        is_active,
        is_banned,
        last_login_at,
        created_at
    FROM dbo.FP26_users
    WHERE email = @Email;
END
GO
