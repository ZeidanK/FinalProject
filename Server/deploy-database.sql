-- ============================================================
-- deploy-database.sql
-- Run this script in SSMS against: igroup104_test2
--
-- Fixes the FP26_sp_UploadJobs_Update stored procedure
-- by removing SET NOCOUNT ON + SELECT @@ROWCOUNT which
-- cause ExecuteNonQuery() to always return -1.
--
-- Also ensures the FP26_transactions table has the
-- columns that the SPs expect.
-- ============================================================

PRINT '============================================';
PRINT '  Step 1: Fix FP26_sp_UploadJobs_Update';
PRINT '============================================';
GO

IF OBJECT_ID('dbo.FP26_sp_UploadJobs_Update', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_UploadJobs_Update;
GO

CREATE PROCEDURE dbo.FP26_sp_UploadJobs_Update
    @Id                    BIGINT,
    @Status                VARCHAR(50) = NULL,
    @ProgressPercent       INT = NULL,
    @ResultJson            NVARCHAR(MAX) = NULL,
    @ErrorMessage          NVARCHAR(MAX) = NULL,
    @HangfireJobId         VARCHAR(255) = NULL,
    @CompletedAt           DATETIME2 = NULL,
    @ExpectedCurrentStatus VARCHAR(50) = NULL
AS
BEGIN
    UPDATE dbo.FP26_upload_jobs
    SET
        status = COALESCE(@Status, status),
        progress_percent = CASE
            WHEN @ProgressPercent IS NOT NULL THEN @ProgressPercent
            WHEN @Status = 'processing' AND progress_percent < 5 THEN 5
            ELSE progress_percent
        END,
        result_json = COALESCE(@ResultJson, result_json),
        error_message = CASE
            WHEN @ErrorMessage IS NOT NULL THEN @ErrorMessage
            WHEN @Status IN ('processing', 'completed', 'verifying') THEN NULL
            ELSE error_message
        END,
        hangfire_job_id = COALESCE(@HangfireJobId, hangfire_job_id),
        completed_at = COALESCE(@CompletedAt, completed_at),
        updated_at = GETDATE()
    WHERE id = @Id
      AND (@ExpectedCurrentStatus IS NULL OR status = @ExpectedCurrentStatus);
END
GO

PRINT 'FP26_sp_UploadJobs_Update recreated successfully.';
GO

PRINT '';
PRINT '============================================';
PRINT '  Step 2: Ensure transactions table schema';
PRINT '============================================';
GO

-- Drop bank-account FK constraint (if exists)
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_FP26_transactions_bank_account'
      AND parent_object_id = OBJECT_ID('dbo.FP26_transactions')
)
BEGIN
    ALTER TABLE dbo.FP26_transactions
        DROP CONSTRAINT FK_FP26_transactions_bank_account;
    PRINT 'Dropped FK_FP26_transactions_bank_account';
END
GO

-- Drop bank_account_id column
IF COL_LENGTH('dbo.FP26_transactions', 'bank_account_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN bank_account_id;
    PRINT 'Dropped column bank_account_id';
END
GO

-- Drop balance_after column
IF COL_LENGTH('dbo.FP26_transactions', 'balance_after') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN balance_after;
    PRINT 'Dropped column balance_after';
END
GO

-- Add vendor_name (was missing from DDL but referenced in SPs)
IF COL_LENGTH('dbo.FP26_transactions', 'vendor_name') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD vendor_name VARCHAR(255) NULL;
    PRINT 'Added column vendor_name';
END
GO

-- Add card_last4
IF COL_LENGTH('dbo.FP26_transactions', 'card_last4') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD card_last4 VARCHAR(4) NULL;
    PRINT 'Added column card_last4';
END
GO

-- Add charge_amount
IF COL_LENGTH('dbo.FP26_transactions', 'charge_amount') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD charge_amount DECIMAL(15,2) NULL;
    PRINT 'Added column charge_amount';
END
GO

-- Add charge_currency
IF COL_LENGTH('dbo.FP26_transactions', 'charge_currency') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD charge_currency VARCHAR(10) NULL;
    PRINT 'Added column charge_currency';
END
GO

-- Add original_currency
IF COL_LENGTH('dbo.FP26_transactions', 'original_currency') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD original_currency VARCHAR(10) NULL;
    PRINT 'Added column original_currency';
END
GO

-- Add exchange_rate
IF COL_LENGTH('dbo.FP26_transactions', 'exchange_rate') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD exchange_rate DECIMAL(15,6) NULL;
    PRINT 'Added column exchange_rate';
END
GO

-- Add is_anomaly
IF COL_LENGTH('dbo.FP26_transactions', 'is_anomaly') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD is_anomaly BIT NOT NULL DEFAULT 0;
    PRINT 'Added column is_anomaly';
END
GO

-- Drop duplicate columns from previous migration runs
IF COL_LENGTH('dbo.FP26_transactions', 'card_last_4') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN card_last_4;
    PRINT 'Dropped column card_last_4';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'original_amount') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN original_amount;
    PRINT 'Dropped column original_amount';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'charge_date') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN charge_date;
    PRINT 'Dropped column charge_date';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'notes') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN notes;
    PRINT 'Dropped column notes';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'tags_raw') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN tags_raw;
    PRINT 'Dropped column tags_raw';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'discount_club') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN discount_club;
    PRINT 'Dropped column discount_club';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'discount_key') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN discount_key;
    PRINT 'Dropped column discount_key';
END
GO

IF COL_LENGTH('dbo.FP26_transactions', 'payment_method') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN payment_method;
    PRINT 'Dropped column payment_method';
END
GO

PRINT '';
PRINT '============================================';
PRINT '  Step 3: Verification';
PRINT '============================================';
GO

PRINT '';
PRINT '--- Stored procedures matching pattern FP26_sp_% ---';
SELECT name AS 'Stored Procedures' FROM sys.procedures WHERE name LIKE 'FP26_sp_%' ORDER BY name;

PRINT '';
PRINT '--- FP26_transactions columns ---';
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'FP26_transactions'
ORDER BY ORDINAL_POSITION;
GO
