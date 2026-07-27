IF OBJECT_ID('dbo.FP26_sp_VendorAliases_Reject', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_VendorAliases_Reject;
GO

CREATE PROCEDURE dbo.FP26_sp_VendorAliases_Reject
    @CompanyId  BIGINT,
    @VendorName NVARCHAR(255),
    @Pattern    NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_vendor_aliases
    SET rejection_count = rejection_count + 1,
        is_active = CASE WHEN rejection_count + 1 >= 2 THEN 0 ELSE is_active END
    WHERE company_id = @CompanyId
      AND vendor_name = @VendorName
      AND transaction_pattern = @Pattern;
END
GO
