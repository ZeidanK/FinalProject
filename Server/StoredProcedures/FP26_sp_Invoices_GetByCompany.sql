-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Invoices_GetByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_GetByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_GetByCompany
    @CompanyId  BIGINT,
    @Status     VARCHAR(50) = NULL,
    @StartDate  DATE        = NULL,
    @EndDate    DATE        = NULL,
    @IsMatched  BIT         = NULL
AS
BEGIN
    SET NOCOUNT ON;

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
        i.status,
        i.ai_processed,
        i.is_verified,
        i.is_matched,
        i.matched_amount,
        i.payment_plan_total_installments,
        i.payment_plan_installment_amount,
        i.payment_plan_frequency,
        i.payment_plan_description,
        i.uploaded_by_user_id,
        u.name AS uploaded_by_name,
        i.is_duplicate,
        i.created_at,
        i.updated_at
    FROM dbo.FP26_invoices i
    LEFT JOIN dbo.FP26_users u ON u.id = i.uploaded_by_user_id
    WHERE i.company_id = @CompanyId
      AND (@Status    IS NULL OR i.status     = @Status)
      AND (@StartDate IS NULL OR i.invoice_date >= @StartDate)
      AND (@EndDate   IS NULL OR i.invoice_date <= @EndDate)
      AND (@IsMatched IS NULL OR i.is_matched  = @IsMatched)
    ORDER BY i.invoice_date DESC;
END
GO
