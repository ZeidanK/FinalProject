IF OBJECT_ID('dbo.FP26_sp_Invoices_DeleteCascade', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_DeleteCascade;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_DeleteCascade
    @InvoiceId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CompanyId BIGINT;
    DECLARE @InvoiceNumber NVARCHAR(255);
    DECLARE @TotalAmount DECIMAL(18, 2);
    DECLARE @InvoiceDate DATE;
    DECLARE @ReplacementInvoiceId BIGINT;
    DECLARE @ActiveGroupCount INT;
    DECLARE @DeletedRows INT = 0;
    DECLARE @AffectedMatches TABLE (match_id BIGINT PRIMARY KEY);
    DECLARE @AffectedTransactions TABLE (transaction_id BIGINT PRIMARY KEY);
    DECLARE @AffectedDuplicateAnomalies TABLE (anomaly_id BIGINT PRIMARY KEY);

    SELECT
        @CompanyId = company_id,
        @InvoiceNumber = invoice_number,
        @TotalAmount = total_amount,
        @InvoiceDate = CONVERT(date, invoice_date)
    FROM dbo.FP26_invoices
    WHERE id = @InvoiceId;

    IF @CompanyId IS NULL
    BEGIN
        SELECT @DeletedRows;
        RETURN;
    END

    INSERT INTO @AffectedMatches(match_id)
    SELECT id
    FROM dbo.FP26_invoice_transaction_matches
    WHERE invoice_id = @InvoiceId;

    INSERT INTO @AffectedTransactions(transaction_id)
    SELECT DISTINCT transaction_id
    FROM dbo.FP26_invoice_transaction_matches
    WHERE invoice_id = @InvoiceId;

    INSERT INTO @AffectedDuplicateAnomalies(anomaly_id)
    SELECT a.id
    FROM dbo.FP26_anomalies a
    INNER JOIN dbo.FP26_invoices i ON i.id = a.related_invoice_id
    WHERE a.company_id = @CompanyId
      AND a.anomaly_type = 'duplicate'
      AND i.invoice_number = @InvoiceNumber
      AND i.total_amount = @TotalAmount
      AND CONVERT(date, i.invoice_date) = @InvoiceDate;

    SELECT TOP 1 @ReplacementInvoiceId = id
    FROM dbo.FP26_invoices
    WHERE company_id = @CompanyId
      AND invoice_number = @InvoiceNumber
      AND total_amount = @TotalAmount
      AND CONVERT(date, invoice_date) = @InvoiceDate
      AND id <> @InvoiceId
    ORDER BY
        CASE WHEN status = 'deleted' THEN 1 ELSE 0 END,
        created_at ASC,
        id ASC;

    UPDATE dbo.FP26_anomalies
    SET
        related_invoice_id = @ReplacementInvoiceId,
        updated_at = GETDATE()
    WHERE anomaly_type = 'duplicate'
      AND related_invoice_id = @InvoiceId;

    DELETE FROM dbo.FP26_anomalies
    WHERE (related_invoice_id = @InvoiceId AND anomaly_type <> 'duplicate')
       OR related_match_id IN (SELECT match_id FROM @AffectedMatches);

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

    DELETE FROM dbo.FP26_invoices
    WHERE id = @InvoiceId;
    SET @DeletedRows = @@ROWCOUNT;

    UPDATE dbo.FP26_invoices
    SET is_duplicate = 1, updated_at = GETDATE()
    WHERE company_id = @CompanyId
      AND invoice_number = @InvoiceNumber
      AND total_amount = @TotalAmount
      AND CONVERT(date, invoice_date) = @InvoiceDate
      AND status <> 'deleted';

    SET @ReplacementInvoiceId = NULL;
    SELECT TOP 1 @ReplacementInvoiceId = id
    FROM dbo.FP26_invoices
    WHERE company_id = @CompanyId
      AND invoice_number = @InvoiceNumber
      AND total_amount = @TotalAmount
      AND CONVERT(date, invoice_date) = @InvoiceDate
      AND status <> 'deleted'
    ORDER BY created_at ASC, id ASC;

    IF @ReplacementInvoiceId IS NOT NULL
    BEGIN
        UPDATE dbo.FP26_invoices
        SET is_duplicate = 0, updated_at = GETDATE()
        WHERE id = @ReplacementInvoiceId;
    END

    SELECT @ActiveGroupCount = COUNT(1)
    FROM dbo.FP26_invoices
    WHERE company_id = @CompanyId
      AND invoice_number = @InvoiceNumber
      AND total_amount = @TotalAmount
      AND CONVERT(date, invoice_date) = @InvoiceDate
      AND status <> 'deleted';

    IF @ActiveGroupCount < 2
    BEGIN
        DELETE a
        FROM dbo.FP26_anomalies a
        INNER JOIN @AffectedDuplicateAnomalies affected ON affected.anomaly_id = a.id
        WHERE a.anomaly_type = 'duplicate'
          AND a.status = 'open'
          AND a.company_id = @CompanyId;
    END
    ELSE
    BEGIN
        UPDATE a
        SET
            related_invoice_id = @ReplacementInvoiceId,
            updated_at = GETDATE()
        FROM dbo.FP26_anomalies a
        INNER JOIN @AffectedDuplicateAnomalies affected ON affected.anomaly_id = a.id
        WHERE a.anomaly_type = 'duplicate'
          AND a.status = 'open'
          AND a.company_id = @CompanyId;
    END

    SELECT @DeletedRows;
END
GO
