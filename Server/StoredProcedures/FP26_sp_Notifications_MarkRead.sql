CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_MarkRead
    @Id     BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_notifications
    SET is_read = 1,
        read_at = GETDATE()
    WHERE id      = @Id
      AND user_id = @UserId
      AND is_read = 0;

    SELECT @@ROWCOUNT AS updated;
END
