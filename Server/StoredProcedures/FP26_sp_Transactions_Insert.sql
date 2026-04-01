-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Single-row insert. For bulk imports, call this SP in a loop
-- from the C# DAL wrapped in a SqlTransaction.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Transactions_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_Insert
    @CompanyId         BIGINT,
    @TransactionDate   DATE,
    @Description       VARCHAR(MAX),
    @Amount            DECIMAL(15,2),
    @TransactionType   VARCHAR(50),
    @CreatedByUserId   BIGINT        = NULL,
    @BankAccountId     BIGINT        = NULL,
    @PostedDate        DATE          = NULL,
    @BalanceAfter      DECIMAL(15,2) = NULL,
    @Category          VARCHAR(100)  = NULL,
    @ReferenceNumber   VARCHAR(100)  = NULL,
    @VendorName        VARCHAR(255)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_transactions
        (company_id, bank_account_id, transaction_date, posted_date,
         description, amount, balance_after, transaction_type,
         category, reference_number, vendor_name, is_matched, is_duplicate,
         status, created_by_user_id, created_at, updated_at)
    VALUES
        (@CompanyId, @BankAccountId, @TransactionDate, @PostedDate,
         @Description, @Amount, @BalanceAfter, @TransactionType,
         @Category, @ReferenceNumber, @VendorName, 0, 0,
         'confirmed', @CreatedByUserId, GETDATE(), GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
GO
