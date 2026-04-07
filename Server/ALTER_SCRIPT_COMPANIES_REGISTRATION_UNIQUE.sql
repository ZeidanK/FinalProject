-- ============================================================
-- Run this script in SSMS against your FinalProject database.
-- Purpose:
-- 1) Drop legacy unique constraint on registration_number (allows only one NULL)
-- 2) Create filtered unique index so non-NULL values stay unique and NULL is allowed many times
-- ============================================================

-- Drop legacy unique constraint if it exists
IF EXISTS (
    SELECT 1
    FROM sys.key_constraints kc
    WHERE kc.name = 'UQ_FP26_companies_registration'
      AND kc.parent_object_id = OBJECT_ID('dbo.FP26_companies')
)
BEGIN
    ALTER TABLE dbo.FP26_companies
        DROP CONSTRAINT UQ_FP26_companies_registration;
END
GO

-- Drop index with same target if it already exists (recreate idempotently)
IF EXISTS (
    SELECT 1
    FROM sys.indexes i
    WHERE i.name = 'IX_FP26_companies_registration_not_null'
      AND i.object_id = OBJECT_ID('dbo.FP26_companies')
)
BEGIN
    DROP INDEX IX_FP26_companies_registration_not_null
        ON dbo.FP26_companies;
END
GO

-- Keep uniqueness only for provided registration numbers
CREATE UNIQUE INDEX IX_FP26_companies_registration_not_null
    ON dbo.FP26_companies (registration_number)
    WHERE registration_number IS NOT NULL;
GO
