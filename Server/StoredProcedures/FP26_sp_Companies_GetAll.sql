-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Companies_GetAll', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_GetAll;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_GetAll
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
        c.updated_at
    FROM dbo.FP26_companies c
    LEFT JOIN dbo.FP26_users u ON u.id = c.created_by_user_id
    WHERE c.is_active = 1
    ORDER BY c.name;
END
GO
