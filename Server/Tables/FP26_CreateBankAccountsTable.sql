-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateCompaniesTable.sql
-- Creates: FP26_bank_accounts
-- ============================================================

IF OBJECT_ID('dbo.FP26_bank_accounts', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_bank_accounts;
GO

CREATE TABLE dbo.FP26_bank_accounts
(
    id                     BIGINT          NOT NULL IDENTITY(1,1),
    company_id             BIGINT          NOT NULL,
    bank_name              VARCHAR(255)    NOT NULL,
    account_name           VARCHAR(255)        NULL,
    account_number_masked  VARCHAR(50)         NULL,
    account_type           VARCHAR(50)     NOT NULL,
    currency               VARCHAR(3)      NOT NULL DEFAULT 'USD',
    is_active              BIT             NOT NULL DEFAULT 1,
    last_sync_at           DATETIME2           NULL,
    balance                DECIMAL(15,2)       NULL DEFAULT 0,
    created_by_user_id     BIGINT              NULL,
    created_at             DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at             DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_bank_accounts PRIMARY KEY (id),
    CONSTRAINT FK_FP26_bank_accounts_company FOREIGN KEY (company_id)
        REFERENCES dbo.FP26_companies (id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_bank_accounts_creator FOREIGN KEY (created_by_user_id)
        REFERENCES dbo.FP26_users (id) ON DELETE SET NULL
);
GO
