IF OBJECT_ID('dbo.FP26_sp_Transactions_SetRequiresInvoice', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_SetRequiresInvoice;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_SetRequiresInvoice
    @Id              BIGINT,
    @RequiresInvoice BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_transactions
    SET requires_invoice = @RequiresInvoice,
        updated_at = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT;
END
GO
