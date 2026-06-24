CREATE OR ALTER PROCEDURE dbo.FP26_sp_Notifications_Insert
    @UserId     BIGINT,
    @EventType  NVARCHAR(100),
    @Title      NVARCHAR(255),
    @Body       NVARCHAR(1000) = '',
    @Severity   NVARCHAR(20)   = 'info',
    @CompanyId  BIGINT         = NULL,
    @Link       NVARCHAR(500)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_notifications
        (user_id, event_type, title, body, severity, company_id, link, created_at)
    VALUES
        (@UserId, @EventType, @Title, @Body, @Severity, @CompanyId, @Link, GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
