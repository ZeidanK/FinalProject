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
           c.name                  AS company_name,
           uca.granted_by_user_id  AS requested_by_user_id,
           COALESCE(u.name, 'Unknown') AS requested_by_name,
           u.email                 AS owner_email,
           u.phone                 AS owner_phone,
           u.profile_picture       AS owner_profile_picture,
           c.email                 AS company_email,
           c.phone                 AS company_phone,
           c.street                AS company_street,
           c.city                  AS company_city,
           c.state                 AS company_state,
           c.country               AS company_country,
           c.registration_number   AS company_registration_number,
           c.tax_id                AS company_tax_id,
           c.website               AS company_website,
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
