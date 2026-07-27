IF OBJECT_ID('dbo.FP26_sp_AccountantSpecialties_Add', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_AccountantSpecialties_Add;
GO

CREATE PROCEDURE dbo.FP26_sp_AccountantSpecialties_Add
    @UserId    BIGINT,
    @Specialty NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.FP26_accountant_specialties WHERE user_id = @UserId AND specialty = @Specialty)
        INSERT INTO dbo.FP26_accountant_specialties (user_id, specialty) VALUES (@UserId, @Specialty);
    SELECT @@ROWCOUNT AS rows_affected;
END
GO