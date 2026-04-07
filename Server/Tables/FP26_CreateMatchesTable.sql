-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateInvoicesTable.sql, FP26_CreateTransactionsTable.sql
-- Creates: FP26_invoice_transaction_matches
-- ============================================================

IF OBJECT_ID('dbo.FP26_invoice_transaction_matches', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_invoice_transaction_matches;
GO

CREATE TABLE dbo.FP26_invoice_transaction_matches
(
    id                   BIGINT          NOT NULL IDENTITY(1,1),
    invoice_id           BIGINT          NOT NULL,
    transaction_id       BIGINT          NOT NULL,
    match_type           VARCHAR(50)     NOT NULL DEFAULT 'full',
    matched_amount       DECIMAL(15,2)   NOT NULL,
    match_method         VARCHAR(50)     NOT NULL,
    match_confidence     DECIMAL(5,4)        NULL,
    match_reason         VARCHAR(500)        NULL,
    matched_by_user_id   BIGINT              NULL,
    installment_number   INT                 NULL,
    installment_note     VARCHAR(200)        NULL,
    created_at           DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at           DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_matches PRIMARY KEY (id),
    CONSTRAINT FK_FP26_matches_invoice     FOREIGN KEY (invoice_id)         REFERENCES dbo.FP26_invoices     (id),
    CONSTRAINT FK_FP26_matches_transaction FOREIGN KEY (transaction_id)     REFERENCES dbo.FP26_transactions (id),
    CONSTRAINT FK_FP26_matches_user        FOREIGN KEY (matched_by_user_id) REFERENCES dbo.FP26_users        (id) ON DELETE SET NULL
);
GO
