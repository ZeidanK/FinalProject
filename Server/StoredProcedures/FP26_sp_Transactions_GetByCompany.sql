-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Transactions_GetByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_GetByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_GetByCompany
    @CompanyId  BIGINT,
    @Type       VARCHAR(50) = NULL,
    @IsMatched  BIT         = NULL,
    @StartDate  DATE        = NULL,
    @EndDate    DATE        = NULL
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
        t.amount,
        t.balance_after,
        t.transaction_type,
        t.category,
        t.reference_number,
        t.is_matched,
        t.is_duplicate,
        t.status,
        t.created_by_user_id,
        t.created_at,
        t.updated_at
    FROM dbo.FP26_transactions t
    WHERE t.company_id = @CompanyId
      AND (@Type      IS NULL OR t.transaction_type = @Type)
      AND (@IsMatched IS NULL OR t.is_matched        = @IsMatched)
      AND (@StartDate IS NULL OR t.transaction_date >= @StartDate)
      AND (@EndDate   IS NULL OR t.transaction_date <= @EndDate)
    ORDER BY t.transaction_date DESC;
END
GO
