IF OBJECT_ID('dbo.FP26_sp_Companies_GetActiveByAccountant', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_GetActiveByAccountant;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_GetActiveByAccountant
    @AccountantId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.*, uca.access_level, u.name AS created_by_name
    FROM dbo.FP26_user_company_access uca
    INNER JOIN dbo.FP26_companies c ON c.id = uca.company_id
    LEFT  JOIN dbo.FP26_users     u ON u.id = c.created_by_user_id
    WHERE uca.user_id = @AccountantId
      AND uca.status  = 'active'
      AND c.is_active = 1
    ORDER BY c.name;
END
GO
