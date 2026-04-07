-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Deletes a match AND resets invoice + transaction is_matched flags
-- atomically inside a transaction.
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
        -- Read FKs before deleting
        DECLARE @InvoiceId     BIGINT;
        DECLARE @TransactionId BIGINT;

        SELECT @InvoiceId = invoice_id, @TransactionId = transaction_id
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
        SET is_matched = 0, status = 'processed', matched_amount = 0, updated_at = GETDATE()
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
