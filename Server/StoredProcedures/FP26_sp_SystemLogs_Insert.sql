-- ============================================================
-- Inserts a system log event.
-- ============================================================

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
