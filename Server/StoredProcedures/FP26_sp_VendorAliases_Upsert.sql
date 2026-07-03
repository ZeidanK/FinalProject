IF OBJECT_ID('dbo.FP26_sp_VendorAliases_Upsert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_VendorAliases_Upsert;
GO

CREATE PROCEDURE dbo.FP26_sp_VendorAliases_Upsert
    @CompanyId  BIGINT,
    @VendorName NVARCHAR(255),
    @Pattern    NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM dbo.FP26_vendor_aliases
        WHERE company_id = @CompanyId
          AND vendor_name = @VendorName
          AND transaction_pattern = @Pattern
    )
    BEGIN
        UPDATE dbo.FP26_vendor_aliases
        SET confirmation_count = confirmation_count + 1,
            is_active = 1
        WHERE company_id = @CompanyId
          AND vendor_name = @VendorName
          AND transaction_pattern = @Pattern;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.FP26_vendor_aliases
            (company_id, vendor_name, transaction_pattern,
             confirmation_count, rejection_count, is_active, created_at)
        VALUES
            (@CompanyId, @VendorName, @Pattern, 1, 0, 1, GETDATE());
    END
END
GO
