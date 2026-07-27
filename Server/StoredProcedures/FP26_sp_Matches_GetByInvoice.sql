IF OBJECT_ID('dbo.FP26_sp_Matches_GetByInvoice', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_GetByInvoice;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_GetByInvoice
    @InvoiceId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.id,
        m.invoice_id,
        m.transaction_id,
        m.match_type,
        m.matched_amount,
        m.match_method,
        m.match_confidence,
        m.match_reason,
        m.matched_by_user_id,
        m.installment_number,
        m.installment_note,
        m.created_at,
        m.updated_at,
        t.transaction_date,
        t.description AS transaction_description,
        t.amount AS transaction_amount,
        t.transaction_type
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_transactions t ON m.transaction_id = t.id
    WHERE m.invoice_id = @InvoiceId
    ORDER BY m.created_at ASC;
END
GO
