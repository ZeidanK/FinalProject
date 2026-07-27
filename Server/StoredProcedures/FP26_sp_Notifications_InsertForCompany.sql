CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_InsertForCompany
    @CompanyId BIGINT,
    @EventId UNIQUEIDENTIFIER,
    @EventType NVARCHAR(100),
    @Title NVARCHAR(255),
    @Body NVARCHAR(1000) = '',
    @Severity NVARCHAR(20) = 'info',
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
        (event_id, user_id, event_type, scope, title, body, severity, company_id,
         link, target_type, target_id, dedupe_key, created_at)
    SELECT @EventId, uca.user_id, @EventType, 'company', @Title, @Body, @Severity,
           @CompanyId, @Link, @TargetType, @TargetId, @DedupeKey, SYSUTCDATETIME()
    FROM dbo.FP26_user_company_access uca
    INNER JOIN dbo.FP26_users u ON u.id = uca.user_id AND u.is_active = 1
    INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id AND c.is_active = 1
    WHERE uca.company_id = @CompanyId
      AND uca.status = 'active'
      AND (uca.expires_at IS NULL OR uca.expires_at > SYSUTCDATETIME())
      AND (@ExcludeUserId IS NULL OR uca.user_id <> @ExcludeUserId)
      AND (@ExcludeUserId2 IS NULL OR uca.user_id <> @ExcludeUserId2)
      AND (@DedupeKey IS NULL OR NOT EXISTS (
          SELECT 1 FROM dbo.FP26_notifications n
          WHERE n.user_id = uca.user_id AND n.dedupe_key = @DedupeKey
      ));

    SELECT n.id, n.event_id, n.user_id, n.event_type, n.scope, n.title, n.body,
           n.severity, n.is_read, n.company_id, c.name AS company_name, n.link,
           n.target_type, n.target_id, n.created_at, n.read_at
    FROM dbo.FP26_notifications n
    LEFT JOIN dbo.FP26_companies c ON c.id = n.company_id
    WHERE n.company_id = @CompanyId
      AND ((@DedupeKey IS NOT NULL AND n.dedupe_key = @DedupeKey) OR n.event_id = @EventId)
      AND (@ExcludeUserId IS NULL OR n.user_id <> @ExcludeUserId)
      AND (@ExcludeUserId2 IS NULL OR n.user_id <> @ExcludeUserId2);
END
