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
      AND (
          (@View = 'personal' AND scope = 'personal') OR
          (@View = 'company' AND scope = 'company' AND company_id = @CompanyId) OR
          (@View = 'combined')
      );

    SELECT @@ROWCOUNT AS updated;
END
