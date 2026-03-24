-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateBankAccountsTable.sql
-- Creates: FP26_transactions
-- ============================================================

IF OBJECT_ID('dbo.FP26_transactions', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_transactions;
GO

CREATE TABLE dbo.FP26_transactions
(
    id                   BIGINT          NOT NULL IDENTITY(1,1),
    company_id           BIGINT          NOT NULL,
    bank_account_id      BIGINT              NULL,
    transaction_date     DATE            NOT NULL,
    posted_date          DATE                NULL,
    description          VARCHAR(MAX)    NOT NULL,
    amount               DECIMAL(15,2)   NOT NULL,
    balance_after        DECIMAL(15,2)       NULL,
    transaction_type     VARCHAR(50)     NOT NULL,
    category             VARCHAR(100)        NULL,
    category_confidence  DECIMAL(5,4)        NULL,
    reference_number     VARCHAR(100)        NULL,
    is_matched           BIT             NOT NULL DEFAULT 0,
    is_duplicate         BIT             NOT NULL DEFAULT 0,
    status               VARCHAR(50)     NOT NULL DEFAULT 'confirmed',
    created_by_user_id   BIGINT              NULL,
    created_at           DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at           DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_transactions PRIMARY KEY (id),
    CONSTRAINT FK_FP26_transactions_company      FOREIGN KEY (company_id)         REFERENCES dbo.FP26_companies     (id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_transactions_bank_account FOREIGN KEY (bank_account_id)    REFERENCES dbo.FP26_bank_accounts (id) ON DELETE SET NULL,
    CONSTRAINT FK_FP26_transactions_creator      FOREIGN KEY (created_by_user_id) REFERENCES dbo.FP26_users         (id) ON DELETE SET NULL
);
GO
