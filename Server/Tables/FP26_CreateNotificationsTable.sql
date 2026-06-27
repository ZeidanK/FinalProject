-- Persistent in-app notifications per user
IF NOT EXISTS (
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.FP26_notifications (
        id            BIGINT         IDENTITY(1,1) PRIMARY KEY,
        event_id      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        user_id       BIGINT         NOT NULL,
        event_type    NVARCHAR(100)  NOT NULL,
        scope         VARCHAR(20)    NOT NULL DEFAULT 'personal',
        title         NVARCHAR(255)  NOT NULL,
        body          NVARCHAR(1000) NOT NULL DEFAULT '',
        severity      NVARCHAR(20)   NOT NULL DEFAULT 'info',   -- info | success | warning | error
        is_read       BIT            NOT NULL DEFAULT 0,
        company_id    BIGINT         NULL,
        link          NVARCHAR(500)  NULL,
        target_type   VARCHAR(50)    NULL,
        target_id     NVARCHAR(100)  NULL,
        dedupe_key    NVARCHAR(200)  NULL,
        created_at    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        read_at       DATETIME2      NULL,

        CONSTRAINT FK_FP26_notifications_user
            FOREIGN KEY (user_id) REFERENCES dbo.FP26_users(id) ON DELETE CASCADE,
        CONSTRAINT CK_FP26_notifications_scope
            CHECK (scope IN ('personal', 'company')),
        CONSTRAINT CK_FP26_notifications_severity
            CHECK (severity IN ('info', 'success', 'warning', 'error'))
    );

    CREATE INDEX IX_FP26_notifications_user_created
        ON dbo.FP26_notifications(user_id, created_at DESC);

    CREATE INDEX IX_FP26_notifications_user_unread
        ON dbo.FP26_notifications(user_id, scope, company_id, created_at DESC, id DESC)
        WHERE is_read = 0;

    CREATE UNIQUE INDEX UX_FP26_notifications_user_dedupe
        ON dbo.FP26_notifications(user_id, dedupe_key)
        WHERE dedupe_key IS NOT NULL;
END
