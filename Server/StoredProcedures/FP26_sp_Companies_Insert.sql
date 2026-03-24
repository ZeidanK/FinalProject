-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Companies_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_Insert
    @Name               VARCHAR(255),
    @CreatedByUserId    BIGINT,
    @RegistrationNumber VARCHAR(100)  = NULL,
    @Street             VARCHAR(255)  = NULL,
    @City               VARCHAR(100)  = NULL,
    @State              VARCHAR(100)  = NULL,
    @PostalCode         VARCHAR(20)   = NULL,
    @Country            VARCHAR(100)  = 'USA',
    @Email              VARCHAR(255)  = NULL,
    @Phone              VARCHAR(50)   = NULL,
    @Website            VARCHAR(500)  = NULL,
    @TaxId              VARCHAR(100)  = NULL,
    @VatNumber          VARCHAR(100)  = NULL,
    @FiscalYearStart    DATE          = NULL,
    @Currency           VARCHAR(3)    = 'USD'
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_companies
        (name, registration_number, street, city, state, postal_code,
         country, email, phone, website, tax_id, vat_number,
         fiscal_year_start, currency, is_active, created_by_user_id,
         created_at, updated_at)
    VALUES
        (@Name, @RegistrationNumber, @Street, @City, @State, @PostalCode,
         @Country, @Email, @Phone, @Website, @TaxId, @VatNumber,
         @FiscalYearStart, @Currency, 1, @CreatedByUserId,
         GETDATE(), GETDATE());

    SELECT SCOPE_IDENTITY() AS id;
END
GO
