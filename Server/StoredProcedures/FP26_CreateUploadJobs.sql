-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Durable background upload job tracking for Hangfire workers.
-- ============================================================

IF OBJECT_ID('dbo.FP26_upload_jobs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_upload_jobs
    (
        id                BIGINT IDENTITY(1,1) PRIMARY KEY,
        job_type          VARCHAR(100)    NOT NULL,
        status            VARCHAR(50)     NOT NULL CONSTRAINT DF_FP26_upload_jobs_status DEFAULT ('queued'),
        file_path         VARCHAR(1000)   NOT NULL,
        file_original_name VARCHAR(255)   NULL,
        file_type         VARCHAR(100)    NULL,
        file_size         BIGINT          NULL,
        company_id        BIGINT          NOT NULL,
        user_id           BIGINT          NOT NULL,
        bank_account_id   BIGINT          NULL,
        payload_json      NVARCHAR(MAX)   NULL,
        result_json       NVARCHAR(MAX)   NULL,
        error_message     NVARCHAR(MAX)   NULL,
        progress_percent  INT             NOT NULL CONSTRAINT DF_FP26_upload_jobs_progress DEFAULT (0),
        hangfire_job_id   VARCHAR(100)    NULL,
        created_at        DATETIME        NOT NULL CONSTRAINT DF_FP26_upload_jobs_created_at DEFAULT (GETDATE()),
        updated_at        DATETIME        NOT NULL CONSTRAINT DF_FP26_upload_jobs_updated_at DEFAULT (GETDATE()),
        completed_at      DATETIME        NULL,

        CONSTRAINT FK_FP26_upload_jobs_company FOREIGN KEY (company_id) REFERENCES dbo.FP26_companies(id),
        CONSTRAINT FK_FP26_upload_jobs_user FOREIGN KEY (user_id) REFERENCES dbo.FP26_users(id),
        CONSTRAINT FK_FP26_upload_jobs_bank_account FOREIGN KEY (bank_account_id) REFERENCES dbo.FP26_bank_accounts(id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FP26_upload_jobs_user_created' AND object_id = OBJECT_ID('dbo.FP26_upload_jobs'))
BEGIN
    CREATE INDEX IX_FP26_upload_jobs_user_created
        ON dbo.FP26_upload_jobs(user_id, created_at DESC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_FP26_upload_jobs_company_status_created' AND object_id = OBJECT_ID('dbo.FP26_upload_jobs'))
BEGIN
    CREATE INDEX IX_FP26_upload_jobs_company_status_created
        ON dbo.FP26_upload_jobs(company_id, status, created_at DESC);
END
GO
