-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Adds is_duplicate column to FP26_invoices and replaces the
-- simple UNIQUE constraint with a filtered unique index so that
-- duplicate-flagged invoices can share an invoice_number while
-- the original invoice number per company remains unique.
-- ============================================================

-- 1. Add the is_duplicate column (idempotent)
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.FP26_invoices')
      AND name = 'is_duplicate'
)
BEGIN
    ALTER TABLE dbo.FP26_invoices
        ADD is_duplicate BIT NOT NULL DEFAULT 0;
END
GO

-- 2. Drop the old blanket unique constraint if it still exists
IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.FP26_invoices')
      AND name = 'UQ_FP26_invoices_number'
)
BEGIN
    ALTER TABLE dbo.FP26_invoices
        DROP CONSTRAINT UQ_FP26_invoices_number;
END
GO

-- 3. Create a filtered unique index that enforces uniqueness
--    only for non-duplicate invoices (is_duplicate = 0).
--    Duplicate-flagged invoices (is_duplicate = 1) bypass this index.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.FP26_invoices')
      AND name = 'UIX_FP26_invoices_number_nodupe'
)
BEGIN
    CREATE UNIQUE INDEX UIX_FP26_invoices_number_nodupe
        ON dbo.FP26_invoices (company_id, invoice_number)
        WHERE is_duplicate = 0;
END
GO
