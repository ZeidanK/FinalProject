IF OBJECT_ID('dbo.FP26_sp_AccountantCertifications_GetByUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantCertifications_GetByUser;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantCertifications_GetByUser
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT certification FROM dbo.FP26_accountant_certifications WHERE user_id = @UserId ORDER BY certification;
END
GO
