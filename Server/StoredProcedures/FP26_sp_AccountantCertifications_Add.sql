IF OBJECT_ID('dbo.FP26_sp_AccountantCertifications_Add', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantCertifications_Add;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantCertifications_Add
    @UserId        BIGINT,
    @Certification NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.FP26_accountant_certifications WHERE user_id = @UserId AND certification = @Certification)
        INSERT INTO dbo.FP26_accountant_certifications (user_id, certification) VALUES (@UserId, @Certification);
    SELECT @@ROWCOUNT AS rows_affected;
END
GO