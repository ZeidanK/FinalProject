-- ============================================================
-- Creates tracking table for uploaded transaction Excel files.
-- This table supports duplicate-file anomaly detection via SHA-256.
-- ============================================================

IF OBJECT_ID('dbo.FP26_transaction_file_uploads', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_transaction_file_uploads;
GO

CREATE TABLE dbo.FP26_transaction_file_uploads
(
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    company_id          BIGINT        NOT NULL,
    file_hash_sha256    VARCHAR(64)   NOT NULL,
    file_original_name  VARCHAR(255)  NULL,
    file_path           VARCHAR(500)  NULL,
    file_size           BIGINT        NULL,
    uploaded_by_user_id BIGINT        NULL,
    anomaly_id          BIGINT        NULL,
    created_at          DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_transaction_file_uploads PRIMARY KEY (id),
    CONSTRAINT FK_FP26_tfu_company FOREIGN KEY (company_id)
        REFERENCES dbo.FP26_companies(id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_tfu_user FOREIGN KEY (uploaded_by_user_id)
        REFERENCES dbo.FP26_users(id) ON DELETE SET NULL,
    CONSTRAINT FK_FP26_tfu_anomaly FOREIGN KEY (anomaly_id)
        REFERENCES dbo.FP26_anomalies(id) ON DELETE NO ACTION
);
GO

CREATE INDEX IX_FP26_tfu_company_hash
    ON dbo.FP26_transaction_file_uploads(company_id, file_hash_sha256);
GO

CREATE INDEX IX_FP26_tfu_anomaly
    ON dbo.FP26_transaction_file_uploads(anomaly_id);
GO
