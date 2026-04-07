-- ============================================================
-- TEMPORARY ALTER SCRIPT - Installment Payment Feature
-- Run this script in SSMS against: igroup104_test2
-- 
-- PURPOSE: Adds support for tracking installment payments
-- - Invoices can track payment plan metadata
-- - Matches can track which installment they represent
-- 
-- NOTE: This file can be deleted after running
-- ============================================================

USE igroup104_test2;
GO

PRINT '========================================';
PRINT 'Starting ALTER script for installment payments...';
PRINT '========================================';
GO

-- ============================================================
-- STEP 1: ALTER FP26_invoices TABLE
-- Add 5 new columns for payment plan metadata
-- ============================================================

PRINT 'Altering FP26_invoices table...';
GO

-- Check if columns already exist before adding
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoices') AND name = 'item_count')
BEGIN
    ALTER TABLE dbo.FP26_invoices
    ADD item_count INT NULL;
    PRINT '  ✓ Added item_count column';
END
ELSE
    PRINT '  ℹ item_count column already exists';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoices') AND name = 'payment_plan_total_installments')
BEGIN
    ALTER TABLE dbo.FP26_invoices
    ADD payment_plan_total_installments INT NULL;
    PRINT '  ✓ Added payment_plan_total_installments column';
END
ELSE
    PRINT '  ℹ payment_plan_total_installments column already exists';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoices') AND name = 'payment_plan_installment_amount')
BEGIN
    ALTER TABLE dbo.FP26_invoices
    ADD payment_plan_installment_amount DECIMAL(15,2) NULL;
    PRINT '  ✓ Added payment_plan_installment_amount column';
END
ELSE
    PRINT '  ℹ payment_plan_installment_amount column already exists';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoices') AND name = 'payment_plan_frequency')
BEGIN
    ALTER TABLE dbo.FP26_invoices
    ADD payment_plan_frequency VARCHAR(50) NULL;
    PRINT '  ✓ Added payment_plan_frequency column';
END
ELSE
    PRINT '  ℹ payment_plan_frequency column already exists';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoices') AND name = 'payment_plan_description')
BEGIN
    ALTER TABLE dbo.FP26_invoices
    ADD payment_plan_description VARCHAR(500) NULL;
    PRINT '  ✓ Added payment_plan_description column';
END
ELSE
    PRINT '  ℹ payment_plan_description column already exists';
GO

PRINT 'FP26_invoices table alterations complete.';
PRINT '';
GO

-- ============================================================
-- STEP 2: ALTER FP26_invoice_transaction_matches TABLE
-- Add 2 new columns for installment tracking
-- ============================================================

PRINT 'Altering FP26_invoice_transaction_matches table...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoice_transaction_matches') AND name = 'installment_number')
BEGIN
    ALTER TABLE dbo.FP26_invoice_transaction_matches
    ADD installment_number INT NULL;
    PRINT '  ✓ Added installment_number column';
END
ELSE
    PRINT '  ℹ installment_number column already exists';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoice_transaction_matches') AND name = 'installment_note')
BEGIN
    ALTER TABLE dbo.FP26_invoice_transaction_matches
    ADD installment_note VARCHAR(200) NULL;
    PRINT '  ✓ Added installment_note column';
END
ELSE
    PRINT '  ℹ installment_note column already exists';
GO

PRINT 'FP26_invoice_transaction_matches table alterations complete.';
PRINT '';
GO

-- ============================================================
-- STEP 3: ALTER FP26_sp_Invoices_Insert STORED PROCEDURE
-- Add parameters for payment plan metadata
-- ============================================================

PRINT 'Recreating FP26_sp_Invoices_Insert stored procedure...';
GO

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

PRINT '  ✓ FP26_sp_Invoices_Insert procedure recreated';
PRINT '';
GO

-- ============================================================
-- STEP 4: ALTER FP26_sp_Matches_Insert STORED PROCEDURE
-- Add parameters for installment tracking and accumulation logic
-- ============================================================

PRINT 'Recreating FP26_sp_Matches_Insert stored procedure...';
GO

IF OBJECT_ID('dbo.FP26_sp_Matches_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_Insert
    @InvoiceId        BIGINT,
    @TransactionId    BIGINT,
    @MatchedAmount    DECIMAL(15,2),
    @MatchMethod      VARCHAR(50),
    @MatchedByUserId  BIGINT       = NULL,
    @MatchType        VARCHAR(50)  = 'partial',
    @MatchConfidence  DECIMAL(5,4) = NULL,
    @MatchReason      VARCHAR(500) = NULL,
    @InstallmentNumber INT         = NULL,
    @InstallmentNote  VARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert the match record
        INSERT INTO dbo.FP26_invoice_transaction_matches
            (invoice_id, transaction_id, match_type, matched_amount,
             match_method, match_confidence, match_reason,
             matched_by_user_id, installment_number, installment_note,
             created_at, updated_at)
        VALUES
            (@InvoiceId, @TransactionId, @MatchType, @MatchedAmount,
             @MatchMethod, @MatchConfidence, @MatchReason,
             @MatchedByUserId, @InstallmentNumber, @InstallmentNote,
             GETDATE(), GETDATE());

        DECLARE @NewId BIGINT = SCOPE_IDENTITY();

        -- ACCUMULATE matched amount on invoice (supports installment payments)
        DECLARE @NewMatchedAmount DECIMAL(15,2);
        DECLARE @TotalAmount DECIMAL(15,2);
        
        UPDATE dbo.FP26_invoices
        SET matched_amount = matched_amount + @MatchedAmount,
            @NewMatchedAmount = matched_amount + @MatchedAmount,
            @TotalAmount = total_amount,
            updated_at = GETDATE()
        WHERE id = @InvoiceId;

        -- Set is_matched flag and status based on whether invoice is fully paid
        IF @NewMatchedAmount >= @TotalAmount
        BEGIN
            UPDATE dbo.FP26_invoices
            SET is_matched = 1, 
                status = 'fully_matched',
                updated_at = GETDATE()
            WHERE id = @InvoiceId;
        END
        ELSE
        BEGIN
            UPDATE dbo.FP26_invoices
            SET is_matched = 0,  -- Still partially matched
                status = 'partially_matched',
                updated_at = GETDATE()
            WHERE id = @InvoiceId;
        END

        -- Mark transaction as matched (transaction can only be used once)
        UPDATE dbo.FP26_transactions
        SET is_matched = 1, updated_at = GETDATE()
        WHERE id = @TransactionId;

        COMMIT TRANSACTION;
        SELECT @NewId AS id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT '  ✓ FP26_sp_Matches_Insert procedure recreated';
PRINT '';
GO

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================

PRINT '========================================';
PRINT 'ALTER script completed successfully!';
PRINT '';
PRINT 'Summary of changes:';
PRINT '  • FP26_invoices: +5 columns (payment plan metadata)';
PRINT '  • FP26_invoice_transaction_matches: +2 columns (installment tracking)';
PRINT '  • FP26_sp_Invoices_Insert: Updated with 5 new parameters';
PRINT '  • FP26_sp_Matches_Insert: Rewritten for installment support';
PRINT '';
PRINT 'This file can now be deleted.';
PRINT '========================================';
GO
