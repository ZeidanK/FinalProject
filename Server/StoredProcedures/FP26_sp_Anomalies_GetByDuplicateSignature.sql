IF OBJECT_ID('dbo.FP26_sp_Anomalies_GetByDuplicateSignature', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_GetByDuplicateSignature;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_GetByDuplicateSignature
    @CompanyId      BIGINT,
    @InvoiceNumber  NVARCHAR(255),
    @TotalAmount    DECIMAL(18, 2),
    @InvoiceDate    DATE,
    @Status         VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.id,
        a.company_id,
        a.anomaly_type,
        a.title,
        a.description,
        a.severity,
        a.status,
        a.suggested_action,
        a.related_invoice_id,
        a.related_transaction_id,
        a.related_match_id,
        a.amount,
        a.detection_method,
        a.detection_confidence,
        a.resolved_by_user_id,
        u.name AS resolved_by_name,
        a.resolution_notes,
        a.resolved_at,
        a.created_at,
        a.updated_at
    FROM dbo.FP26_anomalies a
    INNER JOIN dbo.FP26_invoices i ON i.id = a.related_invoice_id
    LEFT JOIN dbo.FP26_users u ON u.id = a.resolved_by_user_id
    WHERE a.company_id = @CompanyId
      AND a.anomaly_type = 'duplicate'
      AND i.invoice_number = @InvoiceNumber
      AND i.total_amount = @TotalAmount
      AND CONVERT(date, i.invoice_date) = @InvoiceDate
      AND (@Status IS NULL OR a.status = @Status)
    ORDER BY a.created_at ASC;
END
GO
