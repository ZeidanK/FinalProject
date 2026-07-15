-- ============================================================
-- Adds extended profile columns for accountants (bio, experience,
-- location, rate, website) plus specialty, certification, and
-- review tables.
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FP26_users' AND COLUMN_NAME = 'bio')
    ALTER TABLE dbo.FP26_users ADD bio NVARCHAR(MAX) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FP26_users' AND COLUMN_NAME = 'years_of_experience')
    ALTER TABLE dbo.FP26_users ADD years_of_experience INT NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FP26_users' AND COLUMN_NAME = 'hourly_rate')
    ALTER TABLE dbo.FP26_users ADD hourly_rate DECIMAL(10,2) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'FP26_users' AND COLUMN_NAME = 'location')
    ALTER TABLE dbo.FP26_users ADD location NVARCHAR(255) NULL;
GO

-- Accountant specialties table
IF OBJECT_ID('dbo.FP26_accountant_specialties', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_accountant_specialties
    (
        id        BIGINT IDENTITY(1,1) NOT NULL,
        user_id   BIGINT NOT NULL,
        specialty NVARCHAR(100) NOT NULL,
        CONSTRAINT PK_FP26_accountant_specialties PRIMARY KEY (id),
        CONSTRAINT FK_accountant_specialties_user FOREIGN KEY (user_id) REFERENCES dbo.FP26_users(id),
        CONSTRAINT UQ_accountant_specialty UNIQUE (user_id, specialty)
    );
END
GO

-- Accountant certifications table
IF OBJECT_ID('dbo.FP26_accountant_certifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_accountant_certifications
    (
        id            BIGINT IDENTITY(1,1) NOT NULL,
        user_id       BIGINT NOT NULL,
        certification NVARCHAR(100) NOT NULL,
        CONSTRAINT PK_FP26_accountant_certifications PRIMARY KEY (id),
        CONSTRAINT FK_accountant_certifications_user FOREIGN KEY (user_id) REFERENCES dbo.FP26_users(id),
        CONSTRAINT UQ_accountant_certification UNIQUE (user_id, certification)
    );
END
GO

-- Accountant reviews table
IF OBJECT_ID('dbo.FP26_accountant_reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FP26_accountant_reviews
    (
        id                  BIGINT IDENTITY(1,1) NOT NULL,
        accountant_user_id  BIGINT NOT NULL,
        company_id          BIGINT NOT NULL,
        rating              TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review              NVARCHAR(2000) NULL,
        created_by_user_id  BIGINT NOT NULL,
        created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_FP26_accountant_reviews PRIMARY KEY (id),
        CONSTRAINT FK_accountant_reviews_user FOREIGN KEY (accountant_user_id) REFERENCES dbo.FP26_users(id),
        CONSTRAINT FK_accountant_reviews_company FOREIGN KEY (company_id) REFERENCES dbo.FP26_companies(id),
        CONSTRAINT FK_accountant_reviews_created_by FOREIGN KEY (created_by_user_id) REFERENCES dbo.FP26_users(id),
        CONSTRAINT UQ_accountant_review UNIQUE (accountant_user_id, company_id, created_by_user_id)
    );
END
GO
