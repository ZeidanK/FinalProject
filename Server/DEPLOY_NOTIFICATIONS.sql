/*
    Notification deployment/repair script for SQL Server and SSMS.

    Run this entire file. The GO separators intentionally force SQL Server to
    refresh table metadata before compiling the stored procedures.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.FP26_notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_notifications
    (
        id          BIGINT            IDENTITY(1,1) NOT NULL,
        event_id    UNIQUEIDENTIFIER  NOT NULL CONSTRAINT DF_FP26_notifications_event_id DEFAULT NEWID(),
        user_id     BIGINT            NOT NULL,
        event_type  NVARCHAR(100)     NOT NULL,
        scope       VARCHAR(20)       NOT NULL CONSTRAINT DF_FP26_notifications_scope DEFAULT 'personal',
        title       NVARCHAR(255)     NOT NULL,
        body        NVARCHAR(1000)    NOT NULL CONSTRAINT DF_FP26_notifications_body DEFAULT N'',
        severity    NVARCHAR(20)      NOT NULL CONSTRAINT DF_FP26_notifications_severity DEFAULT N'info',
        is_read     BIT               NOT NULL CONSTRAINT DF_FP26_notifications_is_read DEFAULT 0,
        company_id  BIGINT            NULL,
        link        NVARCHAR(500)     NULL,
        target_type VARCHAR(50)       NULL,
        target_id   NVARCHAR(100)     NULL,
        dedupe_key  NVARCHAR(200)     NULL,
        created_at  DATETIME2         NOT NULL CONSTRAINT DF_FP26_notifications_created_at DEFAULT SYSUTCDATETIME(),
        read_at     DATETIME2         NULL,
        CONSTRAINT PK_FP26_notifications PRIMARY KEY (id),
        CONSTRAINT FK_FP26_notifications_user
            FOREIGN KEY (user_id) REFERENCES dbo.FP26_users(id) ON DELETE CASCADE
    );
END;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'event_id') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD event_id UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'scope') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD scope VARCHAR(20) NULL;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'target_type') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD target_type VARCHAR(50) NULL;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'target_id') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD target_id NVARCHAR(100) NULL;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'dedupe_key') IS NULL
    ALTER TABLE dbo.FP26_notifications ADD dedupe_key NVARCHAR(200) NULL;
GO

UPDATE dbo.FP26_notifications
SET event_id = NEWID()
WHERE event_id IS NULL;
GO

UPDATE n
SET scope = CASE
    WHEN n.event_type IN
    (
        N'accountant.request.sent',
        N'admin.user.active_toggled',
        N'uploadjob.completed',
        N'uploadjob.failed'
    ) THEN 'personal'
    WHEN n.event_type = N'accountant.connection.disconnected'
         AND NOT EXISTS
         (
             SELECT 1
             FROM dbo.FP26_user_company_access AS uca
             WHERE uca.user_id = n.user_id
               AND uca.company_id = n.company_id
               AND uca.status = 'active'
         ) THEN 'personal'
    ELSE 'company'
END
FROM dbo.FP26_notifications AS n
WHERE n.scope IS NULL;
GO

UPDATE dbo.FP26_notifications
SET severity = N'info'
WHERE severity NOT IN (N'info', N'success', N'warning', N'error');
GO

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'event_id'
      AND is_nullable = 1
)
    ALTER TABLE dbo.FP26_notifications ALTER COLUMN event_id UNIQUEIDENTIFIER NOT NULL;
GO

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'scope'
      AND is_nullable = 1
)
    ALTER TABLE dbo.FP26_notifications ALTER COLUMN scope VARCHAR(20) NOT NULL;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS col
        ON col.object_id = dc.parent_object_id
       AND col.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND col.name = N'event_id'
)
    ALTER TABLE dbo.FP26_notifications
        ADD CONSTRAINT DF_FP26_notifications_event_id DEFAULT NEWID() FOR event_id;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS col
        ON col.object_id = dc.parent_object_id
       AND col.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND col.name = N'scope'
)
    ALTER TABLE dbo.FP26_notifications
        ADD CONSTRAINT DF_FP26_notifications_scope DEFAULT 'personal' FOR scope;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'CK_FP26_notifications_scope'
)
    ALTER TABLE dbo.FP26_notifications
        ADD CONSTRAINT CK_FP26_notifications_scope
        CHECK (scope IN ('personal', 'company'));
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'CK_FP26_notifications_severity'
)
    ALTER TABLE dbo.FP26_notifications
        ADD CONSTRAINT CK_FP26_notifications_severity
        CHECK (severity IN (N'info', N'success', N'warning', N'error'));
GO

;WITH duplicate_rows AS
(
    SELECT
        id,
        ROW_NUMBER() OVER
        (
            PARTITION BY
                user_id,
                event_type,
                company_id,
                title,
                body,
                DATEDIFF(MINUTE, CONVERT(DATETIME2, '20000101'), created_at)
            ORDER BY id
        ) AS duplicate_number
    FROM dbo.FP26_notifications
    WHERE event_type IN
    (
        N'accountant.request.accepted',
        N'accountant.request.declined'
    )
)
DELETE FROM duplicate_rows
WHERE duplicate_number > 1;
GO

IF EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'IX_FP26_notifications_user_created'
)
    DROP INDEX IX_FP26_notifications_user_created ON dbo.FP26_notifications;

CREATE INDEX IX_FP26_notifications_user_created
    ON dbo.FP26_notifications(user_id, created_at DESC, id DESC);
GO

IF EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'IX_FP26_notifications_user_unread'
)
    DROP INDEX IX_FP26_notifications_user_unread ON dbo.FP26_notifications;

CREATE INDEX IX_FP26_notifications_user_unread
    ON dbo.FP26_notifications(user_id, scope, company_id, created_at DESC, id DESC)
    WHERE is_read = 0;
GO

IF EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications')
      AND name = N'UX_FP26_notifications_user_dedupe'
)
    DROP INDEX UX_FP26_notifications_user_dedupe ON dbo.FP26_notifications;

CREATE UNIQUE INDEX UX_FP26_notifications_user_dedupe
    ON dbo.FP26_notifications(user_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'event_id') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'scope') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'target_type') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'target_id') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'dedupe_key') IS NULL
BEGIN
    THROW 51000, 'Notification schema repair failed. Stored procedures were not installed.', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_Insert
    @UserId BIGINT,
    @EventId UNIQUEIDENTIFIER,
    @EventType NVARCHAR(100),
    @Scope VARCHAR(20) = 'personal',
    @Title NVARCHAR(255),
    @Body NVARCHAR(1000) = N'',
    @Severity NVARCHAR(20) = N'info',
    @CompanyId BIGINT = NULL,
    @Link NVARCHAR(500) = NULL,
    @TargetType VARCHAR(50) = NULL,
    @TargetId NVARCHAR(100) = NULL,
    @DedupeKey NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @DedupeKey IS NOT NULL
       AND EXISTS
       (
           SELECT 1
           FROM dbo.FP26_notifications
           WHERE user_id = @UserId
             AND dedupe_key = @DedupeKey
       )
    BEGIN
        SELECT id
        FROM dbo.FP26_notifications
        WHERE user_id = @UserId
          AND dedupe_key = @DedupeKey;
        RETURN;
    END;

    INSERT INTO dbo.FP26_notifications
    (
        event_id, user_id, event_type, scope, title, body, severity,
        company_id, link, target_type, target_id, dedupe_key, created_at
    )
    VALUES
    (
        @EventId, @UserId, @EventType, @Scope, @Title, @Body, @Severity,
        @CompanyId, @Link, @TargetType, @TargetId, @DedupeKey, SYSUTCDATETIME()
    );

    SELECT CONVERT(BIGINT, SCOPE_IDENTITY()) AS id;
END;
GO

CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_InsertForCompany
    @CompanyId BIGINT,
    @EventId UNIQUEIDENTIFIER,
    @EventType NVARCHAR(100),
    @Title NVARCHAR(255),
    @Body NVARCHAR(1000) = N'',
    @Severity NVARCHAR(20) = N'info',
    @Link NVARCHAR(500) = NULL,
    @TargetType VARCHAR(50) = NULL,
    @TargetId NVARCHAR(100) = NULL,
    @DedupeKey NVARCHAR(200) = NULL,
    @ExcludeUserId BIGINT = NULL,
    @ExcludeUserId2 BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_notifications
    (
        event_id, user_id, event_type, scope, title, body, severity,
        company_id, link, target_type, target_id, dedupe_key, created_at
    )
    SELECT
        @EventId,
        uca.user_id,
        @EventType,
        'company',
        @Title,
        @Body,
        @Severity,
        @CompanyId,
        @Link,
        @TargetType,
        @TargetId,
        @DedupeKey,
        SYSUTCDATETIME()
    FROM dbo.FP26_user_company_access AS uca
    INNER JOIN dbo.FP26_users AS u
        ON u.id = uca.user_id
       AND u.is_active = 1
    INNER JOIN dbo.FP26_companies AS c
        ON c.id = uca.company_id
       AND c.is_active = 1
    WHERE uca.company_id = @CompanyId
      AND uca.status = 'active'
      AND (uca.expires_at IS NULL OR uca.expires_at > SYSUTCDATETIME())
      AND (@ExcludeUserId IS NULL OR uca.user_id <> @ExcludeUserId)
      AND (@ExcludeUserId2 IS NULL OR uca.user_id <> @ExcludeUserId2)
      AND
      (
          @DedupeKey IS NULL
          OR NOT EXISTS
          (
              SELECT 1
              FROM dbo.FP26_notifications AS n
              WHERE n.user_id = uca.user_id
                AND n.dedupe_key = @DedupeKey
          )
      );

    SELECT
        n.id,
        n.event_id,
        n.user_id,
        n.event_type,
        n.scope,
        n.title,
        n.body,
        n.severity,
        n.is_read,
        n.company_id,
        c.name AS company_name,
        n.link,
        n.target_type,
        n.target_id,
        n.created_at,
        n.read_at
    FROM dbo.FP26_notifications AS n
    LEFT JOIN dbo.FP26_companies AS c
        ON c.id = n.company_id
    WHERE n.company_id = @CompanyId
      AND
      (
          (@DedupeKey IS NOT NULL AND n.dedupe_key = @DedupeKey)
          OR n.event_id = @EventId
      )
      AND (@ExcludeUserId IS NULL OR n.user_id <> @ExcludeUserId)
      AND (@ExcludeUserId2 IS NULL OR n.user_id <> @ExcludeUserId2);
END;
GO

CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_GetInbox
    @UserId BIGINT,
    @View VARCHAR(20) = 'combined',
    @CompanyId BIGINT = NULL,
    @CursorCreatedAt DATETIME2 = NULL,
    @CursorId BIGINT = NULL,
    @Take INT = 26
AS
BEGIN
    SET NOCOUNT ON;

    SET @Take = CASE
        WHEN @Take < 1 THEN 1
        WHEN @Take > 101 THEN 101
        ELSE @Take
    END;

    SELECT TOP (@Take)
        n.id,
        n.event_id,
        n.user_id,
        n.event_type,
        n.scope,
        n.title,
        n.body,
        n.severity,
        n.is_read,
        n.company_id,
        c.name AS company_name,
        n.link,
        n.target_type,
        n.target_id,
        n.created_at,
        n.read_at
    FROM dbo.FP26_notifications AS n
    LEFT JOIN dbo.FP26_companies AS c
        ON c.id = n.company_id
    WHERE n.user_id = @UserId
      AND
      (
          (@View = 'personal' AND n.scope = 'personal')
          OR (@View = 'company' AND n.scope = 'company' AND n.company_id = @CompanyId)
          OR @View = 'combined'
      )
      AND
      (
          @CursorCreatedAt IS NULL
          OR n.created_at < @CursorCreatedAt
          OR (n.created_at = @CursorCreatedAt AND n.id < @CursorId)
      )
    ORDER BY n.created_at DESC, n.id DESC;

    SELECT
        COALESCE(SUM(CASE
            WHEN is_read = 0 AND scope = 'personal' THEN 1 ELSE 0 END), 0) AS personal_unread,
        COALESCE(SUM(CASE
            WHEN is_read = 0 AND scope = 'company' AND company_id = @CompanyId THEN 1 ELSE 0 END), 0) AS company_unread,
        COALESCE(SUM(CASE
            WHEN is_read = 0 AND
            (
                (@View = 'personal' AND scope = 'personal')
                OR (@View = 'company' AND scope = 'company' AND company_id = @CompanyId)
                OR @View = 'combined'
            ) THEN 1 ELSE 0 END), 0) AS visible_unread
    FROM dbo.FP26_notifications
    WHERE user_id = @UserId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_MarkRead
    @Id BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_notifications
    SET is_read = 1,
        read_at = SYSUTCDATETIME()
    WHERE id = @Id
      AND user_id = @UserId
      AND is_read = 0;

    SELECT @@ROWCOUNT AS updated;
END;
GO

CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_MarkAllRead
    @UserId BIGINT,
    @View VARCHAR(20) = 'combined',
    @CompanyId BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_notifications
    SET is_read = 1,
        read_at = SYSUTCDATETIME()
    WHERE user_id = @UserId
      AND is_read = 0
      AND
      (
          (@View = 'personal' AND scope = 'personal')
          OR (@View = 'company' AND scope = 'company' AND company_id = @CompanyId)
          OR @View = 'combined'
      );

    SELECT @@ROWCOUNT AS updated;
END;
GO

IF COL_LENGTH(N'dbo.FP26_notifications', N'event_id') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'scope') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'target_type') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'target_id') IS NULL
   OR COL_LENGTH(N'dbo.FP26_notifications', N'dedupe_key') IS NULL
   OR OBJECT_ID(N'dbo.FP26_sp_Notifications_Insert', N'P') IS NULL
   OR OBJECT_ID(N'dbo.FP26_sp_Notifications_InsertForCompany', N'P') IS NULL
   OR OBJECT_ID(N'dbo.FP26_sp_Notifications_GetInbox', N'P') IS NULL
   OR OBJECT_ID(N'dbo.FP26_sp_Notifications_MarkRead', N'P') IS NULL
   OR OBJECT_ID(N'dbo.FP26_sp_Notifications_MarkAllRead', N'P') IS NULL
BEGIN
    THROW 51001, 'Notification deployment is incomplete. Review the first error in the SSMS Messages tab.', 1;
END;

PRINT N'Notification schema and stored procedures deployed successfully.';
GO
