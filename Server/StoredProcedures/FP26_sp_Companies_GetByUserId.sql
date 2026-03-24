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
        c.city,
        c.country,
        c.currency,
        c.is_active,
        uca.access_level,
        uca.status AS access_status
    FROM dbo.FP26_companies c
    INNER JOIN dbo.FP26_user_company_access uca
        ON uca.company_id = c.id
       AND uca.user_id    = @UserId
       AND uca.status      = 'active'
    WHERE c.is_active = 1
    ORDER BY c.name;
END
GO
