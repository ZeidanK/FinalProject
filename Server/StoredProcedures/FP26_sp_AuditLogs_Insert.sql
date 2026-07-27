-- ============================================================
-- Inserts an audit log event.
-- ============================================================

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
