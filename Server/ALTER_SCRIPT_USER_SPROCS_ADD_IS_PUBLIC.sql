-- Patch FP26_sp_Users_GetById and FP26_sp_Users_GetAll to include is_public column.
-- Run this against igroup104_test2 after running ALTER_SCRIPT_USER_VISIBILITY.sql.

ALTER PROCEDURE dbo.FP26_sp_Users_GetById
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

ALTER PROCEDURE dbo.FP26_sp_Users_GetAll
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
        is_public,
        email_verified,
        last_login_at,
        created_at
    FROM dbo.FP26_users
    ORDER BY name;
END
GO
