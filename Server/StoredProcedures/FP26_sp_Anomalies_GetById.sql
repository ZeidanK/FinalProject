-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Anomalies_GetById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_GetById;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_GetById
    @Id BIGINT
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
    LEFT JOIN dbo.FP26_users u ON u.id = a.resolved_by_user_id
    WHERE a.id = @Id;
END
GO
