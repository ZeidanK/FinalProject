-- ============================================================
-- Activity logging deployment script.
-- Creates logging tables if needed and installs admin read/write procedures.
-- This script preserves existing log rows.
-- ============================================================

IF OBJECT_ID('dbo.FP26_system_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_system_logs
    (
        id          BIGINT       NOT NULL IDENTITY(1,1),
        level       VARCHAR(20)  NOT NULL DEFAULT 'INFO',
        category    VARCHAR(100) NULL,
        message     VARCHAR(MAX) NOT NULL,
        details     VARCHAR(MAX) NULL,
        user_id     BIGINT       NULL,
        ip_address  VARCHAR(50)  NULL,
        user_agent  VARCHAR(500) NULL,
        created_at  DATETIME2    NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_FP26_system_logs PRIMARY KEY (id)
    );
END
GO

IF OBJECT_ID('dbo.FP26_audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_audit_logs
    (
        id           BIGINT       NOT NULL IDENTITY(1,1),
        user_id      BIGINT       NULL,
        company_id   BIGINT       NULL,
        action       VARCHAR(100) NOT NULL,
        entity_type  VARCHAR(100) NULL,
        entity_id    BIGINT       NULL,
        old_value    VARCHAR(MAX) NULL,
        new_value    VARCHAR(MAX) NULL,
        ip_address   VARCHAR(50)  NULL,
        created_at   DATETIME2    NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_FP26_audit_logs PRIMARY KEY (id)
    );
END
GO

IF COL_LENGTH('dbo.FP26_system_logs', 'user_agent') IS NULL
    ALTER TABLE dbo.FP26_system_logs ADD user_agent VARCHAR(500) NULL;
GO

IF OBJECT_ID('dbo.FP26_sp_SystemLogs_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_SystemLogs_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_SystemLogs_Insert
    @Level     VARCHAR(20),
    @Category  VARCHAR(100) = NULL,
    @Message   VARCHAR(MAX),
    @Details   VARCHAR(MAX) = NULL,
    @UserId    BIGINT = NULL,
    @IpAddress VARCHAR(50) = NULL,
    @UserAgent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_system_logs
        (level, category, message, details, user_id, ip_address, user_agent)
    VALUES
        (@Level, @Category, @Message, @Details, @UserId, @IpAddress, @UserAgent);
END
GO

IF OBJECT_ID('dbo.FP26_sp_AuditLogs_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AuditLogs_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_AuditLogs_Insert
    @UserId     BIGINT = NULL,
    @CompanyId  BIGINT = NULL,
    @Action     VARCHAR(100),
    @EntityType VARCHAR(100) = NULL,
    @EntityId   BIGINT = NULL,
    @OldValue   VARCHAR(MAX) = NULL,
    @NewValue   VARCHAR(MAX) = NULL,
    @IpAddress  VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @UserId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.FP26_users WHERE id = @UserId)
        SET @UserId = NULL;

    IF @CompanyId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.FP26_companies WHERE id = @CompanyId)
        SET @CompanyId = NULL;

    INSERT INTO dbo.FP26_audit_logs
        (user_id, company_id, action, entity_type, entity_id, old_value, new_value, ip_address)
    VALUES
        (@UserId, @CompanyId, @Action, @EntityType, @EntityId, @OldValue, @NewValue, @IpAddress);
END
GO

IF OBJECT_ID('dbo.FP26_sp_Admin_GetLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_GetLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_GetLogs
    @Page     INT          = 1,
    @Limit    INT          = 50,
    @Level    VARCHAR(20)  = NULL,
    @Category VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS total_count
    FROM dbo.FP26_system_logs
    WHERE (@Level IS NULL OR UPPER(level) = UPPER(@Level))
      AND (@Category IS NULL OR category = @Category);

    SELECT
        id,
        level,
        category,
        message,
        details,
        user_id,
        ip_address,
        user_agent,
        created_at
    FROM dbo.FP26_system_logs
    WHERE (@Level IS NULL OR UPPER(level) = UPPER(@Level))
      AND (@Category IS NULL OR category = @Category)
    ORDER BY created_at DESC
    OFFSET (@Page - 1) * @Limit ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.FP26_sp_Admin_ClearSystemLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_ClearSystemLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_ClearSystemLogs
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeletedCount INT;

    DELETE FROM dbo.FP26_system_logs;
    SET @DeletedCount = @@ROWCOUNT;

    SELECT @DeletedCount AS deleted_count;
END
GO

IF OBJECT_ID('dbo.FP26_sp_Admin_DeleteSystemLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_DeleteSystemLog;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_DeleteSystemLog
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeletedCount INT;

    DELETE FROM dbo.FP26_system_logs
    WHERE id = @Id;

    SET @DeletedCount = @@ROWCOUNT;
    SELECT @DeletedCount AS deleted_count;
END
GO

IF OBJECT_ID('dbo.FP26_sp_Admin_GetAuditLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_GetAuditLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_GetAuditLogs
    @Page      INT    = 1,
    @Limit     INT    = 50,
    @CompanyId BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS total_count
    FROM dbo.FP26_audit_logs
    WHERE (@CompanyId IS NULL OR company_id = @CompanyId)
      AND action NOT LIKE '%/api/realtime/%'
      AND action NOT LIKE '%/api/Notifications%';

    SELECT
        al.id,
        al.user_id,
        u.name AS user_name,
        al.company_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.ip_address,
        al.created_at
    FROM dbo.FP26_audit_logs al
    LEFT JOIN dbo.FP26_users u ON u.id = al.user_id
    WHERE (@CompanyId IS NULL OR al.company_id = @CompanyId)
      AND al.action NOT LIKE '%/api/realtime/%'
      AND al.action NOT LIKE '%/api/Notifications%'
    ORDER BY al.created_at DESC
    OFFSET (@Page - 1) * @Limit ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO

IF OBJECT_ID('dbo.FP26_sp_Admin_DeleteAuditLog', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_DeleteAuditLog;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_DeleteAuditLog
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeletedCount INT;

    DELETE FROM dbo.FP26_audit_logs
    WHERE id = @Id;

    SET @DeletedCount = @@ROWCOUNT;
    SELECT @DeletedCount AS deleted_count;
END
GO

IF OBJECT_ID('dbo.FP26_sp_Admin_ClearAuditLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_ClearAuditLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_ClearAuditLogs
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeletedCount INT;

    DELETE FROM dbo.FP26_audit_logs;
    SET @DeletedCount = @@ROWCOUNT;

    SELECT @DeletedCount AS deleted_count;
END
GO
