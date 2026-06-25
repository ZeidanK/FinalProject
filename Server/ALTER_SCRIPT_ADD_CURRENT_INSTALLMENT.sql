-- ============================================================
-- Run this script in SSMS against: igroup104_test2
--
-- Adds payment_plan_current_installment column to invoices table
-- ============================================================

PRINT '========================================';
PRINT 'Adding payment_plan_current_installment column...';
PRINT '========================================';

-- Add current_installment column to FP26_invoices
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FP26_invoices') AND name = 'payment_plan_current_installment')
BEGIN
    ALTER TABLE dbo.FP26_invoices
    ADD payment_plan_current_installment INT NULL;

    PRINT '  ✓ Added payment_plan_current_installment column';
END
ELSE
    PRINT '  ℹ payment_plan_current_installment column already exists';
GO

PRINT '';
PRINT 'Done!';
GO