-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Flips is_active: 1→0 or 0→1 atomically on a single row.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_ToggleUserActive', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_ToggleUserActive;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_ToggleUserActive
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_users
    SET
        is_active  = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
        updated_at = GETDATE()
    WHERE id = @Id;

    -- Return the new state
    SELECT id, is_active FROM dbo.FP26_users WHERE id = @Id;
END
GO
