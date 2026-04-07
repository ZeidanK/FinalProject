-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Anomalies_Insert', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_Insert;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_Insert
    @CompanyId              BIGINT,
    @AnomalyType            VARCHAR(100),
    @Title                  VARCHAR(255),
    @Description            VARCHAR(MAX),
    @Severity               VARCHAR(50)   = 'warning',
    @SuggestedAction        VARCHAR(MAX)  = NULL,
    @RelatedInvoiceId       BIGINT        = NULL,
    @RelatedTransactionId   BIGINT        = NULL,
    @RelatedMatchId         BIGINT        = NULL,
    @Amount                 DECIMAL(15,2) = NULL,
    @DetectionMethod        VARCHAR(50)   = 'ai',
    @DetectionConfidence    DECIMAL(5,4)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.FP26_anomalies
        (company_id, anomaly_type, title, description, severity, status,
         suggested_action, related_invoice_id, related_transaction_id,
         related_match_id, amount, detection_method, detection_confidence,
         created_at, updated_at)
    VALUES
        (@CompanyId, @AnomalyType, @Title, @Description, @Severity, 'open',
         @SuggestedAction, @RelatedInvoiceId, @RelatedTransactionId,
         @RelatedMatchId, @Amount, @DetectionMethod, @DetectionConfidence,
         GETDATE(), GETDATE());

    -- Mark the linked transaction as anomalous
    IF @RelatedTransactionId IS NOT NULL
        UPDATE dbo.FP26_transactions
        SET    is_anomaly = 1,
               updated_at = GETDATE()
        WHERE  id = @RelatedTransactionId;

    SELECT SCOPE_IDENTITY() AS id;
END
GO
