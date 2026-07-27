-- Add is_public flag to users table for accountant visibility feature
-- Run this script once against the target database.
-- Default is 0 (private) so all existing accountants start as private.

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.FP26_users')
      AND name = 'is_public'
)
BEGIN
    ALTER TABLE dbo.FP26_users
    ADD is_public BIT NOT NULL DEFAULT 0;
END
