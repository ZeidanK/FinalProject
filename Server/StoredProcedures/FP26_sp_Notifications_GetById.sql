IF OBJECT_ID('dbo.FP26_sp_Notifications_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Notifications_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_Notifications_GetById
    @Id     BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT n.id, n.event_id, n.user_id, n.event_type, n.scope, n.title, n.body,
           n.severity, n.is_read, n.company_id, c.name AS company_name, n.link,
           n.target_type, n.target_id, n.created_at, n.read_at
    FROM dbo.FP26_notifications n
    LEFT JOIN dbo.FP26_companies c ON c.id = n.company_id
    WHERE n.id = @Id AND n.user_id = @UserId;
END
GO
