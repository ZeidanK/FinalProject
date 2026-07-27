-- ============================================================
-- Adds file_upload_id FK to FP26_transactions to link each
-- transaction to the file upload that created it.
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.FP26_transactions')
      AND name = 'file_upload_id'
)
BEGIN
    ALTER TABLE dbo.FP26_transactions
    ADD file_upload_id BIGINT NULL
        CONSTRAINT FK_FP26_transactions_file_upload
        FOREIGN KEY (file_upload_id) REFERENCES dbo.FP26_transaction_file_uploads(id) ON DELETE NO ACTION;
END
GO
