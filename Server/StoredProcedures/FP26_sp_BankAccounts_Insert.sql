-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_BankAccounts_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_BankAccounts_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_BankAccounts_Insert
    @CompanyId           BIGINT,
    @BankName            VARCHAR(255),
    @AccountType         VARCHAR(50),
    @CreatedByUserId     BIGINT       = NULL,
    @AccountName         VARCHAR(255) = NULL,
    @AccountNumberMasked VARCHAR(50)  = NULL,
    @Currency            VARCHAR(3)   = 'USD',
    @Balance             DECIMAL(15,2) = 0
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_bank_accounts
        (company_id, bank_name, account_name, account_number_masked,
         account_type, currency, is_active, balance,
         created_by_user_id, created_at, updated_at)
    VALUES
        (@CompanyId, @BankName, @AccountName, @AccountNumberMasked,
         @AccountType, @Currency, 1, @Balance,
         @CreatedByUserId, GETDATE(), GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
GO
