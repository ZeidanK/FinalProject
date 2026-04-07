-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Matches_GetByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_GetByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_GetByCompany
    @CompanyId BIGINT,
    @Status    VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        m.id,
        m.invoice_id,
        i.invoice_number,
        i.vendor_name,
        i.total_amount  AS invoice_amount,
        m.transaction_id,
        t.vendor_name   AS transaction_vendor_name,
        t.description   AS transaction_description,
        t.transaction_date,
        t.amount        AS transaction_amount,
        m.match_type,
        m.matched_amount,
        m.match_method,
        m.match_confidence,
        m.match_reason,
        m.matched_by_user_id,
        u.name          AS matched_by_name,
        m.created_at
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_invoices     i ON i.id = m.invoice_id     AND i.company_id = @CompanyId
    INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
    LEFT  JOIN dbo.FP26_users        u ON u.id = m.matched_by_user_id
    ORDER BY m.created_at DESC;
END
GO
