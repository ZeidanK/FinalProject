IF OBJECT_ID('dbo.FP26_sp_Anomalies_ApplyDuplicateDecision', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_ApplyDuplicateDecision;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_ApplyDuplicateDecision
    @InvoiceIdsJson      NVARCHAR(MAX),
    @KeepInvoiceId       BIGINT,
    @ResolvedByUserId    BIGINT,
    @ResolutionNotes     NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @InvoiceId BIGINT;
    DECLARE @AnomalyId BIGINT;
    DECLARE invoice_cursor CURSOR FOR
        SELECT value FROM OPENJSON(@InvoiceIdsJson)
        WHERE CAST(value AS BIGINT) <> @KeepInvoiceId;

    OPEN invoice_cursor;
    FETCH NEXT FROM invoice_cursor INTO @InvoiceId;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @AffectedTransactions TABLE (transaction_id BIGINT PRIMARY KEY);

        INSERT INTO @AffectedTransactions(transaction_id)
        SELECT DISTINCT transaction_id
        FROM dbo.FP26_invoice_transaction_matches
        WHERE invoice_id = @InvoiceId;

        DELETE FROM dbo.FP26_invoice_transaction_matches
        WHERE invoice_id = @InvoiceId;

        UPDATE t
        SET
            is_matched = CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM dbo.FP26_invoice_transaction_matches m
                    WHERE m.transaction_id = t.id
                ) THEN 1 ELSE 0 END,
            updated_at = GETDATE()
        FROM dbo.FP26_transactions t
        INNER JOIN @AffectedTransactions a ON a.transaction_id = t.id;

        UPDATE dbo.FP26_invoices
        SET
            status = 'deleted',
            is_duplicate = 1,
            is_matched = 0,
            matched_amount = 0,
            updated_at = GETDATE()
        WHERE id = @InvoiceId;

        FETCH NEXT FROM invoice_cursor INTO @InvoiceId;
    END

    CLOSE invoice_cursor;
    DEALLOCATE invoice_cursor;

    UPDATE dbo.FP26_invoices
    SET
        status = CASE WHEN status = 'deleted' THEN 'uploaded' ELSE status END,
        is_duplicate = 0,
        updated_at = GETDATE()
    WHERE id = @KeepInvoiceId;

    DECLARE anomaly_cursor CURSOR FOR
        SELECT value FROM OPENJSON(@InvoiceIdsJson);

    OPEN anomaly_cursor;
    FETCH NEXT FROM anomaly_cursor INTO @AnomalyId;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        UPDATE dbo.FP26_anomalies
        SET
            status = 'resolved',
            resolved_by_user_id = @ResolvedByUserId,
            resolution_notes = @ResolutionNotes,
            resolved_at = GETDATE(),
            updated_at = GETDATE()
        WHERE id = @AnomalyId;

        FETCH NEXT FROM anomaly_cursor INTO @AnomalyId;
    END

    CLOSE anomaly_cursor;
    DEALLOCATE anomaly_cursor;
END
GO
