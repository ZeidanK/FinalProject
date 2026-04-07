-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateCompaniesTable.sql
-- Creates: FP26_invoices, FP26_invoice_line_items
-- ============================================================

-- Drop child table first
IF OBJECT_ID('dbo.FP26_invoice_line_items', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_invoice_line_items;
GO

IF OBJECT_ID('dbo.FP26_invoices', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_invoices;
GO

-- ── Invoices ──────────────────────────────────────────────────
CREATE TABLE dbo.FP26_invoices
(
    id                         BIGINT          NOT NULL IDENTITY(1,1),
    company_id                 BIGINT          NOT NULL,
    invoice_number             VARCHAR(100)    NOT NULL,
    vendor_name                VARCHAR(255)    NOT NULL,
    vendor_tax_id              VARCHAR(100)        NULL,
    invoice_date               DATE            NOT NULL,
    due_date                   DATE                NULL,
    payment_date               DATE                NULL,
    subtotal                   DECIMAL(15,2)   NOT NULL DEFAULT 0,
    vat_rate                   DECIMAL(5,2)        NULL,
    vat_amount                 DECIMAL(15,2)       NULL DEFAULT 0,
    total_amount               DECIMAL(15,2)   NOT NULL,
    currency                   VARCHAR(3)      NOT NULL DEFAULT 'USD',
    file_original_name         VARCHAR(500)        NULL,
    file_path                  VARCHAR(1000)       NULL,
    file_type                  VARCHAR(50)         NULL,
    file_size                  BIGINT              NULL,
    status                     VARCHAR(50)     NOT NULL DEFAULT 'uploaded',
    ai_extraction_confidence   DECIMAL(5,4)        NULL,
    ai_processed               BIT             NOT NULL DEFAULT 0,
    is_verified                BIT             NOT NULL DEFAULT 0,
    is_matched                 BIT             NOT NULL DEFAULT 0,
    matched_amount             DECIMAL(15,2)   NOT NULL DEFAULT 0,
    last_four_digits_card      VARCHAR(4)          NULL,
    payment_plan_total_installments  INT             NULL,
    payment_plan_installment_amount DECIMAL(15,2)   NULL,
    payment_plan_frequency          VARCHAR(50)     NULL,
    payment_plan_description        VARCHAR(500)    NULL,
    item_count                      INT             NULL,
    uploaded_by_user_id        BIGINT              NULL,
    verified_by_user_id        BIGINT              NULL,
    created_at                 DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at                 DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_invoices PRIMARY KEY (id),
    CONSTRAINT UQ_FP26_invoices_number UNIQUE (company_id, invoice_number),
    CONSTRAINT FK_FP26_invoices_company    FOREIGN KEY (company_id)          REFERENCES dbo.FP26_companies (id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_invoices_uploader   FOREIGN KEY (uploaded_by_user_id) REFERENCES dbo.FP26_users    (id) ON DELETE SET NULL,
    CONSTRAINT FK_FP26_invoices_verifier   FOREIGN KEY (verified_by_user_id) REFERENCES dbo.FP26_users    (id)
);
GO

-- ── Invoice Line Items ────────────────────────────────────────
CREATE TABLE dbo.FP26_invoice_line_items
(
    id                   BIGINT          NOT NULL IDENTITY(1,1),
    invoice_id           BIGINT          NOT NULL,
    line_number          INT                 NULL,
    description          VARCHAR(MAX)    NOT NULL,
    category             VARCHAR(100)        NULL,
    quantity             DECIMAL(10,2)   NOT NULL DEFAULT 1,
    unit_price           DECIMAL(15,2)   NOT NULL,
    vat_rate             DECIMAL(5,2)        NULL,
    total_amount         DECIMAL(15,2)   NOT NULL,
    ai_confidence_score  DECIMAL(5,4)        NULL,
    created_at           DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_invoice_line_items PRIMARY KEY (id),
    CONSTRAINT FK_FP26_line_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES dbo.FP26_invoices (id) ON DELETE CASCADE
);
GO
