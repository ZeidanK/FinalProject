IF OBJECT_ID('dbo.FP26_sp_AccountantSpecialties_Remove', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantSpecialties_Remove;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantSpecialties_Remove
    @UserId    BIGINT,
    @Specialty NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.FP26_accountant_specialties WHERE user_id = @UserId AND specialty = @Specialty;
    SELECT @@ROWCOUNT AS rows_affected;
END
GO