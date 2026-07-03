IF OBJECT_ID('dbo.FP26_sp_Invoices_GetDuplicatesBySignature', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_GetDuplicatesBySignature;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_GetDuplicatesBySignature
    @CompanyId      BIGINT,
    @InvoiceNumber  NVARCHAR(255),
    @TotalAmount    DECIMAL(18, 2),
    @InvoiceDate    DATE,
    @IncludeDeleted BIT = 1,
    @CreatedBefore  DATETIME2 = NULL
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
        i.file_size,
        i.status,
        i.ai_extraction_confidence,
        i.ai_processed,
        i.is_verified,
        i.is_matched,
        i.matched_amount,
        i.last_four_digits_card,
        i.payment_plan_total_installments,
        i.payment_plan_installment_amount,
        i.payment_plan_frequency,
        i.payment_plan_description,
        i.uploaded_by_user_id,
        u.name AS uploaded_by_name,
        i.verified_by_user_id,
        i.is_duplicate,
        i.created_at,
        i.updated_at
    FROM dbo.FP26_invoices i
    LEFT JOIN dbo.FP26_users u ON u.id = i.uploaded_by_user_id
    WHERE i.company_id = @CompanyId
      AND i.invoice_number = @InvoiceNumber
      AND i.total_amount = @TotalAmount
      AND CONVERT(date, i.invoice_date) = @InvoiceDate
      AND (@IncludeDeleted = 1 OR i.status <> 'deleted')
      AND (@CreatedBefore IS NULL OR i.created_at <= @CreatedBefore)
    ORDER BY
        CASE WHEN i.status = 'deleted' THEN 1 ELSE 0 END,
        i.created_at ASC;
END
GO
