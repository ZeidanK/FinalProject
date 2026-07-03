IF OBJECT_ID('dbo.FP26_sp_Invoices_UpdateWithLineItems', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_UpdateWithLineItems;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_UpdateWithLineItems
    @Id                              BIGINT,
    @CompanyId                       BIGINT,
    @InvoiceNumber                   NVARCHAR(255),
    @VendorName                      NVARCHAR(255),
    @InvoiceDate                     DATE,
    @TotalAmount                     DECIMAL(18, 2),
    @VendorTaxId                     NVARCHAR(50) = NULL,
    @DueDate                         DATE = NULL,
    @PaymentDate                     DATE = NULL,
    @Subtotal                        DECIMAL(18, 2),
    @VatRate                         DECIMAL(5, 2) = NULL,
    @VatAmount                       DECIMAL(18, 2) = NULL,
    @Currency                        VARCHAR(10),
    @FileOriginalName                VARCHAR(255) = NULL,
    @FilePath                        VARCHAR(500) = NULL,
    @FileType                        VARCHAR(50) = NULL,
    @FileSize                        BIGINT = NULL,
    @AiExtractionConfidence          DECIMAL(5, 2) = NULL,
    @LastFourDigitsCard              VARCHAR(4) = NULL,
    @ItemCount                       INT = NULL,
    @PaymentPlanTotalInstallments    INT = NULL,
    @PaymentPlanInstallmentAmount    DECIMAL(18, 2) = NULL,
    @PaymentPlanFrequency            VARCHAR(50) = NULL,
    @PaymentPlanDescription          NVARCHAR(MAX) = NULL,
    @PaymentPlanCurrentInstallment   INT = NULL,
    @VerifiedByUserId                BIGINT = NULL,
    @LineItemsJson                   NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_invoices
    SET
        company_id = @CompanyId,
        invoice_number = @InvoiceNumber,
        vendor_name = @VendorName,
        invoice_date = @InvoiceDate,
        total_amount = @TotalAmount,
        vendor_tax_id = @VendorTaxId,
        due_date = @DueDate,
        payment_date = @PaymentDate,
        subtotal = @Subtotal,
        vat_rate = @VatRate,
        vat_amount = @VatAmount,
        currency = @Currency,
        file_original_name = @FileOriginalName,
        file_path = @FilePath,
        file_type = @FileType,
        file_size = @FileSize,
        ai_extraction_confidence = @AiExtractionConfidence,
        ai_processed = CASE WHEN @AiExtractionConfidence IS NULL THEN ai_processed ELSE 1 END,
        last_four_digits_card = @LastFourDigitsCard,
        item_count = @ItemCount,
        payment_plan_total_installments = @PaymentPlanTotalInstallments,
        payment_plan_installment_amount = @PaymentPlanInstallmentAmount,
        payment_plan_frequency = @PaymentPlanFrequency,
        payment_plan_description = @PaymentPlanDescription,
        payment_plan_current_installment = @PaymentPlanCurrentInstallment,
        verified_by_user_id = COALESCE(@VerifiedByUserId, verified_by_user_id),
        is_verified = 1,
        status = CASE WHEN status = 'matched' THEN status ELSE 'verified' END,
        updated_at = GETDATE()
    WHERE id = @Id;

    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 0;
        RETURN;
    END

    DELETE FROM dbo.FP26_invoice_line_items WHERE invoice_id = @Id;

    IF @LineItemsJson IS NOT NULL AND @LineItemsJson <> ''
    BEGIN
        INSERT INTO dbo.FP26_invoice_line_items
            (invoice_id, line_number, description, category, quantity, unit_price, vat_rate, total_amount, ai_confidence_score)
        SELECT
            @Id,
            JSON_VALUE(value, '$.lineNumber') AS line_number,
            JSON_VALUE(value, '$.description') AS description,
            JSON_VALUE(value, '$.category') AS category,
            ISNULL(CAST(JSON_VALUE(value, '$.quantity') AS DECIMAL(18, 2)), 1),
            CAST(JSON_VALUE(value, '$.unitPrice') AS DECIMAL(18, 2)),
            CAST(JSON_VALUE(value, '$.vatRate') AS DECIMAL(5, 2)),
            CAST(JSON_VALUE(value, '$.totalAmount') AS DECIMAL(18, 2)),
            CAST(JSON_VALUE(value, '$.aiConfidenceScore') AS DECIMAL(5, 2))
        FROM OPENJSON(@LineItemsJson);
    END

    SELECT 1;
END
GO
