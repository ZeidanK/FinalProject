-- ============================================================
-- Accounts-payable aging as of a historical date.
-- Payments are recognized by their bank transaction date so later
-- matches do not alter an earlier aging snapshot.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Reports_GetPayablesAging', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Reports_GetPayablesAging;
GO

CREATE PROCEDURE dbo.FP26_sp_Reports_GetPayablesAging
    @CompanyId BIGINT,
    @AsOfDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH InvoiceBalances AS
    (
        SELECT
            i.id,
            i.invoice_number,
            i.vendor_name,
            i.invoice_date,
            i.due_date,
            COALESCE(i.due_date, i.invoice_date) AS effective_due_date,
            DATEDIFF(DAY, COALESCE(i.due_date, i.invoice_date), @AsOfDate) AS days_past_due,
            i.total_amount,
            ISNULL(payments.matched_amount, 0) AS matched_amount,
            CASE
                WHEN i.total_amount - ISNULL(payments.matched_amount, 0) > 0
                    THEN i.total_amount - ISNULL(payments.matched_amount, 0)
                ELSE 0
            END AS outstanding_amount,
            i.currency
        FROM dbo.FP26_invoices i
        OUTER APPLY
        (
            SELECT SUM(m.matched_amount) AS matched_amount
            FROM dbo.FP26_invoice_transaction_matches m
            INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
            WHERE m.invoice_id = i.id
              AND t.company_id = @CompanyId
              AND t.transaction_date <= @AsOfDate
              AND ISNULL(t.is_duplicate, 0) = 0
        ) payments
        WHERE i.company_id = @CompanyId
          AND i.invoice_date <= @AsOfDate
          AND i.status <> 'deleted'
          AND ISNULL(i.is_duplicate, 0) = 0
    )
    SELECT
        id AS invoice_id,
        invoice_number,
        vendor_name,
        invoice_date,
        due_date,
        effective_due_date,
        days_past_due,
        CASE
            WHEN days_past_due <= 0 THEN 'current'
            WHEN days_past_due <= 30 THEN '1_30'
            WHEN days_past_due <= 60 THEN '31_60'
            WHEN days_past_due <= 90 THEN '61_90'
            ELSE '91_plus'
        END AS bucket_key,
        CASE
            WHEN days_past_due <= 0 THEN 'Current'
            WHEN days_past_due <= 30 THEN '1-30 days'
            WHEN days_past_due <= 60 THEN '31-60 days'
            WHEN days_past_due <= 90 THEN '61-90 days'
            ELSE '91+ days'
        END AS bucket_label,
        total_amount AS original_amount,
        matched_amount,
        outstanding_amount,
        currency,
        CASE WHEN matched_amount > 0 THEN 'partially_paid' ELSE 'unpaid' END AS payment_status
    FROM InvoiceBalances
    WHERE outstanding_amount > 0
    ORDER BY days_past_due DESC, effective_due_date, id;
END
GO
