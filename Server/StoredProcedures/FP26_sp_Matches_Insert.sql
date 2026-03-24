-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Inserts a match AND updates invoice + transaction is_matched flags
-- atomically inside a transaction.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Matches_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_Insert
    @InvoiceId        BIGINT,
    @TransactionId    BIGINT,
    @MatchedAmount    DECIMAL(15,2),
    @MatchMethod      VARCHAR(50),
    @MatchedByUserId  BIGINT       = NULL,
    @MatchType        VARCHAR(50)  = 'full',
    @MatchConfidence  DECIMAL(5,4) = NULL,
    @MatchReason      VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO dbo.FP26_invoice_transaction_matches
            (invoice_id, transaction_id, match_type, matched_amount,
             match_method, match_confidence, match_reason,
             matched_by_user_id, created_at, updated_at)
        VALUES
            (@InvoiceId, @TransactionId, @MatchType, @MatchedAmount,
             @MatchMethod, @MatchConfidence, @MatchReason,
             @MatchedByUserId, GETDATE(), GETDATE());

        DECLARE @NewId BIGINT = SCOPE_IDENTITY();

        UPDATE dbo.FP26_invoices
        SET is_matched = 1, status = 'matched', matched_amount = @MatchedAmount, updated_at = GETDATE()
        WHERE id = @InvoiceId;

        UPDATE dbo.FP26_transactions
        SET is_matched = 1, updated_at = GETDATE()
        WHERE id = @TransactionId;

        COMMIT TRANSACTION;
        SELECT @NewId AS id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
