-- Persistent in-app notifications per user
IF NOT EXISTS (
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.FP26_notifications') AND type = 'U'
)
BEGIN
    CREATE TABLE dbo.FP26_notifications (
        id            BIGINT         IDENTITY(1,1) PRIMARY KEY,
        user_id       BIGINT         NOT NULL,
        event_type    NVARCHAR(100)  NOT NULL,
        title         NVARCHAR(255)  NOT NULL,
        body          NVARCHAR(1000) NOT NULL DEFAULT '',
        severity      NVARCHAR(20)   NOT NULL DEFAULT 'info',   -- info | success | warning | error
        is_read       BIT            NOT NULL DEFAULT 0,
        company_id    BIGINT         NULL,
        link          NVARCHAR(500)  NULL,
        created_at    DATETIME       NOT NULL DEFAULT GETDATE(),
        read_at       DATETIME       NULL,

        CONSTRAINT FK_FP26_notifications_user
            FOREIGN KEY (user_id) REFERENCES dbo.FP26_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IX_FP26_notifications_user_created
        ON dbo.FP26_notifications(user_id, created_at DESC);

    CREATE INDEX IX_FP26_notifications_user_unread
        ON dbo.FP26_notifications(user_id, is_read)
        WHERE is_read = 0;
END
