-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_BankAccounts_Update', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_BankAccounts_Update;
GO

CREATE PROCEDURE dbo.FP26_sp_BankAccounts_Update
    @Id                  BIGINT,
    @BankName            VARCHAR(255)  = NULL,
    @AccountName         VARCHAR(255)  = NULL,
    @AccountNumberMasked VARCHAR(50)   = NULL,
    @AccountType         VARCHAR(50)   = NULL,
    @Currency            VARCHAR(3)    = NULL,
    @IsActive            BIT           = NULL,
    @Balance             DECIMAL(15,2) = NULL,
    @LastSyncAt          DATETIME2     = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_bank_accounts
    SET
        bank_name              = ISNULL(@BankName,            bank_name),
        account_name           = ISNULL(@AccountName,         account_name),
        account_number_masked  = ISNULL(@AccountNumberMasked, account_number_masked),
        account_type           = ISNULL(@AccountType,         account_type),
        currency               = ISNULL(@Currency,            currency),
        is_active              = ISNULL(@IsActive,            is_active),
        balance                = ISNULL(@Balance,             balance),
        last_sync_at           = ISNULL(@LastSyncAt,          last_sync_at),
        updated_at             = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO
