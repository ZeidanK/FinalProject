-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Paginated, searchable user list for the admin panel.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_GetUsers', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_GetUsers;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_GetUsers
    @Page   INT          = 1,
    @Limit  INT          = 50,
    @Role   VARCHAR(50)  = NULL,
    @Search VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Total count (for pagination metadata)
    SELECT COUNT(*) AS total_count
    FROM dbo.FP26_users
    WHERE (@Role   IS NULL OR role  = @Role)
      AND (@Search IS NULL OR name  LIKE '%' + @Search + '%'
                           OR email LIKE '%' + @Search + '%');

    -- Paged rows
    SELECT
        id,
        email,
        name,
        role,
        phone,
        is_active,
        is_banned,
        email_verified,
        last_login_at,
        created_at
    FROM dbo.FP26_users
    WHERE (@Role   IS NULL OR role  = @Role)
      AND (@Search IS NULL OR name  LIKE '%' + @Search + '%'
                           OR email LIKE '%' + @Search + '%')
    ORDER BY created_at DESC
    OFFSET  (@Page - 1) * @Limit ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO
