-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns unmatched transactions in the same company as the
-- invoice where ABS(amount - invoice total) < 10.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Matches_GetSuggestionsForInvoice', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_GetSuggestionsForInvoice;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_GetSuggestionsForInvoice
    @InvoiceId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.id,
        t.transaction_date,
        t.description,
        t.amount,
        t.transaction_type,
        t.reference_number,
        ABS(t.amount - i.total_amount) AS amount_difference
    FROM dbo.FP26_transactions t
    INNER JOIN dbo.FP26_invoices i
        ON i.id         = @InvoiceId
       AND i.company_id = t.company_id
    WHERE t.is_matched = 0
      AND ABS(t.amount - i.total_amount) < 10
    ORDER BY amount_difference ASC;
END
GO
