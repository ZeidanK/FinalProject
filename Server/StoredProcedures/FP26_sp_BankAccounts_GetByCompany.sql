-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_BankAccounts_GetByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_BankAccounts_GetByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_BankAccounts_GetByCompany
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ba.id,
        ba.company_id,
        ba.bank_name,
        ba.account_name,
        ba.account_number_masked,
        ba.account_type,
        ba.currency,
        ba.is_active,
        ba.last_sync_at,
        ba.balance,
        ba.created_by_user_id,
        u.name AS created_by_name,
        ba.created_at,
        ba.updated_at
    FROM dbo.FP26_bank_accounts ba
    LEFT JOIN dbo.FP26_users u ON u.id = ba.created_by_user_id
    WHERE ba.company_id = @CompanyId
      AND ba.is_active  = 1
    ORDER BY ba.bank_name;
END
GO
