-- ============================================================
-- Run this script in SSMS against your FinalProject database.
-- Removes the website column from FP26_companies and FP26_users
-- after the code changes have been deployed.
-- ============================================================

-- Drop from companies table
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FP26_companies' AND COLUMN_NAME = 'website')
    ALTER TABLE dbo.FP26_companies DROP COLUMN website;

-- Drop from users table
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FP26_users' AND COLUMN_NAME = 'website')
    ALTER TABLE dbo.FP26_users DROP COLUMN website;

GO
