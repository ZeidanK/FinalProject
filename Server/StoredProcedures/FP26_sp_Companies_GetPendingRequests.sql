IF OBJECT_ID('dbo.FP26_sp_Companies_GetPendingRequests', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_GetPendingRequests;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_GetPendingRequests
    @AccountantId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT uca.id,
           uca.company_id,
           c.name             AS company_name,
           uca.granted_by_user_id AS requested_by_user_id,
           COALESCE(u.name, 'Unknown') AS requested_by_name,
           uca.created_at,
           uca.status
    FROM dbo.FP26_user_company_access uca
    INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
    LEFT  JOIN dbo.FP26_users     u ON u.id = uca.granted_by_user_id
    WHERE uca.user_id = @AccountantId
      AND uca.status  = 'pending'
    ORDER BY uca.created_at DESC;
END
GO
