-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_GetAll', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_GetAll;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_GetAll
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id,
        email,
        name,
        role,
        phone,
        profile_picture,
        is_active,
        email_verified,
        last_login_at,
        created_at
    FROM dbo.FP26_users
    ORDER BY name;
END
GO
