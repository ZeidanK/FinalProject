IF OBJECT_ID('dbo.FP26_sp_AccountantReviews_GetByUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantReviews_GetByUser;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantReviews_GetByUser
    @AccountantUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.id,
        r.accountant_user_id,
        r.company_id,
        r.rating,
        r.review,
        r.created_by_user_id,
        u.name AS created_by_name,
        r.created_at,
        r.updated_at
    FROM dbo.FP26_accountant_reviews r
    INNER JOIN dbo.Users u ON u.id = r.created_by_user_id
    WHERE r.accountant_user_id = @AccountantUserId
    ORDER BY r.created_at DESC;
END
GO
