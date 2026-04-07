-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Cleanup: Remove duplicate / unwanted columns that ended up
--          in FP26_transactions from previous migration runs.
-- Safe to re-run (all drops are guarded).
-- ============================================================

-- Step 1: Drop card_last_4 (duplicate of card_last4)
IF COL_LENGTH('dbo.FP26_transactions', 'card_last_4') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN card_last_4;
    PRINT 'Dropped column card_last_4';
END
GO

-- Step 2: Drop original_amount (not in spec; value of transaction = amount)
IF COL_LENGTH('dbo.FP26_transactions', 'original_amount') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN original_amount;
    PRINT 'Dropped column original_amount';
END
GO

-- Step 3: Drop charge_date (duplicate of posted_date = date of billing)
IF COL_LENGTH('dbo.FP26_transactions', 'charge_date') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN charge_date;
    PRINT 'Dropped column charge_date';
END
GO

-- Step 4: Drop notes
IF COL_LENGTH('dbo.FP26_transactions', 'notes') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN notes;
    PRINT 'Dropped column notes';
END
GO

-- Step 5: Drop tags_raw
IF COL_LENGTH('dbo.FP26_transactions', 'tags_raw') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN tags_raw;
    PRINT 'Dropped column tags_raw';
END
GO

-- Step 6: Drop discount_club
IF COL_LENGTH('dbo.FP26_transactions', 'discount_club') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN discount_club;
    PRINT 'Dropped column discount_club';
END
GO

-- Step 7: Drop discount_key
IF COL_LENGTH('dbo.FP26_transactions', 'discount_key') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN discount_key;
    PRINT 'Dropped column discount_key';
END
GO

-- Step 8: Drop payment_method
IF COL_LENGTH('dbo.FP26_transactions', 'payment_method') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FP26_transactions DROP COLUMN payment_method;
    PRINT 'Dropped column payment_method';
END
GO

-- Verification: show final column list
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
