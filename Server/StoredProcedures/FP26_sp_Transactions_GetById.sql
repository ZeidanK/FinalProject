-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Transactions_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_GetById
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.id,
        t.company_id,
        t.bank_account_id,
        t.transaction_date,
        t.posted_date,
        t.description,
        t.vendor_name,
        t.amount,
        t.balance_after,
        t.transaction_type,
        t.category,
        t.category_confidence,
        t.reference_number,
        t.is_matched,
        t.is_duplicate,
        t.status,
        t.created_by_user_id,
        t.created_at,
        t.updated_at
    FROM dbo.FP26_transactions t
    WHERE t.id = @Id;
END
GO
