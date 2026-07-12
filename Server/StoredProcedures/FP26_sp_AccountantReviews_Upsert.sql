IF OBJECT_ID('dbo.FP26_sp_AccountantReviews_Upsert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantReviews_Upsert;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantReviews_Upsert
    @AccountantUserId BIGINT,
    @CompanyId        BIGINT,
    @Rating           TINYINT,
    @Review           NVARCHAR(2000) = NULL,
    @CreatedByUserId  BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Rating < 1 OR @Rating > 5
    BEGIN
        SELECT 0 AS rows_affected;
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM dbo.FP26_accountant_reviews
        WHERE accountant_user_id = @AccountantUserId
          AND company_id = @CompanyId
          AND created_by_user_id = @CreatedByUserId
    )
        UPDATE dbo.FP26_accountant_reviews
        SET rating = @Rating, review = @Review, updated_at = GETDATE()
        WHERE accountant_user_id = @AccountantUserId
          AND company_id = @CompanyId
          AND created_by_user_id = @CreatedByUserId;
    ELSE
        INSERT INTO dbo.FP26_accountant_reviews (accountant_user_id, company_id, rating, review, created_by_user_id)
        VALUES (@AccountantUserId, @CompanyId, @Rating, @Review, @CreatedByUserId);

    SELECT @@ROWCOUNT AS rows_affected;
END
GO