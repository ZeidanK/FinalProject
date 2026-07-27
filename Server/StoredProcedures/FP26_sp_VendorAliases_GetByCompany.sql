IF OBJECT_ID('dbo.FP26_sp_VendorAliases_GetByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_VendorAliases_GetByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_VendorAliases_GetByCompany
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, company_id, vendor_name, transaction_pattern,
           confirmation_count, rejection_count, is_active, created_at
    FROM dbo.FP26_vendor_aliases
    WHERE company_id = @CompanyId AND is_active = 1
      AND confirmation_count >= 2;
END
GO
