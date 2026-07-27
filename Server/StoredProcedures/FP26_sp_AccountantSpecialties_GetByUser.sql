IF OBJECT_ID('dbo.FP26_sp_AccountantSpecialties_GetByUser', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantSpecialties_GetByUser;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantSpecialties_GetByUser
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT specialty FROM dbo.FP26_accountant_specialties WHERE user_id = @UserId ORDER BY specialty;
END
GO
