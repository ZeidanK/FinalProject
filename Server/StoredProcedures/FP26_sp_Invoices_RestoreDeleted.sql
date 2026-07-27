IF OBJECT_ID('dbo.FP26_sp_Invoices_RestoreDeleted', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_RestoreDeleted;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_RestoreDeleted
    @InvoiceId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.FP26_invoices
    SET
        status = CASE WHEN status = 'deleted' THEN 'uploaded' ELSE status END,
        updated_at = GETDATE()
    WHERE id = @InvoiceId;
    SELECT @@ROWCOUNT;
END
GO
