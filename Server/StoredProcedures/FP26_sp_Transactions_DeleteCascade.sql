IF OBJECT_ID('dbo.FP26_sp_Transactions_DeleteCascade', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_DeleteCascade;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_DeleteCascade
    @TransactionId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AffectedInvoices TABLE (invoice_id BIGINT PRIMARY KEY);

    IF NOT EXISTS (SELECT 1 FROM dbo.FP26_transactions WHERE id = @TransactionId)
    BEGIN
        SELECT 0;
        RETURN;
    END

    INSERT INTO @AffectedInvoices(invoice_id)
    SELECT DISTINCT invoice_id
    FROM dbo.FP26_invoice_transaction_matches
    WHERE transaction_id = @TransactionId;

    DELETE FROM dbo.FP26_invoice_transaction_matches
    WHERE transaction_id = @TransactionId;

    UPDATE i
    SET
        is_matched = CASE
            WHEN EXISTS (
                SELECT 1
                FROM dbo.FP26_invoice_transaction_matches m
                WHERE m.invoice_id = i.id
            ) THEN 1 ELSE 0 END,
        matched_amount = ISNULL((
            SELECT SUM(m2.matched_amount)
            FROM dbo.FP26_invoice_transaction_matches m2
            WHERE m2.invoice_id = i.id
        ), 0),
        status = CASE
            WHEN EXISTS (
                SELECT 1
                FROM dbo.FP26_invoice_transaction_matches m3
                WHERE m3.invoice_id = i.id
            ) THEN 'matched'
            WHEN i.status = 'matched' THEN 'verified'
            ELSE i.status
        END,
        updated_at = GETDATE()
    FROM dbo.FP26_invoices i
    INNER JOIN @AffectedInvoices a ON a.invoice_id = i.id;

    DELETE FROM dbo.FP26_transactions
    WHERE id = @TransactionId;

    SELECT @@ROWCOUNT;
END
GO
