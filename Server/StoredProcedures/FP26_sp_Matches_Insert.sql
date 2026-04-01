-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Inserts a match AND updates invoice + transaction is_matched flags.
-- Supports PARTIAL PAYMENTS: matched_amount is ACCUMULATED for invoices.
-- Tracks installment payment information.
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
    @MatchType        VARCHAR(50)  = 'partial',
    @MatchConfidence  DECIMAL(5,4) = NULL,
    @MatchReason      VARCHAR(500) = NULL,
    @InstallmentNumber INT         = NULL,
    @InstallmentNote  VARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Insert the match record
        INSERT INTO dbo.FP26_invoice_transaction_matches
            (invoice_id, transaction_id, match_type, matched_amount,
             match_method, match_confidence, match_reason,
             matched_by_user_id, installment_number, installment_note,
             created_at, updated_at)
        VALUES
            (@InvoiceId, @TransactionId, @MatchType, @MatchedAmount,
             @MatchMethod, @MatchConfidence, @MatchReason,
             @MatchedByUserId, @InstallmentNumber, @InstallmentNote,
             GETDATE(), GETDATE());

        DECLARE @NewId BIGINT = SCOPE_IDENTITY();

        -- ACCUMULATE matched amount on invoice (supports installment payments)
        DECLARE @NewMatchedAmount DECIMAL(15,2);
        DECLARE @TotalAmount DECIMAL(15,2);
        
        UPDATE dbo.FP26_invoices
        SET matched_amount = matched_amount + @MatchedAmount,
            @NewMatchedAmount = matched_amount + @MatchedAmount,
            @TotalAmount = total_amount,
            updated_at = GETDATE()
        WHERE id = @InvoiceId;

        -- Set is_matched flag and status based on whether invoice is fully paid
        IF @NewMatchedAmount >= @TotalAmount
        BEGIN
            UPDATE dbo.FP26_invoices
            SET is_matched = 1, 
                status = 'fully_matched',
                updated_at = GETDATE()
            WHERE id = @InvoiceId;
        END
        ELSE
        BEGIN
            UPDATE dbo.FP26_invoices
            SET is_matched = 0,  -- Still partially matched
                status = 'partially_matched',
                updated_at = GETDATE()
            WHERE id = @InvoiceId;
        END

        -- Mark transaction as matched (transaction can only be used once)
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
