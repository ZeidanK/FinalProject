-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_GetById
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        id,
        email,
        name,
        role,
        phone,
        profile_picture,
        is_active,
        is_public,
        email_verified,
        last_login_at,
        created_at
    FROM dbo.FP26_users
    WHERE id = @Id;
END
GO
