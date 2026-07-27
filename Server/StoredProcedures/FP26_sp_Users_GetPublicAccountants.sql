IF OBJECT_ID('dbo.FP26_sp_Users_GetPublicAccountants', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_GetPublicAccountants;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_GetPublicAccountants
    @CompanyId BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.id, u.name, u.email, u.phone, u.profile_picture,
           uca.status AS request_status
    FROM dbo.FP26_users u
    LEFT JOIN dbo.FP26_user_company_access uca
        ON uca.user_id = u.id
       AND uca.company_id = @CompanyId
    WHERE u.role IN ('accountant', 'accountant_business_owner')
      AND u.is_active = 1
      AND (
        u.is_public = 1
        OR (
          @CompanyId IS NOT NULL
          AND uca.status = 'active'
        )
      )
    ORDER BY u.name;
END
GO
