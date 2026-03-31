-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateInvoicesTable.sql
-- Updates file info and AI extraction fields on an existing invoice.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Invoices_UpdateFileInfo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_UpdateFileInfo;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_UpdateFileInfo
    @Id                     BIGINT,
    @FileOriginalName       VARCHAR(500)  = NULL,
    @FilePath               VARCHAR(1000) = NULL,
    @FileType               VARCHAR(50)   = NULL,
    @FileSize               BIGINT        = NULL,
    @AiExtractionConfidence DECIMAL(5,4)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_invoices
    SET
        file_original_name       = ISNULL(@FileOriginalName,       file_original_name),
        file_path                = ISNULL(@FilePath,               file_path),
        file_type                = ISNULL(@FileType,               file_type),
        file_size                = ISNULL(@FileSize,               file_size),
        ai_extraction_confidence = ISNULL(@AiExtractionConfidence, ai_extraction_confidence),
        ai_processed             = 1,
        updated_at               = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO
