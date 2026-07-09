-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Deletes a match and subtracts matched_amount from invoice.
-- Only sets is_matched=0 when no remaining matches exist.
-- Atomic transaction.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Matches_Delete', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_Delete;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_Delete
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @InvoiceId     BIGINT;
        DECLARE @TransactionId BIGINT;
        DECLARE @MatchedAmount DECIMAL(15,2);

        SELECT @InvoiceId = invoice_id, @TransactionId = transaction_id, @MatchedAmount = matched_amount
        FROM dbo.FP26_invoice_transaction_matches
        WHERE id = @Id;

        IF @InvoiceId IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS rows_affected;
            RETURN;
        END

        DELETE FROM dbo.FP26_invoice_transaction_matches WHERE id = @Id;

        UPDATE dbo.FP26_invoices
        SET matched_amount = matched_amount - @MatchedAmount,
            is_matched = CASE WHEN (SELECT COUNT(*) FROM dbo.FP26_invoice_transaction_matches WHERE invoice_id = @InvoiceId) = 0 THEN 0 ELSE 1 END,
            updated_at = GETDATE()
        WHERE id = @InvoiceId;

        UPDATE dbo.FP26_transactions
        SET is_matched = 0, updated_at = GETDATE()
        WHERE id = @TransactionId;

        COMMIT TRANSACTION;
        SELECT 1 AS rows_affected;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
