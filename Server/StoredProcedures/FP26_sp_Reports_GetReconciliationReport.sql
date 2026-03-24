-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns invoices LEFT JOINed to their match + transaction.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Reports_GetReconciliationReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Reports_GetReconciliationReport;
GO

CREATE PROCEDURE dbo.FP26_sp_Reports_GetReconciliationReport
    @CompanyId  BIGINT,
    @StartDate  DATE = NULL,
    @EndDate    DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        i.id                        AS invoice_id,
        i.invoice_number,
        i.vendor_name,
        i.invoice_date,
        i.total_amount              AS invoice_amount,
        i.status                    AS invoice_status,
        i.is_matched,
        m.id                        AS match_id,
        m.matched_amount,
        m.match_method,
        m.match_confidence,
        t.id                        AS transaction_id,
        t.transaction_date,
        t.description               AS transaction_description,
        t.amount                    AS transaction_amount,
        t.transaction_type
    FROM dbo.FP26_invoices i
    LEFT JOIN dbo.FP26_invoice_transaction_matches m ON m.invoice_id     = i.id
    LEFT JOIN dbo.FP26_transactions                t ON t.id             = m.transaction_id
    WHERE i.company_id = @CompanyId
      AND (@StartDate IS NULL OR i.invoice_date >= @StartDate)
      AND (@EndDate   IS NULL OR i.invoice_date <= @EndDate)
    ORDER BY i.invoice_date DESC;
END
GO
