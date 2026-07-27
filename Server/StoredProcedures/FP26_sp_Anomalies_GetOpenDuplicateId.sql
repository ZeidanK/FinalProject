IF OBJECT_ID('dbo.FP26_sp_Anomalies_GetOpenDuplicateId', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_GetOpenDuplicateId;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_GetOpenDuplicateId
    @CompanyId      BIGINT,
    @InvoiceNumber  NVARCHAR(255),
    @TotalAmount    DECIMAL(18, 2),
    @InvoiceDate    DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 a.id
    FROM dbo.FP26_anomalies a
    INNER JOIN dbo.FP26_invoices i ON i.id = a.related_invoice_id
    WHERE a.company_id = @CompanyId
      AND a.anomaly_type = 'duplicate'
      AND a.status = 'open'
      AND i.invoice_number = @InvoiceNumber
      AND i.total_amount = @TotalAmount
      AND CONVERT(date, i.invoice_date) = @InvoiceDate
    ORDER BY a.created_at ASC;
END
GO
