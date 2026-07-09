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
        t.transaction_date,
        t.posted_date,
        t.description,
        t.vendor_name,
        t.card_last4,
        t.amount,
        t.transaction_type,
        t.category,
        t.category_confidence,
        t.reference_number,
        t.charge_amount,
        t.charge_currency,
        t.original_currency,
        t.exchange_rate,
        t.requires_invoice,
        t.is_matched,
        t.is_anomaly,
        t.is_duplicate,
        t.status,
        t.created_by_user_id,
        u.name AS created_by_name,
        t.created_at,
        t.updated_at
    FROM dbo.FP26_transactions t
    LEFT JOIN dbo.FP26_users u ON u.id = t.created_by_user_id
    WHERE t.id = @Id;
END
GO
