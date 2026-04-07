-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Companies_Update', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Companies_Update;
GO

CREATE PROCEDURE dbo.FP26_sp_Companies_Update
    @Id        BIGINT,
    @Name      VARCHAR(255)  = NULL,
    @Street    VARCHAR(255)  = NULL,
    @City      VARCHAR(100)  = NULL,
    @State     VARCHAR(100)  = NULL,
    @PostalCode VARCHAR(20)  = NULL,
    @Country   VARCHAR(100)  = NULL,
    @Email     VARCHAR(255)  = NULL,
    @Phone     VARCHAR(50)   = NULL,
    @Website   VARCHAR(500)  = NULL,
    @TaxId     VARCHAR(100)  = NULL,
    @VatNumber VARCHAR(100)  = NULL,
    @IsActive  BIT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_companies
    SET
        name        = ISNULL(@Name,       name),
        street      = ISNULL(@Street,     street),
        city        = ISNULL(@City,       city),
        state       = ISNULL(@State,      state),
        postal_code = ISNULL(@PostalCode, postal_code),
        country     = ISNULL(@Country,    country),
        email       = ISNULL(@Email,      email),
        phone       = ISNULL(@Phone,      phone),
        website     = ISNULL(@Website,    website),
        tax_id      = ISNULL(@TaxId,      tax_id),
        vat_number  = ISNULL(@VatNumber,  vat_number),
        is_active   = ISNULL(@IsActive,   is_active),
        updated_at  = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO
