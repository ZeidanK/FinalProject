-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Invoices_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_Insert
    @CompanyId          BIGINT,
    @InvoiceNumber      VARCHAR(100),
    @VendorName         VARCHAR(255),
    @InvoiceDate        DATE,
    @TotalAmount        DECIMAL(15,2),
    @UploadedByUserId   BIGINT        = NULL,
    @VendorTaxId        VARCHAR(100)  = NULL,
    @DueDate            DATE          = NULL,
    @PaymentDate        DATE          = NULL,
    @Subtotal           DECIMAL(15,2) = 0,
    @VatRate            DECIMAL(5,2)  = NULL,
    @VatAmount          DECIMAL(15,2) = NULL,
    @Currency           VARCHAR(3)    = 'USD',
    @FileOriginalName   VARCHAR(500)  = NULL,
    @FilePath           VARCHAR(1000) = NULL,
    @FileType           VARCHAR(50)   = NULL,
    @FileSize           BIGINT        = NULL,
    @AiExtractionConfidence DECIMAL(5,4) = NULL,
    @LastFourDigitsCard VARCHAR(4)    = NULL,
    @ItemCount          INT           = NULL,
    @PaymentPlanTotalInstallments INT = NULL,
    @PaymentPlanInstallmentAmount DECIMAL(15,2) = NULL,
    @PaymentPlanFrequency VARCHAR(50) = NULL,
    @PaymentPlanDescription VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_invoices
        (company_id, invoice_number, vendor_name, vendor_tax_id,
         invoice_date, due_date, payment_date,
         subtotal, vat_rate, vat_amount, total_amount, currency,
         file_original_name, file_path, file_type, file_size,
         status, ai_extraction_confidence, ai_processed,
         is_verified, is_matched, matched_amount,
         last_four_digits_card, item_count,
         payment_plan_total_installments, payment_plan_installment_amount,
         payment_plan_frequency, payment_plan_description,
         uploaded_by_user_id,
         created_at, updated_at)
    VALUES
        (@CompanyId, @InvoiceNumber, @VendorName, @VendorTaxId,
         @InvoiceDate, @DueDate, @PaymentDate,
         @Subtotal, @VatRate, @VatAmount, @TotalAmount, @Currency,
         @FileOriginalName, @FilePath, @FileType, @FileSize,
         'uploaded', @AiExtractionConfidence, 0,
         0, 0, 0,
         @LastFourDigitsCard, @ItemCount,
         @PaymentPlanTotalInstallments, @PaymentPlanInstallmentAmount,
         @PaymentPlanFrequency, @PaymentPlanDescription,
         @UploadedByUserId,
         GETDATE(), GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
GO
