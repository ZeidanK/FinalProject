-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_InvoiceLineItems_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_InvoiceLineItems_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_InvoiceLineItems_Insert
    @InvoiceId          BIGINT,
    @Description        VARCHAR(MAX),
    @UnitPrice          DECIMAL(15,2),
    @TotalAmount        DECIMAL(15,2),
    @LineNumber         INT           = NULL,
    @Category           VARCHAR(100)  = NULL,
    @Quantity           DECIMAL(10,2) = 1,
    @VatRate            DECIMAL(5,2)  = NULL,
    @AiConfidenceScore  DECIMAL(5,4)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_invoice_line_items
        (invoice_id, line_number, description, category,
         quantity, unit_price, vat_rate, total_amount,
         ai_confidence_score, created_at)
    VALUES
        (@InvoiceId, @LineNumber, @Description, @Category,
         @Quantity, @UnitPrice, @VatRate, @TotalAmount,
         @AiConfidenceScore, GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
GO
