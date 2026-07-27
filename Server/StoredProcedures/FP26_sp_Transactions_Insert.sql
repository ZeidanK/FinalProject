-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Single-row insert. For bulk imports, call this SP in a loop
-- from the C# DAL wrapped in a SqlTransaction.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Transactions_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_Insert
    @CompanyId         BIGINT,
    @TransactionDate   DATE,
    @Description       VARCHAR(MAX),
    @Amount            DECIMAL(15,2),
    @TransactionType   VARCHAR(50),
    @CreatedByUserId   BIGINT        = NULL,
    @PostedDate        DATE          = NULL,
    @Category          VARCHAR(100)  = NULL,
    @ReferenceNumber   VARCHAR(100)  = NULL,
    @VendorName        VARCHAR(255)  = NULL,
    @CardLast4         VARCHAR(4)    = NULL,
    @ChargeAmount      DECIMAL(15,2) = NULL,
    @ChargeCurrency    VARCHAR(3)    = NULL,
    @OriginalCurrency  VARCHAR(3)    = NULL,
    @ExchangeRate      DECIMAL(18,8) = NULL,
    @FileUploadId      BIGINT        = NULL,
    @RequiresInvoice   BIT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_transactions
        (company_id, transaction_date, posted_date,
         description, vendor_name, card_last4, amount, transaction_type,
         category, reference_number,
         charge_amount, charge_currency, original_currency, exchange_rate,
         requires_invoice, is_matched, is_anomaly, is_duplicate,
         status, created_by_user_id, file_upload_id, created_at, updated_at)
    VALUES
        (@CompanyId, @TransactionDate, @PostedDate,
         @Description, @VendorName, @CardLast4, @Amount, @TransactionType,
         @Category, @ReferenceNumber,
         @ChargeAmount, @ChargeCurrency, @OriginalCurrency, @ExchangeRate,
         ISNULL(@RequiresInvoice, 1), 0, 0, 0,
         'confirmed', @CreatedByUserId, @FileUploadId, GETDATE(), GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
GO