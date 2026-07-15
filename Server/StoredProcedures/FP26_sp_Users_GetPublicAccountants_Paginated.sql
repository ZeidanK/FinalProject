-- ============================================================
-- Paginated public accountant directory with search, sort,
-- specialties, certifications, and average rating.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_GetPublicAccountants_Paginated', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_GetPublicAccountants_Paginated;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_GetPublicAccountants_Paginated
    @CompanyId      BIGINT       = NULL,
    @Page           INT          = 1,
    @Limit          INT          = 20,
    @Search         NVARCHAR(255) = NULL,
    @SortBy         VARCHAR(50)  = 'name',
    @SortDirection  VARCHAR(4)   = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @Limit;

    -- Total count
    SELECT COUNT(*)
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
      AND (
        @Search IS NULL
        OR u.name       LIKE '%' + @Search + '%'
        OR u.email      LIKE '%' + @Search + '%'
        OR u.location   LIKE '%' + @Search + '%'
        OR u.bio        LIKE '%' + @Search + '%'
      );

    -- Paginated data using CTE with ROW_NUMBER for OFFSET/FETCH compatibility
    WITH AccountantData AS (
        SELECT
            u.id,
            u.name,
            u.email,
            u.phone,
            u.profile_picture,
            uca.status AS request_status,
            u.bio,
            u.years_of_experience,
            u.hourly_rate,
            u.location,
            ISNULL(
                (SELECT STUFF(
                    (SELECT ', ' + s.specialty
                     FROM dbo.FP26_accountant_specialties s
                     WHERE s.user_id = u.id
                     ORDER BY s.specialty
                     FOR XML PATH('')), 1, 2, '')),
                '') AS specialties,
            ISNULL(
                (SELECT STUFF(
                    (SELECT ', ' + c.certification
                     FROM dbo.FP26_accountant_certifications c
                     WHERE c.user_id = u.id
                     ORDER BY c.certification
                     FOR XML PATH('')), 1, 2, '')),
                '') AS certifications,
            (SELECT CAST(ROUND(AVG(CAST(r.rating AS FLOAT)), 1) AS DECIMAL(3,1)) FROM dbo.FP26_accountant_reviews r WHERE r.accountant_user_id = u.id) AS average_rating,
            (SELECT COUNT(*) FROM dbo.FP26_accountant_reviews r WHERE r.accountant_user_id = u.id) AS review_count,
            ROW_NUMBER() OVER (
                ORDER BY
                    CASE WHEN @SortBy = 'name' AND @SortDirection = 'ASC'  THEN u.name END ASC,
                    CASE WHEN @SortBy = 'name' AND @SortDirection = 'DESC' THEN u.name END DESC,
                    CASE WHEN @SortBy = 'email' AND @SortDirection = 'ASC'  THEN u.email END ASC,
                    CASE WHEN @SortBy = 'email' AND @SortDirection = 'DESC' THEN u.email END DESC,
                    CASE WHEN @SortBy = 'experience' AND @SortDirection = 'ASC'
                        THEN CASE WHEN u.years_of_experience IS NULL THEN 1 ELSE 0 END END ASC,
                    CASE WHEN @SortBy = 'experience' AND @SortDirection = 'ASC'
                        THEN u.years_of_experience END ASC,
                    CASE WHEN @SortBy = 'experience' AND @SortDirection = 'DESC'
                        THEN CASE WHEN u.years_of_experience IS NULL THEN 1 ELSE 0 END END DESC,
                    CASE WHEN @SortBy = 'experience' AND @SortDirection = 'DESC'
                        THEN u.years_of_experience END DESC,
                    CASE WHEN @SortBy = 'rating' AND @SortDirection = 'ASC'  THEN (SELECT AVG(CAST(r.rating AS FLOAT)) FROM dbo.FP26_accountant_reviews r WHERE r.accountant_user_id = u.id) END ASC,
                    CASE WHEN @SortBy = 'rating' AND @SortDirection = 'DESC' THEN (SELECT AVG(CAST(r.rating AS FLOAT)) FROM dbo.FP26_accountant_reviews r WHERE r.accountant_user_id = u.id) END DESC,
                    u.name ASC
            ) AS row_num
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
          AND (
            @Search IS NULL
            OR u.name       LIKE '%' + @Search + '%'
            OR u.email      LIKE '%' + @Search + '%'
            OR u.location   LIKE '%' + @Search + '%'
            OR u.bio        LIKE '%' + @Search + '%'
          )
    )
    SELECT
        id, name, email, phone, profile_picture,
        request_status, bio, years_of_experience, hourly_rate,
        location, specialties, certifications,
        average_rating, review_count
    FROM AccountantData
    WHERE row_num > @Offset
      AND row_num <= @Offset + @Limit
    ORDER BY row_num;
END
GO
