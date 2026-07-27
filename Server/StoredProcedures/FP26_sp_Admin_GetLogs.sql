-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Paginated system logs with optional level/category filter.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_GetLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_GetLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_GetLogs
    @Page     INT          = 1,
    @Limit    INT          = 50,
    @Level    VARCHAR(20)  = NULL,
    @Category VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS total_count
    FROM dbo.FP26_system_logs
    WHERE (@Level    IS NULL OR UPPER(level) = UPPER(@Level))
      AND (@Category IS NULL OR category = @Category);

    SELECT
        id,
        level,
        category,
        message,
        details,
        user_id,
        ip_address,
        user_agent,
        created_at
    FROM dbo.FP26_system_logs
    WHERE (@Level    IS NULL OR UPPER(level) = UPPER(@Level))
      AND (@Category IS NULL OR category = @Category)
    ORDER BY created_at DESC
    OFFSET  (@Page - 1) * @Limit ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO
