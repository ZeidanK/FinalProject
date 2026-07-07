-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Creates the FP26_users table.
-- ============================================================

IF OBJECT_ID('dbo.FP26_users', 'U') IS NOT NULL
    DROP TABLE dbo.FP26_users;
GO

CREATE TABLE dbo.FP26_users
(
    id                BIGINT          NOT NULL IDENTITY(1,1),
    email             VARCHAR(255)    NOT NULL,
    password_hash     VARCHAR(255)    NOT NULL,
    name              VARCHAR(255)    NOT NULL,
    role              VARCHAR(50)     NOT NULL DEFAULT 'business_owner',
    phone             VARCHAR(50)         NULL,
    profile_picture   VARCHAR(500)        NULL,
    is_active         BIT             NOT NULL DEFAULT 1,
    is_banned         BIT             NOT NULL DEFAULT 0,
    email_verified    BIT             NOT NULL DEFAULT 0,
    email_verified_at DATETIME2           NULL,
    last_login_at     DATETIME2           NULL,
    created_at        DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at        DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_FP26_users PRIMARY KEY (id),
    CONSTRAINT UQ_FP26_users_email UNIQUE (email)
);
GO
