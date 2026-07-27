-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns all active companies accessible to a given user.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Companies_GetByUserId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_GetByUserId;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_GetByUserId
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id,
        c.name,
        c.registration_number,
        c.street,
        c.city,
        c.state,
        c.postal_code,
        c.country,
        c.email,
        c.phone,
        c.tax_id,
        c.vat_number,
        c.fiscal_year_start,
        c.currency,
        c.is_active,
        c.created_by_user_id,
        u.name AS created_by_name,
        c.created_at,
        c.updated_at,
        uca.access_level,
        uca.status AS access_status
    FROM dbo.FP26_companies c
    INNER JOIN dbo.FP26_user_company_access uca
        ON uca.company_id = c.id
       AND uca.user_id    = @UserId
       AND uca.status     = 'active'
    LEFT JOIN dbo.FP26_users u ON u.id = c.created_by_user_id
    WHERE c.is_active = 1
    ORDER BY c.name;
END
GO
