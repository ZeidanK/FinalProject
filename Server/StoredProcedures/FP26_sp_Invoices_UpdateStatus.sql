-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Valid statuses: uploaded, processing, processed, matched, rejected
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Invoices_UpdateStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_UpdateStatus;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_UpdateStatus
    @Id     BIGINT,
    @Status VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_invoices
    SET
        status     = @Status,
        updated_at = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO
