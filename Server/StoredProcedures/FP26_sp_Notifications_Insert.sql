CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_Insert
    @UserId     BIGINT,
    @EventId    UNIQUEIDENTIFIER,
    @EventType  NVARCHAR(100),
    @Scope      VARCHAR(20) = 'personal',
    @Title      NVARCHAR(255),
    @Body       NVARCHAR(1000) = '',
    @Severity   NVARCHAR(20)   = 'info',
    @CompanyId  BIGINT         = NULL,
    @Link       NVARCHAR(500)  = NULL,
    @TargetType VARCHAR(50)    = NULL,
    @TargetId   NVARCHAR(100)  = NULL,
    @DedupeKey  NVARCHAR(200)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @DedupeKey IS NOT NULL
       AND EXISTS (SELECT 1 FROM dbo.FP26_notifications WHERE user_id = @UserId AND dedupe_key = @DedupeKey)
    BEGIN
        SELECT id FROM dbo.FP26_notifications WHERE user_id = @UserId AND dedupe_key = @DedupeKey;
        RETURN;
    END

    INSERT INTO dbo.FP26_notifications
        (event_id, user_id, event_type, scope, title, body, severity, company_id,
         link, target_type, target_id, dedupe_key, created_at)
    VALUES
        (@EventId, @UserId, @EventType, @Scope, @Title, @Body, @Severity, @CompanyId,
         @Link, @TargetType, @TargetId, @DedupeKey, SYSUTCDATETIME());

    SELECT SCOPE_IDENTITY() AS id;

END
