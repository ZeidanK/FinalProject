-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Matches_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_GetById
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.id,
        m.invoice_id,
        i.invoice_number,
        i.vendor_name,
        i.invoice_date,
        i.total_amount  AS invoice_amount,
        m.transaction_id,
        t.description   AS transaction_description,
        t.transaction_date,
        t.amount        AS transaction_amount,
        t.transaction_type,
        m.match_type,
        m.matched_amount,
        m.match_method,
        m.match_confidence,
        m.match_reason,
        m.matched_by_user_id,
        u.name          AS matched_by_name,
        m.created_at,
        m.updated_at
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_invoices     i ON i.id = m.invoice_id
    INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
    LEFT  JOIN dbo.FP26_users        u ON u.id = m.matched_by_user_id
    WHERE m.id = @Id;
END
GO
