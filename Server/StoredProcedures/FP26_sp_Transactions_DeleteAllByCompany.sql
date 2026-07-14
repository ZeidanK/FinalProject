IF OBJECT_ID('dbo.FP26_sp_Transactions_DeleteAllByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_DeleteAllByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_DeleteAllByCompany
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AffectedInvoices TABLE (invoice_id BIGINT PRIMARY KEY);

    IF NOT EXISTS (SELECT 1 FROM dbo.FP26_transactions WHERE company_id = @CompanyId)
    BEGIN
        SELECT 0;
        RETURN;
    END

    INSERT INTO @AffectedInvoices(invoice_id)
    SELECT DISTINCT m.invoice_id
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
    WHERE t.company_id = @CompanyId;

    DELETE m
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
    WHERE t.company_id = @CompanyId;

    UPDATE i
    SET
        is_matched = 0,
        matched_amount = 0,
        status = CASE WHEN i.status = 'matched' THEN 'verified' ELSE i.status END,
        updated_at = GETDATE()
    FROM dbo.FP26_invoices i
    INNER JOIN @AffectedInvoices a ON a.invoice_id = i.id;

    DELETE FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId;

    SELECT @@ROWCOUNT;
END
GO
