-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns 4 aggregate result sets for the company dashboard.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Reports_GetDashboardStats', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Reports_GetDashboardStats;
GO

CREATE PROCEDURE dbo.FP26_sp_Reports_GetDashboardStats
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Invoice stats
    SELECT
        COUNT(*)                                          AS total_invoices,
        COUNT(CASE WHEN is_matched  = 1 THEN 1 END)      AS matched_invoices,
        COUNT(CASE WHEN is_matched  = 0 THEN 1 END)      AS unmatched_invoices,
        COUNT(CASE WHEN status = 'uploaded'   THEN 1 END) AS uploaded_invoices,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) AS processing_invoices,
        ISNULL(SUM(total_amount), 0)                      AS total_invoice_amount,
        ISNULL(AVG(total_amount), 0)                      AS avg_invoice_amount
    FROM dbo.FP26_invoices
    WHERE company_id = @CompanyId;

    -- 2. Transaction stats
    SELECT
        COUNT(*)                                         AS total_transactions,
        COUNT(CASE WHEN is_matched = 1 THEN 1 END)       AS matched_transactions,
        COUNT(CASE WHEN is_matched = 0 THEN 1 END)       AS unmatched_transactions,
        ISNULL(SUM(ABS(amount)), 0)                      AS total_transaction_volume,
        ISNULL(SUM(CASE WHEN transaction_type = 'debit'  THEN ABS(amount) ELSE 0 END), 0) AS total_debits,
        ISNULL(SUM(CASE WHEN transaction_type = 'credit' THEN ABS(amount) ELSE 0 END), 0) AS total_credits
    FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId;

    -- 3. Anomaly stats
    SELECT
        COUNT(*)                                              AS total_anomalies,
        COUNT(CASE WHEN status   = 'open'     THEN 1 END)    AS open_anomalies,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END)    AS critical_anomalies,
        COUNT(CASE WHEN status   = 'resolved' THEN 1 END)    AS resolved_anomalies
    FROM dbo.FP26_anomalies
    WHERE company_id = @CompanyId;

    -- 4. Match stats
    SELECT
        COUNT(*)                          AS total_matches,
        ISNULL(SUM(m.matched_amount), 0)  AS total_matched_amount
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_invoices i ON i.id = m.invoice_id AND i.company_id = @CompanyId;
END
GO
