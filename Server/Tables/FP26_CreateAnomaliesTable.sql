-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateMatchesTable.sql
-- Creates: FP26_anomalies
-- ============================================================

IF OBJECT_ID('dbo.FP26_anomalies', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_anomalies;
GO

CREATE TABLE dbo.FP26_anomalies
(
    id                      BIGINT          NOT NULL IDENTITY(1,1),
    company_id              BIGINT          NOT NULL,
    anomaly_type            VARCHAR(100)    NOT NULL,
    title                   VARCHAR(255)    NOT NULL,
    description             VARCHAR(MAX)    NOT NULL,
    severity                VARCHAR(50)     NOT NULL DEFAULT 'warning',
    status                  VARCHAR(50)     NOT NULL DEFAULT 'open',
    suggested_action        VARCHAR(MAX)        NULL,
    related_invoice_id      BIGINT              NULL,
    related_transaction_id  BIGINT              NULL,
    related_match_id        BIGINT              NULL,
    amount                  DECIMAL(15,2)       NULL,
    detection_method        VARCHAR(50)     NOT NULL DEFAULT 'ai',
    detection_confidence    DECIMAL(5,4)        NULL,
    resolved_by_user_id     BIGINT              NULL,
    resolution_notes        VARCHAR(MAX)        NULL,
    resolved_at             DATETIME2           NULL,
    created_at              DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at              DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_anomalies PRIMARY KEY (id),
    CONSTRAINT FK_FP26_anomalies_company     FOREIGN KEY (company_id)             REFERENCES dbo.FP26_companies                  (id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_anomalies_invoice     FOREIGN KEY (related_invoice_id)     REFERENCES dbo.FP26_invoices                   (id),
    CONSTRAINT FK_FP26_anomalies_transaction FOREIGN KEY (related_transaction_id) REFERENCES dbo.FP26_transactions               (id),
    CONSTRAINT FK_FP26_anomalies_match       FOREIGN KEY (related_match_id)       REFERENCES dbo.FP26_invoice_transaction_matches (id),
    CONSTRAINT FK_FP26_anomalies_resolver    FOREIGN KEY (resolved_by_user_id)    REFERENCES dbo.FP26_users                      (id) ON DELETE SET NULL
);
GO
