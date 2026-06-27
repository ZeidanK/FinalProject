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
    SET @Take = CASE WHEN @Take < 1 THEN 1 WHEN @Take > 101 THEN 101 ELSE @Take END;

    SELECT TOP (@Take)
        n.id, n.event_id, n.user_id, n.event_type, n.scope, n.title, n.body,
        n.severity, n.is_read, n.company_id, c.name AS company_name, n.link,
        n.target_type, n.target_id, n.created_at, n.read_at
    FROM dbo.FP26_notifications n
    LEFT JOIN dbo.FP26_companies c ON c.id = n.company_id
    WHERE n.user_id = @UserId
      AND (
          (@View = 'personal' AND n.scope = 'personal') OR
          (@View = 'company' AND n.scope = 'company' AND n.company_id = @CompanyId) OR
          (@View = 'combined')
      )
      AND (
          @CursorCreatedAt IS NULL OR n.created_at < @CursorCreatedAt OR
          (n.created_at = @CursorCreatedAt AND n.id < @CursorId)
      )
    ORDER BY n.created_at DESC, n.id DESC;

    SELECT
        COALESCE(SUM(CASE WHEN is_read = 0 AND scope = 'personal' THEN 1 ELSE 0 END), 0) AS personal_unread,
        COALESCE(SUM(CASE WHEN is_read = 0 AND scope = 'company' AND company_id = @CompanyId THEN 1 ELSE 0 END), 0) AS company_unread,
        COALESCE(SUM(CASE WHEN is_read = 0 AND (
            (@View = 'personal' AND scope = 'personal') OR
            (@View = 'company' AND scope = 'company' AND company_id = @CompanyId) OR
            (@View = 'combined')
        ) THEN 1 ELSE 0 END), 0) AS visible_unread
    FROM dbo.FP26_notifications
    WHERE user_id = @UserId;
END
