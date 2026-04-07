-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns invoices with VAT breakdown for a date range.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Reports_GetVATReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Reports_GetVATReport;
GO

CREATE PROCEDURE dbo.FP26_sp_Reports_GetVATReport
    @CompanyId  BIGINT,
    @StartDate  DATE = NULL,
    @EndDate    DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Summary
    SELECT
        ISNULL(SUM(subtotal),    0) AS total_subtotal,
        ISNULL(SUM(vat_amount),  0) AS total_vat,
        ISNULL(SUM(total_amount),0) AS total_amount,
        COUNT(*)                    AS invoice_count
    FROM dbo.FP26_invoices
    WHERE company_id = @CompanyId
      AND status    != 'rejected'
      AND (@StartDate IS NULL OR invoice_date >= @StartDate)
      AND (@EndDate   IS NULL OR invoice_date <= @EndDate);

    -- Line-level detail
    SELECT
        i.id,
        i.invoice_number,
        i.vendor_name,
        i.invoice_date,
        i.subtotal,
        i.vat_rate,
        i.vat_amount,
        i.total_amount,
        i.currency,
        i.status
    FROM dbo.FP26_invoices i
    WHERE i.company_id = @CompanyId
      AND i.status    != 'rejected'
      AND (@StartDate IS NULL OR i.invoice_date >= @StartDate)
      AND (@EndDate   IS NULL OR i.invoice_date <= @EndDate)
    ORDER BY i.invoice_date DESC;
END
GO
