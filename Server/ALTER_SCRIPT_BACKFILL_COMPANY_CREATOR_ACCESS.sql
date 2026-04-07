-- ============================================================
-- Run this script in SSMS against your FinalProject database.
-- Purpose: backfill missing creator access rows for already-created companies
-- ============================================================

INSERT INTO dbo.FP26_user_company_access
    (user_id, company_id, access_level, status, granted_by_user_id, granted_at, created_at)
SELECT
    c.created_by_user_id,
    c.id,
    'full',
    'active',
    c.created_by_user_id,
    GETDATE(),
    GETDATE()
FROM dbo.FP26_companies c
LEFT JOIN dbo.FP26_user_company_access uca
    ON uca.user_id = c.created_by_user_id
   AND uca.company_id = c.id
WHERE c.created_by_user_id IS NOT NULL
  AND uca.id IS NULL;
GO
