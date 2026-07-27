-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns 6 aggregate result sets for transaction summaries.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Transactions_GetSummary', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_GetSummary;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_GetSummary
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- Use effective amount: charge_amount when positive, otherwise amount
    -- (matches TransactionAmountHelper.GetEffectiveAmount() in the matching engine)
    DECLARE @tx TABLE (
        transaction_type   VARCHAR(50),
        category           VARCHAR(100),
        vendor_name        VARCHAR(255),
        transaction_date   DATE,
        is_matched         BIT,
        is_anomaly         BIT,
        is_duplicate       BIT,
        requires_invoice   BIT,
        effective_amount   DECIMAL(15,2)
    );

    INSERT INTO @tx
    SELECT
        transaction_type,
        category,
        vendor_name,
        transaction_date,
        is_matched,
        is_anomaly,
        is_duplicate,
        requires_invoice,
        COALESCE(NULLIF(charge_amount, 0), amount)
    FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId;

    -- 1. Overall summary
    SELECT
        COUNT(*)                        AS total_count,
        ISNULL(SUM(effective_amount), 0) AS total_amount,
        ISNULL(SUM(CASE WHEN LOWER(transaction_type) IN ('debit', 'withdrawal', 'חובה', 'משיכה', 'חיוב', 'חיוב חודשי', 'חיוב עסקות מיידי', 'תשלומים') THEN ABS(effective_amount) ELSE 0 END), 0) AS total_debits,
        ISNULL(SUM(CASE WHEN LOWER(transaction_type) IN ('credit', 'deposit', 'זכות', 'הפקדה') THEN ABS(effective_amount) ELSE 0 END), 0) AS total_credits,
        ISNULL(AVG(effective_amount), 0) AS avg_amount
    FROM @tx;

    -- 2. By transaction type
    SELECT
        transaction_type,
        COUNT(*)                        AS count,
        ISNULL(SUM(effective_amount), 0) AS sum_amount
    FROM @tx
    GROUP BY transaction_type
    ORDER BY sum_amount DESC;

    -- 3. By category
    SELECT
        ISNULL(category, 'Uncategorized') AS category,
        COUNT(*)                           AS count,
        ISNULL(SUM(effective_amount), 0)   AS sum_amount
    FROM @tx
    GROUP BY category
    ORDER BY sum_amount DESC;

    -- 4. Monthly breakdown
    SELECT
        YEAR(transaction_date)          AS year,
        MONTH(transaction_date)         AS month,
        COUNT(*)                        AS count,
        ISNULL(SUM(effective_amount), 0) AS sum_amount
    FROM @tx
    GROUP BY YEAR(transaction_date), MONTH(transaction_date)
    ORDER BY year DESC, month DESC;

    -- 5. Top vendors
    SELECT TOP 10
        ISNULL(vendor_name, 'Unknown')  AS vendor_name,
        COUNT(*)                        AS count,
        ISNULL(SUM(effective_amount), 0) AS sum_amount
    FROM @tx
    WHERE vendor_name IS NOT NULL
    GROUP BY vendor_name
    ORDER BY sum_amount DESC;

    -- 6. Status summary
    SELECT
        COUNT(CASE WHEN is_matched        = 1 THEN 1 END)    AS matched_count,
        COUNT(CASE WHEN is_anomaly        = 1 THEN 1 END)    AS anomaly_count,
        COUNT(CASE WHEN is_duplicate      = 1 THEN 1 END)    AS duplicate_count,
        COUNT(CASE WHEN requires_invoice  = 1 THEN 1 END)    AS requires_invoice_count,
        COUNT(CASE WHEN requires_invoice  = 0 THEN 1 END)    AS without_invoice_count
    FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId;
END
GO
