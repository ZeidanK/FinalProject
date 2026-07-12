IF OBJECT_ID('dbo.FP26_sp_AccountantCertifications_Remove', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantCertifications_Remove;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantCertifications_Remove
    @UserId        BIGINT,
    @Certification NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.FP26_accountant_certifications WHERE user_id = @UserId AND certification = @Certification;
    SELECT @@ROWCOUNT AS rows_affected;
END
GO