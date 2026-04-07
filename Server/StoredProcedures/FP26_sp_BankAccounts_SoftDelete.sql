-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Soft delete: sets is_active = 0, data is preserved.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_BankAccounts_SoftDelete', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_BankAccounts_SoftDelete;
GO

CREATE PROCEDURE dbo.FP26_sp_BankAccounts_SoftDelete
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_bank_accounts
    SET
        is_active  = 0,
        updated_at = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO
