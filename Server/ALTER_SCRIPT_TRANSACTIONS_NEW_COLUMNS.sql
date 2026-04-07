-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Migration: Restructure FP26_transactions
--   - Remove bank_account_id (no longer used)
--   - Remove balance_after   (no longer used)
--   - Fix: add vendor_name if not already present
--   - Add: card_last4, charge_amount, charge_currency,
--           original_currency, exchange_rate, is_anomaly
-- Safe to re-run (all changes are guarded).
-- ============================================================

-- Step 1: Drop the bank-account FK constraint (if it exists)
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

-- Step 2: Drop bank_account_id column
IF COL_LENGTH('dbo.FP26_transactions', 'bank_account_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN bank_account_id;
    PRINT 'Dropped column bank_account_id';
END
GO

-- Step 3: Drop balance_after column
IF COL_LENGTH('dbo.FP26_transactions', 'balance_after') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN balance_after;
    PRINT 'Dropped column balance_after';
END
GO

-- Step 4: Add vendor_name (was missing from DDL but referenced in SPs)
IF COL_LENGTH('dbo.FP26_transactions', 'vendor_name') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD vendor_name VARCHAR(255) NULL;
    PRINT 'Added column vendor_name';
END
GO

-- Step 5: Add card_last4
IF COL_LENGTH('dbo.FP26_transactions', 'card_last4') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD card_last4 VARCHAR(4) NULL;
    PRINT 'Added column card_last4';
END
GO

-- Step 6: Add charge_amount
IF COL_LENGTH('dbo.FP26_transactions', 'charge_amount') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD charge_amount DECIMAL(15,2) NULL;
    PRINT 'Added column charge_amount';
END
GO

-- Step 7: Add charge_currency
IF COL_LENGTH('dbo.FP26_transactions', 'charge_currency') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD charge_currency VARCHAR(10) NULL;
    PRINT 'Added column charge_currency';
END
GO

-- Step 8: Add original_currency
IF COL_LENGTH('dbo.FP26_transactions', 'original_currency') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD original_currency VARCHAR(10) NULL;
    PRINT 'Added column original_currency';
END
GO

-- Step 9: Add exchange_rate
IF COL_LENGTH('dbo.FP26_transactions', 'exchange_rate') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD exchange_rate DECIMAL(15,6) NULL;
    PRINT 'Added column exchange_rate';
END
GO

-- Step 10: Add is_anomaly
IF COL_LENGTH('dbo.FP26_transactions', 'is_anomaly') IS NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions ADD is_anomaly BIT NOT NULL DEFAULT 0;
    PRINT 'Added column is_anomaly';
END
GO

-- Verification
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'FP26_transactions'
ORDER BY ORDINAL_POSITION;
GO
