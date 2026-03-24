-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns invoice + all its line items.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Invoices_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_GetById
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- Invoice header
    SELECT
        i.id,
        i.company_id,
        i.invoice_number,
        i.vendor_name,
        i.vendor_tax_id,
        i.invoice_date,
        i.due_date,
        i.payment_date,
        i.subtotal,
        i.vat_rate,
        i.vat_amount,
        i.total_amount,
        i.currency,
        i.file_original_name,
        i.file_path,
        i.file_type,
        i.file_size,
        i.status,
        i.ai_extraction_confidence,
        i.ai_processed,
        i.is_verified,
        i.is_matched,
        i.matched_amount,
        i.last_four_digits_card,
        i.uploaded_by_user_id,
        i.verified_by_user_id,
        i.created_at,
        i.updated_at
    FROM dbo.FP26_invoices i
    WHERE i.id = @Id;

    -- Line items (second result set)
    SELECT
        li.id,
        li.invoice_id,
        li.line_number,
        li.description,
        li.category,
        li.quantity,
        li.unit_price,
        li.vat_rate,
        li.total_amount,
        li.ai_confidence_score
    FROM dbo.FP26_invoice_line_items li
    WHERE li.invoice_id = @Id
    ORDER BY li.line_number;
END
GO
