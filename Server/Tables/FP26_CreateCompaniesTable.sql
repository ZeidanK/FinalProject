-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Run AFTER: FP26_CreateUsersTable.sql
-- Creates: FP26_companies, FP26_user_company_access
-- ============================================================

-- Drop child table first (has FKs to both companies and users)
IF OBJECT_ID('dbo.FP26_user_company_access', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_user_company_access;
GO

IF OBJECT_ID('dbo.FP26_companies', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_companies;
GO

-- ── Companies ─────────────────────────────────────────────────
CREATE TABLE dbo.FP26_companies
(
    id                  BIGINT          NOT NULL IDENTITY(1,1),
    name                VARCHAR(255)    NOT NULL,
    registration_number VARCHAR(100)        NULL,
    street              VARCHAR(255)        NULL,
    city                VARCHAR(100)        NULL,
    state               VARCHAR(100)        NULL,
    postal_code         VARCHAR(20)         NULL,
    country             VARCHAR(100)    NOT NULL DEFAULT 'USA',
    email               VARCHAR(255)        NULL,
    phone               VARCHAR(50)         NULL,
    website             VARCHAR(500)        NULL,
    tax_id              VARCHAR(100)        NULL,
    vat_number          VARCHAR(100)        NULL,
    fiscal_year_start   DATE                NULL,
    currency            VARCHAR(3)      NOT NULL DEFAULT 'USD',
    is_active           BIT             NOT NULL DEFAULT 1,
    created_by_user_id  BIGINT              NULL,
    created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_companies PRIMARY KEY (id),
    CONSTRAINT UQ_FP26_companies_registration UNIQUE (registration_number),
    CONSTRAINT FK_FP26_companies_creator FOREIGN KEY (created_by_user_id)
        REFERENCES dbo.FP26_users (id) ON DELETE SET NULL
);
GO

-- ── User-Company Access ───────────────────────────────────────
CREATE TABLE dbo.FP26_user_company_access
(
    id                   BIGINT      NOT NULL IDENTITY(1,1),
    user_id              BIGINT      NOT NULL,
    company_id           BIGINT      NOT NULL,
    access_level         VARCHAR(50) NOT NULL DEFAULT 'view_only',
    status               VARCHAR(50) NOT NULL DEFAULT 'pending',
    granted_by_user_id   BIGINT          NULL,
    revoked_by_user_id   BIGINT          NULL,
    granted_at           DATETIME2       NULL,
    revoked_at           DATETIME2       NULL,
    expires_at           DATETIME2       NULL,
    created_at           DATETIME2   NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_user_company_access PRIMARY KEY (id),
    CONSTRAINT UQ_FP26_user_company_access UNIQUE (user_id, company_id),
    CONSTRAINT FK_FP26_uca_user    FOREIGN KEY (user_id)    REFERENCES dbo.FP26_users     (id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_uca_company FOREIGN KEY (company_id) REFERENCES dbo.FP26_companies (id) ON DELETE CASCADE,
    CONSTRAINT FK_FP26_uca_granted_by FOREIGN KEY (granted_by_user_id) REFERENCES dbo.FP26_users (id),
    CONSTRAINT FK_FP26_uca_revoked_by FOREIGN KEY (revoked_by_user_id) REFERENCES dbo.FP26_users (id)
);
GO
