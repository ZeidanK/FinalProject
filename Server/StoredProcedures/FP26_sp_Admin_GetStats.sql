-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- System-wide counts across all major tables.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_GetStats', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_GetStats;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_GetStats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM dbo.FP26_users)                         AS total_users,
        (SELECT COUNT(*) FROM dbo.FP26_users        WHERE is_active = 1) AS active_users,
        (SELECT COUNT(*) FROM dbo.FP26_companies)                     AS total_companies,
        (SELECT COUNT(*) FROM dbo.FP26_companies    WHERE is_active = 1) AS active_companies,
        (SELECT COUNT(*) FROM dbo.FP26_invoices)                      AS total_invoices,
        (SELECT COUNT(*) FROM dbo.FP26_transactions)                  AS total_transactions,
        (SELECT COUNT(*) FROM dbo.FP26_invoice_transaction_matches)   AS total_matches,
        (SELECT COUNT(*) FROM dbo.FP26_anomalies WHERE status = 'open') AS open_anomalies;
END
GO
