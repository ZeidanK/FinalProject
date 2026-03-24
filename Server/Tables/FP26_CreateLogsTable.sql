-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateCompaniesTable.sql
-- Creates: FP26_system_logs, FP26_audit_logs
-- ============================================================

IF OBJECT_ID('dbo.FP26_audit_logs', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_audit_logs;
GO

IF OBJECT_ID('dbo.FP26_system_logs', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_system_logs;
GO

-- ── System Logs ───────────────────────────────────────────────
CREATE TABLE dbo.FP26_system_logs
(
    id          BIGINT          NOT NULL IDENTITY(1,1),
    level       VARCHAR(20)     NOT NULL DEFAULT 'info',
    category    VARCHAR(100)        NULL,
    message     VARCHAR(MAX)    NOT NULL,
    details     VARCHAR(MAX)        NULL,
    user_id     BIGINT              NULL,
    ip_address  VARCHAR(50)         NULL,
    user_agent  VARCHAR(500)        NULL,
    created_at  DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_system_logs PRIMARY KEY (id)
    -- No FK on user_id intentionally: logs must survive even if user is deleted
);
GO

-- ── Audit Logs ────────────────────────────────────────────────
CREATE TABLE dbo.FP26_audit_logs
(
    id           BIGINT          NOT NULL IDENTITY(1,1),
    user_id      BIGINT              NULL,
    company_id   BIGINT              NULL,
    action       VARCHAR(100)    NOT NULL,
    entity_type  VARCHAR(100)        NULL,
    entity_id    BIGINT              NULL,
    old_value    VARCHAR(MAX)        NULL,
    new_value    VARCHAR(MAX)        NULL,
    ip_address   VARCHAR(50)         NULL,
    created_at   DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_audit_logs PRIMARY KEY (id),
    CONSTRAINT FK_FP26_audit_logs_user    FOREIGN KEY (user_id)    REFERENCES dbo.FP26_users     (id) ON DELETE SET NULL,
    CONSTRAINT FK_FP26_audit_logs_company FOREIGN KEY (company_id) REFERENCES dbo.FP26_companies (id) ON DELETE SET NULL
);
GO
