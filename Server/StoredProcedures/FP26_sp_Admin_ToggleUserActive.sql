-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Flips is_banned: 0→1 (ban) or 1→0 (unban) atomically.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_ToggleUserBan', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_ToggleUserBan;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_ToggleUserBan
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_users
    SET
        is_banned  = CASE WHEN is_banned = 1 THEN 0 ELSE 1 END,
        updated_at = GETDATE()
    WHERE id = @Id;

    -- Return the new ban state
    SELECT id, is_banned FROM dbo.FP26_users WHERE id = @Id;
END
GO
