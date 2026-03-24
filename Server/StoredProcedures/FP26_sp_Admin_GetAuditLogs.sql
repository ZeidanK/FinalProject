-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Paginated audit logs with optional company filter.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Admin_GetAuditLogs', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Admin_GetAuditLogs;
GO

CREATE PROCEDURE dbo.FP26_sp_Admin_GetAuditLogs
    @Page      INT    = 1,
    @Limit     INT    = 50,
    @CompanyId BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS total_count
    FROM dbo.FP26_audit_logs
    WHERE (@CompanyId IS NULL OR company_id = @CompanyId);

    SELECT
        al.id,
        al.user_id,
        u.name      AS user_name,
        al.company_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.ip_address,
        al.created_at
    FROM dbo.FP26_audit_logs al
    LEFT JOIN dbo.FP26_users u ON u.id = al.user_id
    WHERE (@CompanyId IS NULL OR al.company_id = @CompanyId)
    ORDER BY al.created_at DESC
    OFFSET  (@Page - 1) * @Limit ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO
