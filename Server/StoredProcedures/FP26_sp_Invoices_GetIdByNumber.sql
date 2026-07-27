IF OBJECT_ID('dbo.FP26_sp_Invoices_GetIdByNumber', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_GetIdByNumber;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_GetIdByNumber
    @CompanyId      BIGINT,
    @InvoiceNumber  NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 id
    FROM dbo.FP26_invoices
    WHERE company_id = @CompanyId
      AND invoice_number = @InvoiceNumber
      AND is_duplicate = 0;
END
GO
