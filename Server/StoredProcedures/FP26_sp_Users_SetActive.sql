-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Sets FP26_users.is_active = 1 for a given user.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_SetActive', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_SetActive;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_SetActive
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_users
    SET
        is_active = 1,
        updated_at = GETDATE()
    WHERE id = @Id;

    -- Return new state
    SELECT id, is_active FROM dbo.FP26_users WHERE id = @Id;
END
GO

