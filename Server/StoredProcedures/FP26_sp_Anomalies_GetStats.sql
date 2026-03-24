-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Returns anomaly counts grouped by status and severity.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Anomalies_GetStats', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Anomalies_GetStats;
GO

CREATE PROCEDURE dbo.FP26_sp_Anomalies_GetStats
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- Counts by status
    SELECT status, COUNT(*) AS count
    FROM dbo.FP26_anomalies
    WHERE company_id = @CompanyId
    GROUP BY status;

    -- Counts by severity
    SELECT severity, COUNT(*) AS count
    FROM dbo.FP26_anomalies
    WHERE company_id = @CompanyId
    GROUP BY severity;
END
GO
