-- Run once before deploying the hardened notification API.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.FP26_notifications', 'event_id') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD event_id UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('dbo.FP26_notifications', 'scope') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD scope VARCHAR(20) NULL;
IF COL_LENGTH('dbo.FP26_notifications', 'target_type') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD target_type VARCHAR(50) NULL;
IF COL_LENGTH('dbo.FP26_notifications', 'target_id') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD target_id NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.FP26_notifications', 'dedupe_key') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD dedupe_key NVARCHAR(200) NULL;

UPDATE dbo.FP26_notifications
SET event_id = NEWID()
WHERE event_id IS NULL;

UPDATE dbo.FP26_notifications
SET scope = CASE
    WHEN event_type IN (
        'accountant.request.sent', 'admin.user.active_toggled',
        'uploadjob.completed', 'uploadjob.failed'
    ) THEN 'personal'
    WHEN event_type = 'accountant.connection.disconnected'
         AND NOT EXISTS (
             SELECT 1 FROM dbo.FP26_user_company_access uca
             WHERE uca.user_id = FP26_notifications.user_id
               AND uca.company_id = FP26_notifications.company_id
               AND uca.status = 'active'
         ) THEN 'personal'
    ELSE 'company'
END
WHERE scope IS NULL;

;WITH duplicate_rows AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, event_type, company_id, title, body,
                            DATEDIFF(MINUTE, 0, created_at)
               ORDER BY id
           ) AS row_number
    FROM dbo.FP26_notifications
    WHERE event_type IN ('accountant.request.accepted', 'accountant.request.declined')
)
DELETE FROM duplicate_rows WHERE row_number > 1;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FP26_notifications_user_created' AND object_id = OBJECT_ID('dbo.FP26_notifications'))
    DROP INDEX IX_FP26_notifications_user_created ON dbo.FP26_notifications;

ALTER TABLE dbo.FP26_notifications ALTER COLUMN event_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE dbo.FP26_notifications ALTER COLUMN scope VARCHAR(20) NOT NULL;
ALTER TABLE dbo.FP26_notifications ALTER COLUMN created_at DATETIME2 NOT NULL;
ALTER TABLE dbo.FP26_notifications ALTER COLUMN read_at DATETIME2 NULL;

DECLARE @CreatedAtDefault SYSNAME;
DECLARE @DropCreatedAtDefaultSql NVARCHAR(MAX);
SELECT @CreatedAtDefault = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns col
    ON col.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.FP26_notifications')
  AND col.name = 'created_at';
IF @CreatedAtDefault IS NOT NULL
BEGIN
    SET @DropCreatedAtDefaultSql = N'ALTER TABLE dbo.FP26_notifications DROP CONSTRAINT '
        + QUOTENAME(@CreatedAtDefault) + N';';
    EXEC sys.sp_executesql @DropCreatedAtDefaultSql;
END
ALTER TABLE dbo.FP26_notifications
    ADD CONSTRAINT DF_FP26_notifications_created_at DEFAULT SYSUTCDATETIME() FOR created_at;

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_FP26_notifications_event_id')
    ALTER TABLE dbo.FP26_notifications ADD CONSTRAINT DF_FP26_notifications_event_id DEFAULT NEWID() FOR event_id;
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_FP26_notifications_scope')
    ALTER TABLE dbo.FP26_notifications ADD CONSTRAINT DF_FP26_notifications_scope DEFAULT 'personal' FOR scope;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_FP26_notifications_scope')
    ALTER TABLE dbo.FP26_notifications ADD CONSTRAINT CK_FP26_notifications_scope CHECK (scope IN ('personal', 'company'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_FP26_notifications_severity')
    ALTER TABLE dbo.FP26_notifications ADD CONSTRAINT CK_FP26_notifications_severity CHECK (severity IN ('info', 'success', 'warning', 'error'));

CREATE INDEX IX_FP26_notifications_user_created
    ON dbo.FP26_notifications(user_id, created_at DESC, id DESC);

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FP26_notifications_user_unread' AND object_id = OBJECT_ID('dbo.FP26_notifications'))
    DROP INDEX IX_FP26_notifications_user_unread ON dbo.FP26_notifications;
CREATE INDEX IX_FP26_notifications_user_unread
    ON dbo.FP26_notifications(user_id, scope, company_id, created_at DESC, id DESC)
    WHERE is_read = 0;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_FP26_notifications_user_dedupe' AND object_id = OBJECT_ID('dbo.FP26_notifications'))
    CREATE UNIQUE INDEX UX_FP26_notifications_user_dedupe
        ON dbo.FP26_notifications(user_id, dedupe_key)
        WHERE dedupe_key IS NOT NULL;

COMMIT TRANSACTION;

-- Execute the updated notification stored-procedure scripts after this migration.
