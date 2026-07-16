-- ============================================================
-- FinalProject - Realistic Seed Data
-- ============================================================
-- Inserts realistic-looking data into all FP26_* tables using
-- SET IDENTITY_INSERT with explicit high IDs (100+) to coexist
-- alongside any existing production/test data.
--
-- Password for ALL users: Password123!
-- SHA-512 hash: nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==
--
-- Run order: 1 -> 15 (see section markers)
-- Re-run safe: each SET IDENTITY_INSERT block is isolated.
-- ============================================================

-- ============================================================
-- 1. USERS
-- ============================================================
PRINT 'Seeding FP26_users...';
SET IDENTITY_INSERT dbo.FP26_users ON;

INSERT INTO dbo.FP26_users
    (id, email, password_hash, name, role, phone, profile_picture, is_active, is_banned, email_verified, email_verified_at, last_login_at, created_at, updated_at, is_public, bio, years_of_experience, hourly_rate, location)
VALUES
-- Admins
(100, 'sarah.chen@finmatrix.com',     'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Sarah Chen',      'admin',          '+1-212-555-0100', NULL, 1, 0, 1, '2025-06-01 09:00:00.0000000', '2026-03-10 08:30:00.0000000', '2025-06-01 09:00:00.0000000', '2025-06-01 09:00:00.0000000', 0, NULL, NULL, NULL, 'New York, NY'),
(101, 'david.rodriguez@finmatrix.com', 'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'David Rodriguez',  'admin',          '+1-312-555-0101', NULL, 1, 0, 1, '2025-06-15 10:00:00.0000000', '2026-03-09 09:15:00.0000000', '2025-06-15 10:00:00.0000000', '2025-06-15 10:00:00.0000000', 0, NULL, NULL, NULL, 'Chicago, IL'),
-- Public accountants
(102, 'michael.goldstein@cbaccounting.com', 'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Michael Goldstein', 'accountant', '+1-212-555-0102', NULL, 1, 0, 1, '2025-07-01 08:00:00.0000000', '2026-03-08 07:45:00.0000000', '2025-07-01 08:00:00.0000000', '2025-07-01 08:00:00.0000000', 1, 'Certified Public Accountant with over 15 years of experience providing comprehensive tax preparation, bookkeeping, and financial advisory services to small and medium-sized businesses across the New York metropolitan area. Specializing in construction and real estate accounting.', 15, 150.00, 'New York, NY'),
(103, 'rachel.cohen@cohencpa.com',  'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Rachel Cohen',     'accountant', '+1-617-555-0103', NULL, 1, 0, 1, '2025-08-10 09:30:00.0000000', '2026-03-07 08:00:00.0000000', '2025-08-10 09:30:00.0000000', '2025-08-10 09:30:00.0000000', 1, 'Dedicated CPA offering full-service bookkeeping, payroll management, and tax planning for startups and non-profit organizations. Passionate about helping small businesses maintain clean financial records and achieve long-term financial stability.', 12, 120.00, 'Boston, MA'),
(104, 'james.mitchell@mitchell-financial.com', 'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'James Mitchell',   'accountant', '+1-415-555-0104', NULL, 1, 0, 1, '2025-09-05 11:00:00.0000000', '2026-03-06 10:30:00.0000000', '2025-09-05 11:00:00.0000000', '2025-09-05 11:00:00.0000000', 1, 'Seasoned financial professional with 20 years of experience in audit and assurance, business valuation, and strategic financial planning. Trusted advisor to technology companies and professional services firms throughout the San Francisco Bay Area.', 20, 200.00, 'San Francisco, CA'),
(105, 'emily.watson@watsonadvisory.com', 'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Dr. Emily Watson', 'accountant', '+1-312-555-0105', NULL, 1, 0, 1, '2025-10-01 07:45:00.0000000', '2026-03-05 09:00:00.0000000', '2025-10-01 07:45:00.0000000', '2025-10-01 07:45:00.0000000', 1, 'Forensic accounting expert with a PhD in Accounting and 18 years of experience in fraud investigation, litigation support, and business valuation. Court-qualified expert witness in financial matters. Serves clients across the Midwest.', 18, 175.00, 'Chicago, IL'),
(106, 'amir.hashemi@hashemicpa.com', 'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Amir Hashemi',    'accountant', '+1-213-555-0106', NULL, 1, 0, 1, '2025-11-01 10:15:00.0000000', '2026-03-04 07:30:00.0000000', '2025-11-01 10:15:00.0000000', '2025-11-01 10:15:00.0000000', 1, 'CPA specializing in real estate and construction accounting. Providing tax planning, entity structuring, and financial reporting for developers, contractors, and property management firms throughout Southern California.', 8, 85.00, 'Los Angeles, CA'),
-- Business owners
(107, 'jonathan@bakergroup.com', 'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Jonathan Baker',   'business_owner', '+1-212-555-0107', NULL, 1, 0, 1, '2025-07-15 14:00:00.0000000', '2026-03-10 08:00:00.0000000', '2025-07-15 14:00:00.0000000', '2025-07-15 14:00:00.0000000', 0, NULL, NULL, NULL, 'New York, NY'),
(108, 'lisa.park@paltech.io',      'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Lisa Park',        'business_owner', '+1-415-555-0108', NULL, 1, 0, 1, '2025-08-20 11:30:00.0000000', '2026-03-09 10:00:00.0000000', '2025-08-20 11:30:00.0000000', '2025-08-20 11:30:00.0000000', 0, NULL, NULL, NULL, 'San Francisco, CA'),
(109, 'omar@medinaclinic.com',     'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Omar Al-Rashid',   'business_owner', '+1-312-555-0109', NULL, 1, 0, 1, '2025-09-10 09:00:00.0000000', '2026-03-08 10:30:00.0000000', '2025-09-10 09:00:00.0000000', '2025-09-10 09:00:00.0000000', 0, NULL, NULL, NULL, 'Chicago, IL'),
(110, 'nina@harborviews.com',      'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Nina Kowalski',    'business_owner', '+1-305-555-0110', NULL, 1, 0, 1, '2025-10-05 13:00:00.0000000', '2026-03-07 11:00:00.0000000', '2025-10-05 13:00:00.0000000', '2025-10-05 13:00:00.0000000', 0, NULL, NULL, NULL, 'Miami, FL'),
(111, 'tom@obrienlogistics.com',  'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Thomas O''Brien',  'business_owner', '+1-973-555-0111', NULL, 1, 0, 1, '2025-11-05 10:00:00.0000000', '2026-03-06 08:15:00.0000000', '2025-11-05 10:00:00.0000000', '2025-11-05 10:00:00.0000000', 0, NULL, NULL, NULL, 'Newark, NJ'),
(112, 'yuki@tokyobites.com',       'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Yuki Tanaka',      'business_owner', '+1-213-555-0112', NULL, 1, 0, 1, '2025-12-01 12:00:00.0000000', '2026-03-05 12:00:00.0000000', '2025-12-01 12:00:00.0000000', '2025-12-01 12:00:00.0000000', 0, NULL, NULL, NULL, 'Los Angeles, CA'),
(113, 'fatima@greenleaf.com',       'nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==', 'Fatima Mensah',    'business_owner', '+1-503-555-0113', NULL, 1, 0, 1, '2025-11-20 09:30:00.0000000', '2026-03-04 09:45:00.0000000', '2025-11-20 09:30:00.0000000', '2025-11-20 09:30:00.0000000', 0, NULL, NULL, NULL, 'Portland, OR');

SET IDENTITY_INSERT dbo.FP26_users OFF;
GO
-- ============================================================
-- 2. ACCOUNTANT SPECIALTIES
-- ============================================================
PRINT 'Seeding FP26_accountant_specialties...';
SET IDENTITY_INSERT dbo.FP26_accountant_specialties ON;

INSERT INTO dbo.FP26_accountant_specialties (id, user_id, specialty)
VALUES
-- Michael Goldstein
(100, 102, 'Tax Preparation & Planning'),
(101, 102, 'Small Business Accounting'),
(102, 102, 'Payroll Management'),
(103, 102, 'Construction Accounting'),
-- Rachel Cohen
(104, 103, 'Bookkeeping'),
(105, 103, 'Payroll Services'),
(106, 103, 'Non-Profit Accounting'),
(107, 103, 'Startup Financial Setup'),
-- James Mitchell
(108, 104, 'Audit & Assurance'),
(109, 104, 'Financial Planning'),
(110, 104, 'Business Valuation'),
(111, 104, 'Tech Industry Accounting'),
-- Dr. Emily Watson
(112, 105, 'Forensic Accounting'),
(113, 105, 'Litigation Support'),
(114, 105, 'Fraud Investigation'),
(115, 105, 'Business Valuation'),
-- Amir Hashemi
(116, 106, 'Real Estate Accounting'),
(117, 106, 'Construction Accounting'),
(118, 106, 'Tax Planning'),
(119, 106, 'Entity Structuring');

SET IDENTITY_INSERT dbo.FP26_accountant_specialties OFF;
GO

-- ============================================================
-- 3. ACCOUNTANT CERTIFICATIONS
-- ============================================================
PRINT 'Seeding FP26_accountant_certifications...';
SET IDENTITY_INSERT dbo.FP26_accountant_certifications ON;

INSERT INTO dbo.FP26_accountant_certifications (id, user_id, certification)
VALUES
(100, 102, 'CPA - Certified Public Accountant'),
(101, 102, 'QuickBooks ProAdvisor'),
(102, 103, 'CPA - Certified Public Accountant'),
(103, 103, 'CMA - Certified Management Accountant'),
(104, 104, 'CPA - Certified Public Accountant'),
(105, 104, 'CFA - Chartered Financial Analyst'),
(106, 104, 'ABV - Accredited in Business Valuation'),
(107, 105, 'CPA - Certified Public Accountant'),
(108, 105, 'CFE - Certified Fraud Examiner'),
(109, 105, 'CFF - Certified in Financial Forensics'),
(110, 106, 'CPA - Certified Public Accountant'),
(111, 106, 'EA - Enrolled Agent');

SET IDENTITY_INSERT dbo.FP26_accountant_certifications OFF;
GO

-- ============================================================
-- 4. COMPANIES
-- ============================================================
PRINT 'Seeding FP26_companies...';
SET IDENTITY_INSERT dbo.FP26_companies ON;

INSERT INTO dbo.FP26_companies
    (id, name, registration_number, street, city, state, postal_code, country, email, phone, tax_id, vat_number, fiscal_year_start, currency, is_active, created_by_user_id, created_at, updated_at)
VALUES
(100, 'Baker Construction Group',     'NY-BCG-2020-001', '450 7th Avenue, Suite 1200', 'New York',      'NY', '10001', 'USA', 'info@bakergroup.com',    '+1-212-555-2000', '13-4567890', NULL, '2024-01-01', 'USD', 1, 107, '2025-07-15 14:30:00.0000000', '2025-07-15 14:30:00.0000000'),
(101, 'PAL Technologies Ltd',         'CA-PAL-2019-045', '340 Innovation Drive',         'San Francisco', 'CA', '94105',  'USA', 'hello@paltech.io',       '+1-415-555-2001', '94-1234567', NULL, '2024-01-01', 'USD', 1, 108, '2025-08-20 12:00:00.0000000', '2025-08-20 12:00:00.0000000'),
(102, 'Medina Medical Clinic',        'IL-MMC-2018-102', '5801 S Ellis Ave, Suite 300',  'Chicago',       'IL', '60637',  'USA', 'admin@medinaclinic.com', '+1-312-555-2002', '36-7890123', NULL, '2024-07-01', 'USD', 1, 109, '2025-09-10 09:30:00.0000000', '2025-09-10 09:30:00.0000000'),
(103, 'Harbor View Hospitality Inc',  'FL-HVH-2017-089', '200 Biscayne Blvd Way, Suite 400', 'Miami',     'FL', '33131',  'USA', 'contact@harborviews.com', '+1-305-555-2003', '59-4567890', NULL, '2024-01-01', 'USD', 1, 110, '2025-10-05 13:30:00.0000000', '2025-10-05 13:30:00.0000000'),
(104, 'O''Brien Logistics Corp',      'NJ-OBL-2016-215', '440 Frelinghuysen Ave',         'Newark',        'NJ', '07114',  'USA', 'dispatch@obrienlogistics.com', '+1-973-555-2004', '22-5678901', NULL, '2024-01-01', 'USD', 1, 111, '2025-11-05 10:30:00.0000000', '2025-11-05 10:30:00.0000000'),
(105, 'Tokyo Bites Restaurant LLC',   'CA-TBR-2021-033', '123 Astronaut E S Onizuka St, Suite 101', 'Los Angeles', 'CA', '90012', 'USA', 'info@tokyobites.com',    '+1-213-555-2005', '95-6789012', NULL, '2024-01-01', 'USD', 1, 112, '2025-12-01 12:30:00.0000000', '2025-12-01 12:30:00.0000000'),
(106, 'GreenLeaf Organic Grocers',    'OR-GOG-2020-178', '850 SE Hawthorne Blvd',         'Portland',      'OR', '97214',  'USA', 'hello@greenleaf.com',     '+1-503-555-2006', '93-7890123', NULL, '2024-07-01', 'USD', 1, 113, '2025-11-20 10:00:00.0000000', '2025-11-20 10:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_companies OFF;
GO

-- ============================================================
-- 5. USER-COMPANY ACCESS
-- ============================================================
PRINT 'Seeding FP26_user_company_access...';
SET IDENTITY_INSERT dbo.FP26_user_company_access ON;

INSERT INTO dbo.FP26_user_company_access
    (id, user_id, company_id, access_level, status, granted_by_user_id, revoked_by_user_id, granted_at, revoked_at, expires_at, created_at)
VALUES
-- Owners -> their own companies (full access, active)
(100, 107, 100, 'full', 'active', 107, NULL, '2025-07-15 14:30:00.0000000', NULL, NULL, '2025-07-15 14:30:00.0000000'),
(101, 108, 101, 'full', 'active', 108, NULL, '2025-08-20 12:00:00.0000000', NULL, NULL, '2025-08-20 12:00:00.0000000'),
(102, 109, 102, 'full', 'active', 109, NULL, '2025-09-10 09:30:00.0000000', NULL, NULL, '2025-09-10 09:30:00.0000000'),
(103, 110, 103, 'full', 'active', 110, NULL, '2025-10-05 13:30:00.0000000', NULL, NULL, '2025-10-05 13:30:00.0000000'),
(104, 111, 104, 'full', 'active', 111, NULL, '2025-11-05 10:30:00.0000000', NULL, NULL, '2025-11-05 10:30:00.0000000'),
(105, 112, 105, 'full', 'active', 112, NULL, '2025-12-01 12:30:00.0000000', NULL, NULL, '2025-12-01 12:30:00.0000000'),
(106, 113, 106, 'full', 'active', 113, NULL, '2025-11-20 10:00:00.0000000', NULL, NULL, '2025-11-20 10:00:00.0000000'),
-- Accountant access
(107, 102, 100, 'full', 'active',   107, NULL, '2026-01-10 09:00:00.0000000', NULL, NULL, '2026-01-10 09:00:00.0000000'),
(108, 102, 102, 'full', 'active',   109, NULL, '2026-01-15 10:00:00.0000000', NULL, NULL, '2026-01-15 10:00:00.0000000'),
(109, 103, 101, 'full', 'active',   108, NULL, '2026-01-12 11:00:00.0000000', NULL, NULL, '2026-01-12 11:00:00.0000000'),
(110, 103, 106, 'full', 'pending',  113, NULL, NULL,                            NULL, NULL, '2026-02-01 14:00:00.0000000'),
(111, 104, 103, 'full', 'active',   110, NULL, '2026-01-20 09:30:00.0000000', NULL, NULL, '2026-01-20 09:30:00.0000000'),
(112, 104, 104, 'view_only', 'active', 111, NULL, '2026-01-22 08:00:00.0000000', NULL, NULL, '2026-01-22 08:00:00.0000000'),
(113, 105, 105, 'full', 'pending',  112, NULL, NULL,                            NULL, NULL, '2026-02-05 15:00:00.0000000'),
(114, 106, 100, 'full', 'active',   107, NULL, '2026-01-25 10:00:00.0000000', NULL, NULL, '2026-01-25 10:00:00.0000000'),
(115, 106, 105, 'view_only', 'active', 112, NULL, '2026-02-01 11:00:00.0000000', NULL, NULL, '2026-02-01 11:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_user_company_access OFF;
GO

-- ============================================================
-- 6. BANK ACCOUNTS
-- ============================================================
PRINT 'Seeding FP26_bank_accounts...';
SET IDENTITY_INSERT dbo.FP26_bank_accounts ON;

INSERT INTO dbo.FP26_bank_accounts
    (id, company_id, bank_name, account_name, account_number_masked, account_type, currency, is_active, last_sync_at, balance, created_by_user_id, created_at, updated_at)
VALUES
-- Baker Construction Group (company 100)
(100, 100, 'JPMorgan Chase',       'Baker Construction - Business Checking', '****4532', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000',  847520.00, 107, '2025-07-15 15:00:00.0000000', '2025-07-15 15:00:00.0000000'),
(101, 100, 'JPMorgan Chase',       'Baker Construction - Business Savings',  '****7891', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000', 2150000.00, 107, '2025-07-15 15:00:00.0000000', '2025-07-15 15:00:00.0000000'),
-- PAL Technologies (company 101)
(102, 101, 'Silicon Valley Bank',  'PAL Technologies - Operating Account',   '****1123', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000', 1230450.00, 108, '2025-08-20 12:30:00.0000000', '2025-08-20 12:30:00.0000000'),
(103, 101, 'First Republic Bank',  'PAL Technologies - Reserve Account',     '****4456', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000', 3500000.00, 108, '2025-08-20 12:30:00.0000000', '2025-08-20 12:30:00.0000000'),
-- Medina Medical Clinic (company 102)
(104, 102, 'Bank of America',      'Medina Medical - Business Checking',     '****3321', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000',  520800.00, 109, '2025-09-10 10:00:00.0000000', '2025-09-10 10:00:00.0000000'),
(105, 102, 'Bank of America',      'Medina Medical - Money Market Savings',  '****8877', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000', 1100000.00, 109, '2025-09-10 10:00:00.0000000', '2025-09-10 10:00:00.0000000'),
-- Harbor View Hospitality (company 103)
(106, 103, 'Wells Fargo',          'Harbor View - Business Checking',        '****5544', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000',  312450.00, 110, '2025-10-05 14:00:00.0000000', '2025-10-05 14:00:00.0000000'),
(107, 103, 'Wells Fargo',          'Harbor View - Business Savings',         '****9988', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000',  890000.00, 110, '2025-10-05 14:00:00.0000000', '2025-10-05 14:00:00.0000000'),
-- O'Brien Logistics (company 104)
(108, 104, 'PNC Bank',             'O''Brien Logistics - Business Checking', '****2211', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000',  675300.00, 111, '2025-11-05 11:00:00.0000000', '2025-11-05 11:00:00.0000000'),
(109, 104, 'PNC Bank',             'O''Brien Logistics - Business Savings',  '****6677', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000', 1450000.00, 111, '2025-11-05 11:00:00.0000000', '2025-11-05 11:00:00.0000000'),
-- Tokyo Bites (company 105)
(110, 105, 'JPMorgan Chase',       'Tokyo Bites - Business Checking',        '****9900', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000',  145200.00, 112, '2025-12-01 13:00:00.0000000', '2025-12-01 13:00:00.0000000'),
(111, 105, 'JPMorgan Chase',       'Tokyo Bites - Business Savings',         '****3344', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000',  380000.00, 112, '2025-12-01 13:00:00.0000000', '2025-12-01 13:00:00.0000000'),
-- GreenLeaf Organic Grocers (company 106)
(112, 106, 'U.S. Bank',            'GreenLeaf - Business Checking',          '****7766', 'Checking', 'USD', 1, '2026-03-10 06:00:00.0000000',  210800.00, 113, '2025-11-20 10:30:00.0000000', '2025-11-20 10:30:00.0000000'),
(113, 106, 'U.S. Bank',            'GreenLeaf - Business Savings',           '****2233', 'Savings',  'USD', 1, '2026-03-10 06:00:00.0000000',  520000.00, 113, '2025-11-20 10:30:00.0000000', '2025-11-20 10:30:00.0000000');

SET IDENTITY_INSERT dbo.FP26_bank_accounts OFF;
GO

-- ============================================================
-- 7. ACCOUNTANT REVIEWS
-- ============================================================
PRINT 'Seeding FP26_accountant_reviews...';
SET IDENTITY_INSERT dbo.FP26_accountant_reviews ON;

INSERT INTO dbo.FP26_accountant_reviews
    (id, accountant_user_id, company_id, rating, review, created_by_user_id, created_at, updated_at)
VALUES
(100, 102, 100, 5, 'Michael has been an exceptional accountant for our construction business. His knowledge of construction accounting and tax planning has saved us significantly on our quarterly filings. Highly responsive and professional.', 107, '2026-02-20 10:00:00.0000000', '2026-02-20 10:00:00.0000000'),
(101, 102, 102, 4, 'Great attention to detail and very responsive to our needs as a medical practice. He took the time to understand our unique revenue cycle. Only feedback is faster response time during tax season.', 109, '2026-02-22 11:30:00.0000000', '2026-02-22 11:30:00.0000000'),
(102, 103, 101, 5, 'Rachel streamlined our entire bookkeeping process in just two weeks. She set up our charts of accounts, connected our payment gateways, and trained our team. Highly recommend for tech startups.', 108, '2026-03-01 09:00:00.0000000', '2026-03-01 09:00:00.0000000'),
(103, 104, 103, 5, 'James provided excellent audit preparation services. His hospitality industry expertise was invaluable during our annual review. He identified several tax credits we had been missing.', 110, '2026-03-02 14:00:00.0000000', '2026-03-02 14:00:00.0000000'),
(104, 104, 104, 4, 'Good financial planning advice for our logistics company. Helped us optimize our fleet leasing structure and improve cash flow projections. Knowledgeable but premium pricing.', 111, '2026-03-03 10:30:00.0000000', '2026-03-03 10:30:00.0000000'),
(105, 106, 100, 5, 'Amir understands construction accounting inside and out. For his rate, the value is outstanding. He helped us set up job-costing reports that transformed how we track project profitability.', 107, '2026-03-05 08:00:00.0000000', '2026-03-05 08:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_accountant_reviews OFF;
GO
-- ============================================================
-- 8. TRANSACTIONS
-- ============================================================
PRINT 'Seeding FP26_transactions...';
SET IDENTITY_INSERT dbo.FP26_transactions ON;

INSERT INTO dbo.FP26_transactions
    (id, company_id, transaction_date, posted_date, description, vendor_name, card_last4, amount, transaction_type, category, category_confidence, reference_number, charge_amount, charge_currency, original_currency, exchange_rate, requires_invoice, is_matched, is_anomaly, is_duplicate, status, created_by_user_id, created_at, updated_at)
VALUES
-- -- Company 100 - Baker Construction Group (IDs 1000-1014) --
(1000, 100, '2026-01-05', '2026-01-06', 'Office rent - January 2026',      'Silverstein Properties Inc', '4532',  12500.00, 'debit',  'Rent & Leases',     NULL, 'INV-45678',         NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 107, '2026-01-05 09:00:00.0000000', '2026-01-05 09:00:00.0000000'),
(1001, 100, '2026-01-08', '2026-01-09', 'Steel rebar purchase - PO-2026-001', 'US Steel Supply Co',      '4532',  48320.00, 'debit',  'Materials',         NULL, 'PO-2026-001',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 107, '2026-01-08 10:00:00.0000000', '2026-01-08 10:00:00.0000000'),
(1002, 100, '2026-01-10', NULL,       'Weekly payroll - Week 1',            'ADP TotalSource',           NULL,    38400.00, 'debit',  'Payroll',           NULL, 'PAY-2026-W1',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 107, '2026-01-10 14:00:00.0000000', '2026-01-10 14:00:00.0000000'),
(1003, 100, '2026-01-12', '2026-01-13', 'Concrete delivery - 1201 Broadway',  'ReadyMix Concrete Inc',   '4532',  15750.00, 'debit',  'Materials',         NULL, 'PO-2026-003',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 107, '2026-01-12 11:00:00.0000000', '2026-01-12 11:00:00.0000000'),
(1004, 100, '2026-01-15', '2026-01-16', 'Equipment rental - Mini excavators', 'Herc Rentals Inc',          '4532',   8400.00, 'debit',  'Equipment',         NULL, 'RNT-2026-012',      NULL, NULL, NULL, NULL, 1, 0, 1, 0, 'confirmed', 107, '2026-01-15 09:30:00.0000000', '2026-01-15 09:30:00.0000000'),
(1005, 100, '2026-01-18', '2026-01-19', 'Electrical supplies - Project Phoenix','Graybar Electric Co',     '4532',   6230.00, 'debit',  'Materials',         NULL, 'PO-2026-007',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 107, '2026-01-18 08:00:00.0000000', '2026-01-18 08:00:00.0000000'),
(1006, 100, '2026-01-22', NULL,       'General liability insurance premium',  'Liberty Mutual Insurance',  '4532',  22500.00, 'debit',  'Insurance',         NULL, 'POL-2026-001',      NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 107, '2026-01-22 10:00:00.0000000', '2026-01-22 10:00:00.0000000'),
(1007, 100, '2026-01-25', '2026-01-26', 'Lumber supply - Framing materials',  'Home Depot Pro',            '4532',  18900.00, 'debit',  'Materials',         NULL, 'PO-2026-010',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 107, '2026-01-25 07:45:00.0000000', '2026-01-25 07:45:00.0000000'),
(1008, 100, '2026-02-01', '2026-02-02', 'Office rent - February 2026',       'Silverstein Properties Inc', '4532', 12500.00, 'debit',  'Rent & Leases',     NULL, 'INV-45712',         NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 107, '2026-02-01 09:00:00.0000000', '2026-02-01 09:00:00.0000000'),
(1009, 100, '2026-02-05', NULL,       'Weekly payroll - Week 5',            'ADP TotalSource',           NULL,    38400.00, 'debit',  'Payroll',           NULL, 'PAY-2026-W5',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 107, '2026-02-05 14:00:00.0000000', '2026-02-05 14:00:00.0000000'),
(1010, 100, '2026-02-08', '2026-02-08', 'Client payment - 1201 Broadway project','Related Companies',      NULL,   250000.00, 'credit', 'Revenue',           NULL, 'INV-2026-001',      NULL, NULL, NULL, NULL, 0, 1, 1, 0, 'confirmed', 107, '2026-02-08 16:00:00.0000000', '2026-02-08 16:00:00.0000000'),
(1011, 100, '2026-02-10', '2026-02-11', 'HVAC equipment - Project Phoenix',    'Trane Technologies',       '4532',  34200.00, 'debit',  'Materials',         NULL, 'PO-2026-015',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 107, '2026-02-10 10:30:00.0000000', '2026-02-10 10:30:00.0000000'),
(1012, 100, '2026-02-14', '2026-02-15', 'Fuel card - Fleet vehicles',        'Shell Fleet Solutions',     '8912',   3450.00, 'debit',  'Fuel',              NULL, 'FL-2026-008',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 107, '2026-02-14 08:00:00.0000000', '2026-02-14 08:00:00.0000000'),
(1013, 100, '2026-02-18', NULL,       'Subcontractor payment - Drywall',     'Ace Drywall & Plaster Inc',  NULL,   28750.00, 'debit',  'Subcontractors',    NULL, 'INV-2026-015',      NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 107, '2026-02-18 11:00:00.0000000', '2026-02-18 11:00:00.0000000'),
(1014, 100, '2026-02-22', '2026-02-23', 'Safety equipment and PPE',           '3M Safety Solutions',       '4532',   4120.00, 'debit',  'Supplies',          NULL, 'PO-2026-020',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 107, '2026-02-22 09:15:00.0000000', '2026-02-22 09:15:00.0000000'),
-- -- Company 101 - PAL Technologies (IDs 1015-1028) --
(1015, 101, '2026-01-03', '2026-01-04', 'AWS Cloud Services - December 2025',    'Amazon Web Services',    '1123',  24560.00, 'debit',  'Cloud Infrastructure', NULL, 'AWS-202512',   NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 108, '2026-01-03 08:00:00.0000000', '2026-01-03 08:00:00.0000000'),
(1016, 101, '2026-01-07', '2026-01-08', 'GitHub Enterprise - Annual renewal',    'GitHub Inc',              '1123',   8400.00, 'debit',  'Software',          NULL, 'INV-GH-2026',  NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 108, '2026-01-07 09:00:00.0000000', '2026-01-07 09:00:00.0000000'),
(1017, 101, '2026-01-10', '2026-01-11', 'Office rent - January 2026',            'Tishman Speyer Properties','1123', 18000.00, 'debit',  'Rent & Leases',     NULL, 'RENT-JAN-2026', NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 108, '2026-01-10 10:00:00.0000000', '2026-01-10 10:00:00.0000000'),
(1018, 101, '2026-01-12', '2026-01-13', 'Stripe processing fees - December',     'Stripe Inc',              NULL,    6230.00, 'debit',  'Payment Processing',NULL, 'STP-202512',    NULL, NULL, NULL, NULL, 0, 0, 1, 0, 'confirmed', 108, '2026-01-12 12:00:00.0000000', '2026-01-12 12:00:00.0000000'),
(1019, 101, '2026-01-15', '2026-01-16', 'Slack Enterprise - Annual plan',        'Slack Technologies',      '1123',   3600.00, 'debit',  'Software',          NULL, 'SLK-2026-01',  NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 108, '2026-01-15 07:30:00.0000000', '2026-01-15 07:30:00.0000000'),
(1020, 101, '2026-01-18', '2026-01-19', 'Zoom Video Pro - 50 hosts',             'Zoom Video Communications','1123',  1800.00, 'debit',  'Software',          NULL, 'ZM-2026-001',  NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 108, '2026-01-18 10:00:00.0000000', '2026-01-18 10:00:00.0000000'),
(1021, 101, '2026-01-22', '2026-01-23', 'LinkedIn Recruiter - Monthly',          'LinkedIn Corporation',    '1123',   2400.00, 'debit',  'Recruiting',        NULL, 'LI-2026-01',   NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 108, '2026-01-22 09:00:00.0000000', '2026-01-22 09:00:00.0000000'),
(1022, 101, '2026-01-25', '2026-01-26', 'Datadog Monitoring - December',         'Datadog Inc',             '1123',   4890.00, 'debit',  'Cloud Infrastructure', NULL, 'DD-202512',    NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 108, '2026-01-25 11:00:00.0000000', '2026-01-25 11:00:00.0000000'),
(1023, 101, '2026-01-28', '2026-01-29', 'Google Workspace - 50 users',           'Google LLC',              '1123',   1250.00, 'debit',  'Software',          NULL, 'GW-2026-01',   NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 108, '2026-01-28 08:00:00.0000000', '2026-01-28 08:00:00.0000000'),
(1024, 101, '2026-02-01', '2026-02-01', 'Client payment - API licensing Q1',     'DataStream Solutions Inc', NULL,  125000.00, 'credit', 'Revenue',           NULL, 'INV-2026-101', NULL, NULL, NULL, NULL, 0, 1, 0, 0, 'confirmed', 108, '2026-02-01 17:00:00.0000000', '2026-02-01 17:00:00.0000000'),
(1025, 101, '2026-02-04', '2026-02-05', 'Twilio SMS & Voice - January',          'Twilio Inc',              '1123',   3420.00, 'debit',  'Communications',    NULL, 'TW-202601',    NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 108, '2026-02-04 10:00:00.0000000', '2026-02-04 10:00:00.0000000'),
(1026, 101, '2026-02-08', '2026-02-09', 'Heroku PaaS - February hosting',        'Salesforce Inc',          '1123',   5600.00, 'debit',  'Cloud Infrastructure', NULL, 'HK-202602',    NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 108, '2026-02-08 08:30:00.0000000', '2026-02-08 08:30:00.0000000'),
(1027, 101, '2026-02-12', NULL,       'Employee health insurance - February',    'Blue Shield of California',NULL,   14200.00, 'debit',  'Benefits',          NULL, 'INS-2026-02',  NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 108, '2026-02-12 14:00:00.0000000', '2026-02-12 14:00:00.0000000'),
(1028, 101, '2026-02-15', '2026-02-16', 'HubSpot CRM - Enterprise plan',         'HubSpot Inc',             '1123',   2800.00, 'debit',  'Software',          NULL, 'HS-2026-02',   NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 108, '2026-02-15 09:00:00.0000000', '2026-02-15 09:00:00.0000000'),
-- -- Company 102 - Medina Medical Clinic (IDs 1029-1042) --
(1029, 102, '2026-01-06', '2026-01-07', 'Medical supplies - January order',       'McKesson Medical-Surgical','3321', 42300.00, 'debit',  'Medical Supplies',  NULL, 'PO-2026-001',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 109, '2026-01-06 08:00:00.0000000', '2026-01-06 08:00:00.0000000'),
(1030, 102, '2026-01-09', '2026-01-10', 'Practice management software - monthly', 'Practice Fusion Inc',     '3321',   3600.00, 'debit',  'Software',          NULL, 'PF-2026-01',        NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 109, '2026-01-09 09:00:00.0000000', '2026-01-09 09:00:00.0000000'),
(1031, 102, '2026-01-12', '2026-01-13', 'Office rent - January 2026',             'UChicago Medical Properties','3321',22000.00, 'debit',  'Rent & Leases',     NULL, 'RENT-JAN',          NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 109, '2026-01-12 10:00:00.0000000', '2026-01-12 10:00:00.0000000'),
(1032, 102, '2026-01-15', '2026-01-16', 'Pharmaceutical order - Maintenance drugs','Cardinal Health Inc',    '3321',  28400.00, 'debit',  'Pharmacy',          NULL, 'PO-2026-004',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 109, '2026-01-15 07:30:00.0000000', '2026-01-15 07:30:00.0000000'),
(1033, 102, '2026-01-18', '2026-01-19', 'Lab testing services - December',        'Quest Diagnostics Inc',   '3321',   8750.00, 'debit',  'Lab Services',      NULL, 'INV-Q-202512',     NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 109, '2026-01-18 11:00:00.0000000', '2026-01-18 11:00:00.0000000'),
(1034, 102, '2026-01-22', '2026-01-22', 'Insurance reimbursement - Blue Cross',   'Blue Cross Blue Shield IL',NULL, 156000.00, 'credit', 'Insurance Revenue',  NULL, 'REMIT-2026-01',    NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 109, '2026-01-22 16:00:00.0000000', '2026-01-22 16:00:00.0000000'),
(1035, 102, '2026-01-25', '2026-01-26', 'Equipment lease - MRI machine',          'GE Healthcare Financial',  '3321',  18500.00, 'debit',  'Equipment Lease',   NULL, 'GE-LEASE-001',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 109, '2026-01-25 10:00:00.0000000', '2026-01-25 10:00:00.0000000'),
(1036, 102, '2026-01-28', '2026-01-29', 'Biohazard waste disposal',               'Stericycle Inc',          '3321',   2300.00, 'debit',  'Waste Management',  NULL, 'STR-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 109, '2026-01-28 08:00:00.0000000', '2026-01-28 08:00:00.0000000'),
(1037, 102, '2026-02-02', '2026-02-03', 'Medical supplies - February order',      'McKesson Medical-Surgical','3321', 38900.00, 'debit',  'Medical Supplies',  NULL, 'PO-2026-008',       NULL, NULL, NULL, NULL, 1, 0, 1, 0, 'confirmed', 109, '2026-02-02 08:30:00.0000000', '2026-02-02 08:30:00.0000000'),
(1038, 102, '2026-02-05', NULL,       'Payroll - Physicians and staff',           'ADP Medical Solutions',   NULL,    95000.00, 'debit',  'Payroll',           NULL, 'PAY-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 109, '2026-02-05 14:00:00.0000000', '2026-02-05 14:00:00.0000000'),
(1039, 102, '2026-02-10', '2026-02-11', 'EHR system support renewal',             'Epic Systems Corporation', '3321', 12000.00, 'debit',  'Software',          NULL, 'EPIC-RENEW-2026',   NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 109, '2026-02-10 09:00:00.0000000', '2026-02-10 09:00:00.0000000'),
(1040, 102, '2026-02-14', '2026-02-15', 'Janitorial services',                    'ABM Healthcare Services', '3321',   4500.00, 'debit',  'Facilities',        NULL, 'ABM-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 109, '2026-02-14 10:00:00.0000000', '2026-02-14 10:00:00.0000000'),
(1041, 102, '2026-02-18', '2026-02-19', 'Patient refund - Overpayment',           NULL,                      '3321',   1200.00, 'debit',  'Refunds',           NULL, 'RFD-2026-003',      NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 109, '2026-02-18 12:00:00.0000000', '2026-02-18 12:00:00.0000000'),
(1042, 102, '2026-02-22', '2026-02-22', 'Medicare reimbursement - January',       'Centers for Medicare & Medicaid', NULL, 210000.00, 'credit', 'Insurance Revenue', NULL, 'CMS-202601',        NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 109, '2026-02-22 16:30:00.0000000', '2026-02-22 16:30:00.0000000'),
-- -- Company 103 - Harbor View Hospitality (IDs 1043-1056) --
(1043, 103, '2026-01-04', '2026-01-05', 'Food supply - Main kitchen',            'Sysco Miami',              '5544',  34500.00, 'debit',  'Food & Beverage',   NULL, 'SYS-2026-001',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 110, '2026-01-04 06:00:00.0000000', '2026-01-04 06:00:00.0000000'),
(1044, 103, '2026-01-07', '2026-01-08', 'Hotel booking commission - Expedia',    'Expedia Group',            '5544',   8900.00, 'debit',  'Commissions',       NULL, 'EXP-2026-01',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 110, '2026-01-07 09:00:00.0000000', '2026-01-07 09:00:00.0000000'),
(1045, 103, '2026-01-10', '2026-01-11', 'Linen and laundry services',            'UniFirst Hospitality',     '5544',   5200.00, 'debit',  'Operations',        NULL, 'UNI-2026-01',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 110, '2026-01-10 07:00:00.0000000', '2026-01-10 07:00:00.0000000'),
(1046, 103, '2026-01-14', '2026-01-15', 'Beverage supply - Bar inventory',       'Southern Glazers Wine & Spirits','5544', 12800.00, 'debit', 'Food & Beverage',   NULL, 'SGWS-2026-001',    NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 110, '2026-01-14 11:00:00.0000000', '2026-01-14 11:00:00.0000000'),
(1047, 103, '2026-01-18', '2026-01-19', 'Property management fee - January',     'Ocean Property Management', '5544',  9000.00, 'debit',  'Management Fees',   NULL, 'OPM-2026-01',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 110, '2026-01-18 08:00:00.0000000', '2026-01-18 08:00:00.0000000'),
(1048, 103, '2026-01-22', NULL,       'Payroll - Hotel staff',                   'ADP Hospitality',          NULL,    62000.00, 'debit',  'Payroll',           NULL, 'PAY-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 110, '2026-01-22 14:00:00.0000000', '2026-01-22 14:00:00.0000000'),
(1049, 103, '2026-01-25', '2026-01-26', 'Pest control service',                  'Terminix Commercial',      '5544',    850.00, 'debit',  'Facilities',        NULL, 'TRM-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 110, '2026-01-25 09:00:00.0000000', '2026-01-25 09:00:00.0000000'),
(1050, 103, '2026-01-28', '2026-01-29', 'Pool maintenance - January',            'AquaClear Pool Services',  '5544',   1400.00, 'debit',  'Facilities',        NULL, 'AQUA-2026-01',      NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 110, '2026-01-28 07:30:00.0000000', '2026-01-28 07:30:00.0000000'),
(1051, 103, '2026-02-01', '2026-02-01', 'Booking revenue - Online travel agencies','Various OTAs',           NULL,    95000.00, 'credit', 'Room Revenue',      NULL, 'SETTLE-20260201',  NULL, NULL, NULL, NULL, 0, 0, 1, 0, 'confirmed', 110, '2026-02-01 17:00:00.0000000', '2026-02-01 17:00:00.0000000'),
(1052, 103, '2026-02-04', '2026-02-05', 'Food supply - February order',          'Sysco Miami',              '5544',  31200.00, 'debit',  'Food & Beverage',   NULL, 'SYS-2026-008',      NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 110, '2026-02-04 06:30:00.0000000', '2026-02-04 06:30:00.0000000'),
(1053, 103, '2026-02-08', '2026-02-09', 'Cable & Internet - Commercial plan',    'Comcast Business',         '5544',   2800.00, 'debit',  'Utilities',         NULL, 'CMB-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 110, '2026-02-08 10:00:00.0000000', '2026-02-08 10:00:00.0000000'),
(1054, 103, '2026-02-12', '2026-02-13', 'Valet parking service - January',       'Prestige Valet Parking',   '5544',   6400.00, 'debit',  'Operations',        NULL, 'PVP-2026-01',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 110, '2026-02-12 08:00:00.0000000', '2026-02-12 08:00:00.0000000'),
(1055, 103, '2026-02-15', '2026-02-16', 'Marketing - Google Ads January',        'Google LLC',               '5544',   4200.00, 'debit',  'Marketing',         NULL, 'GADS-2026-01',      NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 110, '2026-02-15 09:00:00.0000000', '2026-02-15 09:00:00.0000000'),
(1056, 103, '2026-02-20', '2026-02-21', 'F&B equipment maintenance',             'Hobart Service Corp',      '5544',   2150.00, 'debit',  'Maintenance',       NULL, 'HBT-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 110, '2026-02-20 10:30:00.0000000', '2026-02-20 10:30:00.0000000'),
-- -- Company 104 - O'Brien Logistics (IDs 1057-1070) --
(1057, 104, '2026-01-05', '2026-01-06', 'Fleet fuel - 12 trucks',               'Shell Fleet Solutions',    '2211',  18400.00, 'debit',  'Fuel',              NULL, 'FL-2026-W1',        NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 111, '2026-01-05 06:00:00.0000000', '2026-01-05 06:00:00.0000000'),
(1058, 104, '2026-01-08', '2026-01-09', 'Truck lease payments - January',        'Ryder Truck Leasing',      '2211',  24000.00, 'debit',  'Leasing',           NULL, 'RYDER-2026-01',     NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 111, '2026-01-08 08:00:00.0000000', '2026-01-08 08:00:00.0000000'),
(1059, 104, '2026-01-12', '2026-01-13', 'Warehouse rent - January',              'Prologis REIT',            '2211',  35000.00, 'debit',  'Rent & Leases',     NULL, 'PLD-JAN',            NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 111, '2026-01-12 09:00:00.0000000', '2026-01-12 09:00:00.0000000'),
(1060, 104, '2026-01-15', '2026-01-16', 'Vehicle maintenance & repairs',         'Penske Truck Services',    '2211',   6800.00, 'debit',  'Maintenance',       NULL, 'PEN-2026-003',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 111, '2026-01-15 07:00:00.0000000', '2026-01-15 07:00:00.0000000'),
(1061, 104, '2026-01-18', '2026-01-19', 'Toll payments - E-ZPass monthly',       'E-ZPass NJ',               '2211',   4200.00, 'debit',  'Tolls',             NULL, 'EZP-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 111, '2026-01-18 10:00:00.0000000', '2026-01-18 10:00:00.0000000'),
(1062, 104, '2026-01-22', NULL,       'Insurance - Commercial fleet',            'Progressive Commercial',    '2211',  16500.00, 'debit',  'Insurance',         NULL, 'PROG-2026-01',      NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 111, '2026-01-22 11:00:00.0000000', '2026-01-22 11:00:00.0000000'),
(1063, 104, '2026-01-25', NULL,       'Driver payroll - Week 3',                 'ADP Logistics',            NULL,    45000.00, 'debit',  'Payroll',           NULL, 'PAY-2026-03',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 111, '2026-01-25 14:00:00.0000000', '2026-01-25 14:00:00.0000000'),
(1064, 104, '2026-01-28', '2026-01-28', 'Shipping revenue - Client A',           'FedEx Corp',               NULL,   125000.00, 'credit', 'Revenue',           NULL, 'SETTLE-FX-0128',   NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 111, '2026-01-28 17:00:00.0000000', '2026-01-28 17:00:00.0000000'),
(1065, 104, '2026-02-01', '2026-02-02', 'Fleet fuel - 12 trucks',               'Shell Fleet Solutions',    '2211',  19200.00, 'debit',  'Fuel',              NULL, 'FL-2026-W5',        NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 111, '2026-02-01 06:00:00.0000000', '2026-02-01 06:00:00.0000000'),
(1066, 104, '2026-02-04', '2026-02-05', 'Tire replacement - 6 trucks',           'Bridgestone Fleet Services','2211',  9600.00, 'debit',  'Maintenance',       NULL, 'BS-2026-002',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 111, '2026-02-04 08:00:00.0000000', '2026-02-04 08:00:00.0000000'),
(1067, 104, '2026-02-08', '2026-02-09', 'GPS tracking software - Monthly',       'Samsara Networks',         '2211',   2400.00, 'debit',  'Software',          NULL, 'SAM-2026-02',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 111, '2026-02-08 09:30:00.0000000', '2026-02-08 09:30:00.0000000'),
(1068, 104, '2026-02-12', '2026-02-13', 'Warehouse utilities - January',         'PSEG Energy',              '2211',   5800.00, 'debit',  'Utilities',         NULL, 'PSEG-2026-01',      NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 111, '2026-02-12 10:00:00.0000000', '2026-02-12 10:00:00.0000000'),
(1069, 104, '2026-02-15', NULL,       'Driver bonuses - Q4 2025 performance',    NULL,                       NULL,   12000.00, 'debit',  'Payroll',           NULL, 'BONUS-2025Q4',      NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 111, '2026-02-15 14:00:00.0000000', '2026-02-15 14:00:00.0000000'),
(1070, 104, '2026-02-20', '2026-02-20', 'Client payment - Contract logistics',   'Amazon Logistics',         NULL,   280000.00, 'credit', 'Revenue',           NULL, 'INV-AMZN-2026-02', NULL, NULL, NULL, NULL, 0, 1, 0, 0, 'confirmed', 111, '2026-02-20 17:30:00.0000000', '2026-02-20 17:30:00.0000000'),
-- -- Company 105 - Tokyo Bites Restaurant (IDs 1071-1084) --
(1071, 105, '2026-01-04', '2026-01-05', 'Fresh fish delivery - Weekly',          'Tokyo Fish Market LA',     '9900',   6800.00, 'debit',  'Food Cost',         NULL, 'TFM-2026-W1',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 112, '2026-01-04 05:00:00.0000000', '2026-01-04 05:00:00.0000000'),
(1072, 105, '2026-01-07', '2026-01-08', 'Sake and beverages - Monthly order',    'Mutual Trading Co Inc',    '9900',   4200.00, 'debit',  'Beverage',          NULL, 'MTC-2026-001',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 112, '2026-01-07 10:00:00.0000000', '2026-01-07 10:00:00.0000000'),
(1073, 105, '2026-01-10', '2026-01-11', 'Kitchen supplies - January',            'Chef''Store Restaurant Supply','9900', 2300.00, 'debit',  'Supplies',          NULL, 'CHS-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 112, '2026-01-10 08:00:00.0000000', '2026-01-10 08:00:00.0000000'),
(1074, 105, '2026-01-14', '2026-01-15', 'Rent - Little Tokyo location',          'Little Tokyo Properties LLC','9900', 8500.00, 'debit',  'Rent & Leases',     NULL, 'RENT-JAN',           NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 112, '2026-01-14 09:00:00.0000000', '2026-01-14 09:00:00.0000000'),
(1075, 105, '2026-01-18', NULL,       'Payroll - Kitchen and wait staff',        'ADP Restaurant Solutions', NULL,    22000.00, 'debit',  'Payroll',           NULL, 'PAY-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 112, '2026-01-18 14:00:00.0000000', '2026-01-18 14:00:00.0000000'),
(1076, 105, '2026-01-22', '2026-01-23', 'Yelp Advertising - Monthly',            'Yelp Inc',                 '9900',   1500.00, 'debit',  'Marketing',         NULL, 'YLP-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 112, '2026-01-22 09:00:00.0000000', '2026-01-22 09:00:00.0000000'),
(1077, 105, '2026-01-25', '2026-01-26', 'Rice and dry goods - Monthly order',    'JFC International Inc',    '9900',   3100.00, 'debit',  'Food Cost',         NULL, 'JFC-2026-01',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 112, '2026-01-25 08:00:00.0000000', '2026-01-25 08:00:00.0000000'),
(1078, 105, '2026-01-28', '2026-01-29', 'POS system subscription',               'Toast Inc',                '9900',    400.00, 'debit',  'Software',          NULL, 'TST-2026-01',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 112, '2026-01-28 10:00:00.0000000', '2026-01-28 10:00:00.0000000'),
(1079, 105, '2026-02-01', '2026-02-02', 'Fresh fish delivery - Weekly',          'Tokyo Fish Market LA',     '9900',   7200.00, 'debit',  'Food Cost',         NULL, 'TFM-2026-W5',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 112, '2026-02-01 05:00:00.0000000', '2026-02-01 05:00:00.0000000'),
(1080, 105, '2026-02-05', '2026-02-06', 'Soju and specialty beverages',          'Mutual Trading Co Inc',    '9900',   3800.00, 'debit',  'Beverage',          NULL, 'MTC-2026-002',      NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 112, '2026-02-05 10:00:00.0000000', '2026-02-05 10:00:00.0000000'),
(1081, 105, '2026-02-08', '2026-02-09', 'Linen service - Tablecloths and uniforms','Angelica Textile Services','9900',   950.00, 'debit',  'Operations',        NULL, 'ANG-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 112, '2026-02-08 07:00:00.0000000', '2026-02-08 07:00:00.0000000'),
(1082, 105, '2026-02-12', NULL,       'Health department permit - Annual',       'LA County Health Dept',    '9900',    600.00, 'debit',  'Permits & Licenses',NULL, 'LAC-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 112, '2026-02-12 08:00:00.0000000', '2026-02-12 08:00:00.0000000'),
(1083, 105, '2026-02-15', '2026-02-16', 'DoorDash commission - January',         'DoorDash Inc',             '9900',   8400.00, 'debit',  'Commission',        NULL, 'DDSH-2026-01',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 112, '2026-02-15 12:00:00.0000000', '2026-02-15 12:00:00.0000000'),
(1084, 105, '2026-02-20', '2026-02-21', 'Grease trap cleaning service',          'Bakers Waste Solutions',   '9900',    350.00, 'debit',  'Maintenance',       NULL, 'BWS-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 112, '2026-02-20 08:00:00.0000000', '2026-02-20 08:00:00.0000000'),
-- -- Company 106 - GreenLeaf Organic Grocers (IDs 1085-1098) --
(1085, 106, '2026-01-05', '2026-01-06', 'Organic produce delivery - Weekly',     'Organically Grown Company','7766', 14200.00, 'debit',  'Produce',           NULL, 'OGC-2026-W1',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 113, '2026-01-05 05:30:00.0000000', '2026-01-05 05:30:00.0000000'),
(1086, 106, '2026-01-08', '2026-01-09', 'Dairy and eggs - January',              'Organic Valley Farms',     '7766',   8600.00, 'debit',  'Dairy',             NULL, 'OV-2026-001',       NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 113, '2026-01-08 07:00:00.0000000', '2026-01-08 07:00:00.0000000'),
(1087, 106, '2026-01-12', '2026-01-13', 'Store rent - January 2026',             'Hawthorne Property Group', '7766',  12000.00, 'debit',  'Rent & Leases',     NULL, 'RENT-JAN',           NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 113, '2026-01-12 09:00:00.0000000', '2026-01-12 09:00:00.0000000'),
(1088, 106, '2026-01-15', '2026-01-16', 'Eco-friendly packaging order',          'World Centric Inc',        '7766',   3400.00, 'debit',  'Supplies',          NULL, 'WC-2026-002',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 113, '2026-01-15 10:00:00.0000000', '2026-01-15 10:00:00.0000000'),
(1089, 106, '2026-01-18', NULL,       'Payroll - Store staff',                   'ADP Retail Solutions',     NULL,    18500.00, 'debit',  'Payroll',           NULL, 'PAY-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 113, '2026-01-18 14:00:00.0000000', '2026-01-18 14:00:00.0000000'),
(1090, 106, '2026-01-22', '2026-01-23', 'Bulk grains and legumes',               'Bob''s Red Mill Natural Foods','7766', 5600.00, 'debit', 'Dry Goods',         NULL, 'BRM-2026-001',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 113, '2026-01-22 08:00:00.0000000', '2026-01-22 08:00:00.0000000'),
(1091, 106, '2026-01-25', '2026-01-26', 'Organic meat and poultry',              'Applegate Farms',          '7766',  11200.00, 'debit',  'Meat',              NULL, 'APP-2026-001',      NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 113, '2026-01-25 07:00:00.0000000', '2026-01-25 07:00:00.0000000'),
(1092, 106, '2026-01-28', '2026-01-29', 'Electricity - January',                 'Portland General Electric', '7766',   3200.00, 'debit',  'Utilities',         NULL, 'PGE-2026-01',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 113, '2026-01-28 11:00:00.0000000', '2026-01-28 11:00:00.0000000'),
(1093, 106, '2026-02-01', '2026-02-02', 'Organic produce delivery - February',   'Organically Grown Company','7766', 15800.00, 'debit',  'Produce',           NULL, 'OGC-2026-W5',       NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 113, '2026-02-01 05:30:00.0000000', '2026-02-01 05:30:00.0000000'),
(1094, 106, '2026-02-04', '2026-02-05', 'POS system - Monthly service',          'Square Inc',               '7766',    600.00, 'debit',  'Software',          NULL, 'SQ-2026-02',        NULL, NULL, NULL, NULL, 1, 0, 0, 0, 'confirmed', 113, '2026-02-04 10:00:00.0000000', '2026-02-04 10:00:00.0000000'),
(1095, 106, '2026-02-08', '2026-02-09', 'Organic coffee beans - Monthly',       'Stumptown Coffee Roasters', '7766',  4800.00, 'debit',  'Beverage',          NULL, 'ST-2026-02',        NULL, NULL, NULL, NULL, 1, 1, 0, 0, 'confirmed', 113, '2026-02-08 08:00:00.0000000', '2026-02-08 08:00:00.0000000'),
(1096, 106, '2026-02-12', '2026-02-13', 'Cleaning supplies - Eco-friendly',     'Seventh Generation Pro',    '7766',    900.00, 'debit',  'Supplies',          NULL, '7G-2026-002',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 113, '2026-02-12 09:00:00.0000000', '2026-02-12 09:00:00.0000000'),
(1097, 106, '2026-02-15', '2026-02-16', 'Credit card processing fees - January', 'Chase Paymentech',         NULL,     2400.00, 'debit',  'Payment Processing',NULL, 'CHASE-2026-01',    NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 113, '2026-02-15 12:00:00.0000000', '2026-02-15 12:00:00.0000000'),
(1098, 106, '2026-02-20', '2026-02-21', 'Local farm delivery - Winter CSA',      'Ground Works Farms',       '7766',   2800.00, 'debit',  'Produce',           NULL, 'GWF-2026-02',       NULL, NULL, NULL, NULL, 0, 0, 0, 0, 'confirmed', 113, '2026-02-20 06:00:00.0000000', '2026-02-20 06:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_transactions OFF;
GO
-- ============================================================
-- 9. INVOICES
-- ============================================================
PRINT 'Seeding FP26_invoices...';
SET IDENTITY_INSERT dbo.FP26_invoices ON;

INSERT INTO dbo.FP26_invoices
    (id, company_id, invoice_number, vendor_name, vendor_tax_id, invoice_date, due_date, payment_date, subtotal, vat_rate, vat_amount, total_amount, currency, file_original_name, file_path, file_type, file_size, status, ai_extraction_confidence, ai_processed, is_verified, is_matched, matched_amount, last_four_digits_card, payment_plan_total_installments, payment_plan_installment_amount, payment_plan_frequency, payment_plan_description, item_count, uploaded_by_user_id, verified_by_user_id, created_at, updated_at)
VALUES
-- -- Company 100 - Baker Construction Group (IDs 100-104) --
(500, 100, 'INV-2026-001', 'Related Companies',       '13-1234567', '2026-02-01', '2026-03-15', '2026-02-08', 238095.24, 5.00, 11904.76, 250000.00, 'USD', 'INV-2026-001.pdf', 'uploads/invoices/100/related_companies_inv_001.pdf', 'application/pdf', 245000, 'paid', 0.98, 1, 1, 1, 250000.00, NULL, NULL, NULL, NULL, NULL, 3, 107, 107, '2026-02-01 14:00:00.0000000', '2026-02-01 14:00:00.0000000'),
(501, 100, 'INV-2026-002', 'US Steel Supply Co',      '13-7654321', '2026-01-08', '2026-02-07', '2026-01-20', 48320.00,  0.00, 0.00,       48320.00,  'USD', 'INV-2026-002.pdf', 'uploads/invoices/100/us_steel_supply_inv_002.pdf', 'application/pdf', 124000, 'paid', 0.96, 1, 1, 1, 48320.00,  NULL, NULL, NULL, NULL, NULL, 3, 107, 107, '2026-01-08 15:00:00.0000000', '2026-01-08 15:00:00.0000000'),
(502, 100, 'INV-2026-003', 'ReadyMix Concrete Inc',   '13-5551212', '2026-01-12', '2026-02-11', '2026-01-25', 15750.00,  0.00, 0.00,       15750.00,  'USD', 'INV-2026-003.pdf', 'uploads/invoices/100/readymix_concrete_inv_003.pdf', 'application/pdf',  82400, 'paid', 0.97, 1, 1, 1, 15750.00,  NULL, NULL, NULL, NULL, NULL, 2, 107, 107, '2026-01-12 16:00:00.0000000', '2026-01-12 16:00:00.0000000'),
(503, 100, 'INV-2026-004', 'Trane Technologies',      '13-9876543', '2026-02-10', '2026-03-12', NULL,        34200.00,  0.00, 0.00,       34200.00,  'USD', 'INV-2026-004.pdf', 'uploads/invoices/100/trane_technologies_inv_004.pdf', 'application/pdf', 186000, 'unpaid', 0.94, 1, 0, 1, 34200.00, NULL, NULL, NULL, NULL, NULL, 2, 107, NULL, '2026-02-10 15:30:00.0000000', '2026-02-10 15:30:00.0000000'),
(504, 100, 'INV-2026-005', 'Home Depot Pro',          '13-1112233', '2026-01-25', '2026-02-24', '2026-02-10', 18900.00,  0.00, 0.00,       18900.00,  'USD', 'INV-2026-005.pdf', 'uploads/invoices/100/homedepot_pro_inv_005.pdf', 'application/pdf',  56300, 'paid', 0.95, 1, 1, 1, 18900.00,  NULL, NULL, NULL, NULL, NULL, 3, 107, 107, '2026-01-25 17:00:00.0000000', '2026-01-25 17:00:00.0000000'),
-- -- Company 101 - PAL Technologies (IDs 105-109) --
(505, 101, 'INV-2026-101', 'DataStream Solutions Inc', '94-8765432', '2026-02-01', '2026-03-03', '2026-02-01', 125000.00, 0.00, 0.00,      125000.00, 'USD', 'INV-2026-101.pdf', 'uploads/invoices/101/datastream_inv_101.pdf', 'application/pdf', 312000, 'paid', 0.99, 1, 1, 1, 125000.00, NULL, NULL, NULL, NULL, NULL, 2, 108, 108, '2026-02-01 16:00:00.0000000', '2026-02-01 16:00:00.0000000'),
(506, 101, 'INV-2026-102', 'Amazon Web Services',     '94-4445566', '2026-01-03', '2026-02-02', '2026-01-18', 24560.00,  0.00, 0.00,       24560.00,  'USD', 'INV-2026-102.pdf', 'uploads/invoices/101/aws_inv_102.pdf', 'application/pdf',  45600, 'paid', 0.97, 1, 1, 1, 24560.00,  NULL, NULL, NULL, NULL, NULL, 4, 108, 108, '2026-01-03 18:00:00.0000000', '2026-01-03 18:00:00.0000000'),
(507, 101, 'INV-2026-103', 'GitHub Inc',               '94-7778899', '2026-01-07', '2026-02-06', '2026-01-20', 8400.00,   0.00, 0.00,        8400.00,   'USD', 'INV-2026-103.pdf', 'uploads/invoices/101/github_inv_103.pdf', 'application/pdf',  12500, 'paid', 0.96, 1, 1, 1, 8400.00,   NULL, NULL, NULL, NULL, NULL, 1, 108, 108, '2026-01-07 19:00:00.0000000', '2026-01-07 19:00:00.0000000'),
(508, 101, 'INV-2026-104', 'Slack Technologies',       '94-3334455', '2026-01-15', '2026-02-14', '2026-01-28', 3600.00,   0.00, 0.00,        3600.00,   'USD', 'INV-2026-104.pdf', 'uploads/invoices/101/slack_inv_104.pdf', 'application/pdf',   8900, 'paid', 0.95, 1, 1, 1, 3600.00,   NULL, NULL, NULL, NULL, NULL, 1, 108, 108, '2026-01-15 20:00:00.0000000', '2026-01-15 20:00:00.0000000'),
(509, 101, 'INV-2026-105', 'Datadog Inc',              '94-2223344', '2026-01-25', '2026-02-24', NULL,        4890.00,   0.00, 0.00,        4890.00,   'USD', 'INV-2026-105.pdf', 'uploads/invoices/101/datadog_inv_105.pdf', 'application/pdf',  23400, 'unpaid', 0.93, 1, 1, 1, 4890.00,  NULL, NULL, NULL, NULL, NULL, 2, 108, NULL, '2026-01-25 21:00:00.0000000', '2026-01-25 21:00:00.0000000'),
-- -- Company 102 - Medina Medical Clinic (IDs 110-114) --
(510, 102, 'INV-2026-201', 'McKesson Medical-Surgical', '36-1112233', '2026-01-06', '2026-02-05', '2026-01-20', 42300.00,  0.00, 0.00,       42300.00,  'USD', 'INV-2026-201.pdf', 'uploads/invoices/102/mckesson_inv_201.pdf', 'application/pdf', 342000, 'paid', 0.98, 1, 1, 1, 42300.00, NULL, NULL, NULL, NULL, NULL, 5, 109, 109, '2026-01-06 16:00:00.0000000', '2026-01-06 16:00:00.0000000'),
(511, 102, 'INV-2026-202', 'Cardinal Health Inc',      '36-4445566', '2026-01-15', '2026-02-14', '2026-01-28', 28400.00,  0.00, 0.00,       28400.00,  'USD', 'INV-2026-202.pdf', 'uploads/invoices/102/cardinal_health_inv_202.pdf', 'application/pdf', 198000, 'paid', 0.97, 1, 1, 1, 28400.00, NULL, NULL, NULL, NULL, NULL, 5, 109, 109, '2026-01-15 17:00:00.0000000', '2026-01-15 17:00:00.0000000'),
(512, 102, 'INV-2026-203', 'Practice Fusion Inc',      '36-7778899', '2026-01-09', '2026-02-08', '2026-01-22', 3600.00,   0.00, 0.00,        3600.00,   'USD', 'INV-2026-203.pdf', 'uploads/invoices/102/practice_fusion_inv_203.pdf', 'application/pdf',  12400, 'paid', 0.95, 1, 1, 1, 3600.00,   NULL, NULL, NULL, NULL, NULL, 1, 109, 109, '2026-01-09 18:00:00.0000000', '2026-01-09 18:00:00.0000000'),
(513, 102, 'INV-2026-204', 'GE Healthcare Financial',  '36-3334455', '2026-01-25', '2026-02-24', '2026-02-05', 18500.00,  0.00, 0.00,       18500.00,  'USD', 'INV-2026-204.pdf', 'uploads/invoices/102/ge_healthcare_inv_204.pdf', 'application/pdf',  89200, 'paid', 0.96, 1, 1, 1, 18500.00, NULL, NULL, NULL, NULL, NULL, 2, 109, 109, '2026-01-25 19:00:00.0000000', '2026-01-25 19:00:00.0000000'),
(514, 102, 'INV-2026-205', 'Epic Systems Corporation', '36-5556677', '2026-02-10', '2026-03-12', NULL,        12000.00,  0.00, 0.00,       12000.00,  'USD', 'INV-2026-205.pdf', 'uploads/invoices/102/epic_systems_inv_205.pdf', 'application/pdf',  45600, 'unpaid', 0.94, 1, 1, 1, 12000.00, NULL, NULL, NULL, NULL, NULL, 1, 109, NULL, '2026-02-10 20:00:00.0000000', '2026-02-10 20:00:00.0000000'),
-- -- Company 103 - Harbor View Hospitality (IDs 115-119) --
(515, 103, 'INV-2026-301', 'Sysco Miami',               '59-1112233', '2026-01-04', '2026-02-03', '2026-01-18', 34500.00,  0.00, 0.00,       34500.00,  'USD', 'INV-2026-301.pdf', 'uploads/invoices/103/sysco_inv_301.pdf', 'application/pdf', 145000, 'paid', 0.98, 1, 1, 1, 34500.00,  NULL, NULL, NULL, NULL, NULL, 5, 110, 110, '2026-01-04 15:00:00.0000000', '2026-01-04 15:00:00.0000000'),
(516, 103, 'INV-2026-302', 'Southern Glazers Wine & Spirits', '59-4445566', '2026-01-14', '2026-02-13', '2026-01-25', 12800.00,  0.00, 0.00,       12800.00,  'USD', 'INV-2026-302.pdf', 'uploads/invoices/103/southern_glazers_inv_302.pdf', 'application/pdf',  56200, 'paid', 0.97, 1, 1, 1, 12800.00, NULL, NULL, NULL, NULL, NULL, 3, 110, 110, '2026-01-14 16:00:00.0000000', '2026-01-14 16:00:00.0000000'),
(517, 103, 'INV-2026-303', 'Expedia Group',             '59-7778899', '2026-01-07', '2026-02-06', '2026-01-20', 8900.00,   0.00, 0.00,        8900.00,   'USD', 'INV-2026-303.pdf', 'uploads/invoices/103/expedia_inv_303.pdf', 'application/pdf',  23400, 'paid', 0.95, 1, 1, 1, 8900.00,   NULL, NULL, NULL, NULL, NULL, 1, 110, 110, '2026-01-07 17:00:00.0000000', '2026-01-07 17:00:00.0000000'),
(518, 103, 'INV-2026-304', 'UniFirst Hospitality',      '59-3334455', '2026-01-10', '2026-02-09', '2026-01-22', 5200.00,   0.00, 0.00,        5200.00,   'USD', 'INV-2026-304.pdf', 'uploads/invoices/103/unifirst_inv_304.pdf', 'application/pdf',  12800, 'paid', 0.96, 1, 1, 1, 5200.00,   NULL, NULL, NULL, NULL, NULL, 2, 110, 110, '2026-01-10 18:00:00.0000000', '2026-01-10 18:00:00.0000000'),
(519, 103, 'INV-2026-305', 'Prestige Valet Parking',    '59-5556677', '2026-02-12', '2026-03-14', NULL,        6400.00,   0.00, 0.00,        6400.00,   'USD', 'INV-2026-305.pdf', 'uploads/invoices/103/prestige_valet_inv_305.pdf', 'application/pdf',  18500, 'unpaid', 0.93, 1, 0, 1, 6400.00,  NULL, NULL, NULL, NULL, NULL, 1, 110, NULL, '2026-02-12 19:00:00.0000000', '2026-02-12 19:00:00.0000000'),
-- -- Company 104 - O'Brien Logistics (IDs 120-124) --
(520, 104, 'INV-2026-401', 'Amazon Logistics',          '22-1112233', '2026-02-20', '2026-03-22', NULL,        280000.00, 0.00, 0.00,      280000.00, 'USD', 'INV-2026-401.pdf', 'uploads/invoices/104/amazon_logistics_inv_401.pdf', 'application/pdf', 456000, 'unpaid', 0.99, 1, 0, 1, 280000.00, NULL, NULL, NULL, NULL, NULL, 2, 111, NULL, '2026-02-20 14:00:00.0000000', '2026-02-20 14:00:00.0000000'),
(521, 104, 'INV-2026-402', 'Ryder Truck Leasing',       '22-4445566', '2026-01-08', '2026-02-07', '2026-01-22', 24000.00,  0.00, 0.00,       24000.00,  'USD', 'INV-2026-402.pdf', 'uploads/invoices/104/ryder_inv_402.pdf', 'application/pdf',  98500, 'paid', 0.97, 1, 1, 1, 24000.00,  NULL, NULL, NULL, NULL, NULL, 3, 111, 111, '2026-01-08 15:00:00.0000000', '2026-01-08 15:00:00.0000000'),
(522, 104, 'INV-2026-403', 'Shell Fleet Solutions',     '22-7778899', '2026-01-05', '2026-02-04', '2026-01-18', 18400.00,  0.00, 0.00,       18400.00,  'USD', 'INV-2026-403.pdf', 'uploads/invoices/104/shell_fleet_inv_403.pdf', 'application/pdf',  34200, 'paid', 0.98, 1, 1, 1, 18400.00,  NULL, NULL, NULL, NULL, NULL, 1, 111, 111, '2026-01-05 16:00:00.0000000', '2026-01-05 16:00:00.0000000'),
(523, 104, 'INV-2026-404', 'Penske Truck Services',     '22-3334455', '2026-01-15', '2026-02-14', '2026-01-28', 6800.00,   0.00, 0.00,        6800.00,   'USD', 'INV-2026-404.pdf', 'uploads/invoices/104/penske_inv_404.pdf', 'application/pdf',  21600, 'paid', 0.95, 1, 1, 1, 6800.00,   NULL, NULL, NULL, NULL, NULL, 3, 111, 111, '2026-01-15 17:00:00.0000000', '2026-01-15 17:00:00.0000000'),
(524, 104, 'INV-2026-405', 'Samsara Networks',          '22-5556677', '2026-02-08', '2026-03-10', NULL,        2400.00,   0.00, 0.00,        2400.00,   'USD', 'INV-2026-405.pdf', 'uploads/invoices/104/samsara_inv_405.pdf', 'application/pdf',   8900, 'unpaid', 0.94, 1, 0, 1, 2400.00,   NULL, NULL, NULL, NULL, NULL, 1, 111, NULL, '2026-02-08 18:00:00.0000000', '2026-02-08 18:00:00.0000000'),
-- -- Company 105 - Tokyo Bites (IDs 125-129) --
(525, 105, 'INV-2026-501', 'Tokyo Fish Market LA',       '95-1112233', '2026-01-04', '2026-02-03', '2026-01-18', 6800.00,   0.00, 0.00,        6800.00,   'USD', 'INV-2026-501.pdf', 'uploads/invoices/105/tokyo_fish_market_inv_501.pdf', 'application/pdf', 23400, 'paid', 0.98, 1, 1, 1, 6800.00,   NULL, NULL, NULL, NULL, NULL, 3, 112, 112, '2026-01-04 14:00:00.0000000', '2026-01-04 14:00:00.0000000'),
(526, 105, 'INV-2026-502', 'Mutual Trading Co Inc',      '95-4445566', '2026-01-07', '2026-02-06', '2026-01-20', 4200.00,   0.00, 0.00,        4200.00,   'USD', 'INV-2026-502.pdf', 'uploads/invoices/105/mutual_trading_inv_502.pdf', 'application/pdf', 12300, 'paid', 0.97, 1, 1, 1, 4200.00,   NULL, NULL, NULL, NULL, NULL, 3, 112, 112, '2026-01-07 15:00:00.0000000', '2026-01-07 15:00:00.0000000'),
(527, 105, 'INV-2026-503', 'JFC International Inc',      '95-7778899', '2026-01-25', '2026-02-24', '2026-02-05', 3100.00,   0.00, 0.00,        3100.00,   'USD', 'INV-2026-503.pdf', 'uploads/invoices/105/jfc_international_inv_503.pdf', 'application/pdf',  8700, 'paid', 0.96, 1, 1, 1, 3100.00,   NULL, NULL, NULL, NULL, NULL, 4, 112, 112, '2026-01-25 16:00:00.0000000', '2026-01-25 16:00:00.0000000'),
(528, 105, 'INV-2026-504', 'DoorDash Inc',               '95-3334455', '2026-02-15', '2026-03-17', NULL,        8400.00,   0.00, 0.00,        8400.00,   'USD', 'INV-2026-504.pdf', 'uploads/invoices/105/doordash_inv_504.pdf', 'application/pdf', 18600, 'unpaid', 0.95, 1, 0, 1, 8400.00,   NULL, NULL, NULL, NULL, NULL, 1, 112, NULL, '2026-02-15 17:00:00.0000000', '2026-02-15 17:00:00.0000000'),
(529, 105, 'INV-2026-505', 'Toast Inc',                  '95-5556677', '2026-01-28', '2026-02-27', '2026-02-10', 400.00,    0.00, 0.00,         400.00,   'USD', 'INV-2026-505.pdf', 'uploads/invoices/105/toast_inv_505.pdf', 'application/pdf',   3400, 'paid', 0.99, 1, 1, 1, 400.00,    NULL, NULL, NULL, NULL, NULL, 1, 112, 112, '2026-01-28 18:00:00.0000000', '2026-01-28 18:00:00.0000000'),
-- -- Company 106 - GreenLeaf Organic Grocers (IDs 130-134) --
(530, 106, 'INV-2026-601', 'Organically Grown Company',  '93-1112233', '2026-01-05', '2026-02-04', '2026-01-19', 14200.00,  0.00, 0.00,       14200.00,  'USD', 'INV-2026-601.pdf', 'uploads/invoices/106/organically_grown_inv_601.pdf', 'application/pdf', 78200, 'paid', 0.98, 1, 1, 1, 14200.00, NULL, NULL, NULL, NULL, NULL, 4, 113, 113, '2026-01-05 14:00:00.0000000', '2026-01-05 14:00:00.0000000'),
(531, 106, 'INV-2026-602', 'Organic Valley Farms',       '93-4445566', '2026-01-08', '2026-02-07', '2026-01-22', 8600.00,   0.00, 0.00,        8600.00,   'USD', 'INV-2026-602.pdf', 'uploads/invoices/106/organic_valley_inv_602.pdf', 'application/pdf', 45600, 'paid', 0.97, 1, 1, 1, 8600.00,   NULL, NULL, NULL, NULL, NULL, 3, 113, 113, '2026-01-08 15:00:00.0000000', '2026-01-08 15:00:00.0000000'),
(532, 106, 'INV-2026-603', 'Applegate Farms',            '93-7778899', '2026-01-25', '2026-02-24', '2026-02-08', 11200.00,  0.00, 0.00,       11200.00,  'USD', 'INV-2026-603.pdf', 'uploads/invoices/106/applegate_farms_inv_603.pdf', 'application/pdf', 62300, 'paid', 0.96, 1, 1, 1, 11200.00, NULL, NULL, NULL, NULL, NULL, 3, 113, 113, '2026-01-25 16:00:00.0000000', '2026-01-25 16:00:00.0000000'),
(533, 106, 'INV-2026-604', 'Bob''s Red Mill Natural Foods', '93-3334455', '2026-01-22', '2026-02-21', '2026-02-04', 5600.00,   0.00, 0.00,        5600.00,   'USD', 'INV-2026-604.pdf', 'uploads/invoices/106/bobs_red_mill_inv_604.pdf', 'application/pdf', 31200, 'paid', 0.95, 1, 1, 1, 5600.00,   NULL, NULL, NULL, NULL, NULL, 4, 113, 113, '2026-01-22 17:00:00.0000000', '2026-01-22 17:00:00.0000000'),
(534, 106, 'INV-2026-605', 'Stumptown Coffee Roasters',  '93-5556677', '2026-02-08', '2026-03-10', NULL,        4800.00,   0.00, 0.00,        4800.00,   'USD', 'INV-2026-605.pdf', 'uploads/invoices/106/stumptown_inv_605.pdf', 'application/pdf', 14500, 'unpaid', 0.94, 1, 0, 1, 4800.00,   NULL, NULL, NULL, NULL, NULL, 2, 113, NULL, '2026-02-08 18:00:00.0000000', '2026-02-08 18:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_invoices OFF;
GO
-- ============================================================
-- 10. INVOICE LINE ITEMS
-- ============================================================
PRINT 'Seeding FP26_invoice_line_items...';
SET IDENTITY_INSERT dbo.FP26_invoice_line_items ON;

INSERT INTO dbo.FP26_invoice_line_items
    (id, invoice_id, line_number, description, category, quantity, unit_price, vat_rate, total_amount, ai_confidence_score, created_at)
VALUES
-- Invoice 100 - Related Companies (,000)
(500, 500, 1, 'Full floor build-out - 12th floor',       'Construction',   1,   150000.00, 5.00, 150000.00, 0.98, '2026-02-01 14:00:00.0000000'),
(501, 500, 2, 'Electrical and data cabling',              'Electrical',     1,    55000.00, 5.00,  55000.00, 0.97, '2026-02-01 14:00:00.0000000'),
(502, 500, 3, 'HVAC installation and ductwork',           'HVAC',           1,    45000.00, 5.00,  45000.00, 0.96, '2026-02-01 14:00:00.0000000'),
-- Invoice 101 - US Steel Supply (,320)
(503, 501, 1, 'Steel rebar #4 - 40ft lengths',           'Materials',      200,    120.00, 0.00,  24000.00, 0.97, '2026-01-08 15:00:00.0000000'),
(504, 501, 2, 'Steel beams W12x26',                      'Materials',       50,    280.00, 0.00,  14000.00, 0.96, '2026-01-08 15:00:00.0000000'),
(505, 501, 3, 'Steel mesh reinforcement',               'Materials',      100,    103.20, 0.00,  10320.00, 0.95, '2026-01-08 15:00:00.0000000'),
-- Invoice 102 - ReadyMix Concrete (,750)
(506, 502, 1, 'Ready-mix concrete 4000 PSI (cubic yard)',  'Materials',     75,    170.00, 0.00,  12750.00, 0.98, '2026-01-12 16:00:00.0000000'),
(507, 502, 2, 'Concrete pump truck service',              'Equipment',       1,   3000.00, 0.00,   3000.00, 0.94, '2026-01-12 16:00:00.0000000'),
-- Invoice 103 - Trane Technologies (,200)
(508, 503, 1, 'Commercial HVAC unit - 10 ton',            'HVAC',            2,  14500.00, 0.00,  29000.00, 0.95, '2026-02-10 15:30:00.0000000'),
(509, 503, 2, 'Ductwork and ventilation kit',             'HVAC',            1,   5200.00, 0.00,   5200.00, 0.93, '2026-02-10 15:30:00.0000000'),
-- Invoice 104 - Home Depot Pro (,900)
(510, 504, 1, 'Lumber - 2x4x8 studs',                    'Materials',      500,      4.50, 0.00,   2250.00, 0.97, '2026-01-25 17:00:00.0000000'),
(511, 504, 2, 'Plywood sheets 4x8 3/4\"',                 'Materials',      200,     45.00, 0.00,   9000.00, 0.96, '2026-01-25 17:00:00.0000000'),
(512, 504, 3, 'Insulation R-13 batts',                   'Materials',      150,     51.00, 0.00,   7650.00, 0.95, '2026-01-25 17:00:00.0000000'),
-- Invoice 105 - DataStream Solutions (,000)
(513, 505, 1, 'API Enterprise License - Q1 2026',        'Software',         1, 100000.00, 0.00, 100000.00, 0.99, '2026-02-01 16:00:00.0000000'),
(514, 505, 2, 'Premium Support & SLA - Q1 2026',         'Support',          1,  25000.00, 0.00,  25000.00, 0.98, '2026-02-01 16:00:00.0000000'),
-- Invoice 106 - AWS (,560)
(515, 506, 1, 'EC2 Compute - Reserved Instances',        'Cloud',            1,  12000.00, 0.00,  12000.00, 0.97, '2026-01-03 18:00:00.0000000'),
(516, 506, 2, 'S3 Storage & Data Transfer',             'Cloud',            1,   6300.00, 0.00,   6300.00, 0.96, '2026-01-03 18:00:00.0000000'),
(517, 506, 3, 'RDS Database Services',                  'Cloud',            1,   4200.00, 0.00,   4200.00, 0.95, '2026-01-03 18:00:00.0000000'),
(518, 506, 4, 'CloudFront CDN & Support',               'Cloud',            1,   2060.00, 0.00,   2060.00, 0.94, '2026-01-03 18:00:00.0000000'),
-- Invoice 107 - GitHub (,400)
(519, 507, 1, 'GitHub Enterprise - 25 users (annual)',   'Software',         25,    336.00, 0.00,   8400.00, 0.97, '2026-01-07 19:00:00.0000000'),
-- Invoice 108 - Slack (,600)
(520, 508, 1, 'Slack Enterprise Grid - annual (50 seats)','Software',        50,     72.00, 0.00,   3600.00, 0.96, '2026-01-15 20:00:00.0000000'),
-- Invoice 109 - Datadog (,890)
(521, 509, 1, 'Infrastructure Monitoring - Pro',         'Cloud',            1,   3200.00, 0.00,   3200.00, 0.95, '2026-01-25 21:00:00.0000000'),
(522, 509, 2, 'APM & Distributed Tracing',               'Cloud',            1,   1690.00, 0.00,   1690.00, 0.93, '2026-01-25 21:00:00.0000000'),
-- Invoice 110 - McKesson (,300)
(523, 510, 1, 'Surgical gloves - Box of 100 (Case of 10)', 'Medical',         50,    280.00, 0.00,  14000.00, 0.98, '2026-01-06 16:00:00.0000000'),
(524, 510, 2, 'Syringes 10ml Luer-Lok (Box of 200)',     'Medical',         100,     95.00, 0.00,   9500.00, 0.97, '2026-01-06 16:00:00.0000000'),
(525, 510, 3, 'IV Administration Sets (Box of 50)',      'Medical',          30,    160.00, 0.00,   4800.00, 0.96, '2026-01-06 16:00:00.0000000'),
(526, 510, 4, 'Sterile gauze pads 4x4 (Case)',           'Medical',          20,    450.00, 0.00,   9000.00, 0.95, '2026-01-06 16:00:00.0000000'),
(527, 510, 5, 'Exam gloves - Nitrile (Case of 1000)',    'Medical',          10,    500.00, 0.00,   5000.00, 0.94, '2026-01-06 16:00:00.0000000'),
-- Invoice 111 - Cardinal Health (,400)
(528, 511, 1, 'Metformin HCL 500mg (Bottle of 1000)',    'Pharmacy',         20,    340.00, 0.00,   6800.00, 0.97, '2026-01-15 17:00:00.0000000'),
(529, 511, 2, 'Lisinopril 10mg (Bottle of 500)',         'Pharmacy',         15,    240.00, 0.00,   3600.00, 0.96, '2026-01-15 17:00:00.0000000'),
(530, 511, 3, 'Atorvastatin 20mg (Bottle of 500)',        'Pharmacy',         20,    450.00, 0.00,   9000.00, 0.95, '2026-01-15 17:00:00.0000000'),
(531, 511, 4, 'Amoxicillin 500mg (Bottle of 500)',       'Pharmacy',         10,    450.00, 0.00,   4500.00, 0.94, '2026-01-15 17:00:00.0000000'),
(532, 511, 5, 'Omeprazole 20mg (Bottle of 500)',         'Pharmacy',         10,    450.00, 0.00,   4500.00, 0.94, '2026-01-15 17:00:00.0000000'),
-- Invoice 112 - Practice Fusion (,600)
(533, 512, 1, 'EHR Practice Management - Monthly',        'Software',         1,   3600.00, 0.00,   3600.00, 0.96, '2026-01-09 18:00:00.0000000'),
-- Invoice 113 - GE Healthcare (,500)
(534, 513, 1, 'MRI Machine Lease - Monthly',              'Equipment',        1,  15500.00, 0.00,  15500.00, 0.97, '2026-01-25 19:00:00.0000000'),
(535, 513, 2, 'Maintenance & Support - Monthly',          'Equipment',        1,   3000.00, 0.00,   3000.00, 0.95, '2026-01-25 19:00:00.0000000'),
-- Invoice 114 - Epic Systems (,000)
(536, 514, 1, 'EHR Support Renewal - Annual',             'Software',         1,  12000.00, 0.00,  12000.00, 0.95, '2026-02-10 20:00:00.0000000'),
-- Invoice 115 - Sysco (,500)
(537, 515, 1, 'Prime beef cuts - Various cuts',           'Food',             1,  12500.00, 0.00,  12500.00, 0.98, '2026-01-04 15:00:00.0000000'),
(538, 515, 2, 'Fresh seafood - Assorted',                'Food',             1,   8200.00, 0.00,   8200.00, 0.97, '2026-01-04 15:00:00.0000000'),
(539, 515, 3, 'Produce - Seasonal vegetables',           'Food',             1,   5600.00, 0.00,   5600.00, 0.96, '2026-01-04 15:00:00.0000000'),
(540, 515, 4, 'Dairy and eggs - Fresh',                  'Food',             1,   4200.00, 0.00,   4200.00, 0.95, '2026-01-04 15:00:00.0000000'),
(541, 515, 5, 'Dry goods - Rice, pasta, oils',           'Food',             1,   4000.00, 0.00,   4000.00, 0.95, '2026-01-04 15:00:00.0000000'),
-- Invoice 116 - Southern Glazers (,800)
(542, 516, 1, 'Premium wine selection - Mixed case',     'Beverage',         20,    350.00, 0.00,   7000.00, 0.97, '2026-01-14 16:00:00.0000000'),
(543, 516, 2, 'Spirits - Vodka, Whiskey, Rum',           'Beverage',         15,    280.00, 0.00,   4200.00, 0.96, '2026-01-14 16:00:00.0000000'),
(544, 516, 3, 'Champagne and sparkling wine',            'Beverage',          5,    320.00, 0.00,   1600.00, 0.95, '2026-01-14 16:00:00.0000000'),
-- Invoice 117 - Expedia (,900)
(545, 517, 1, 'Booking commissions - January',           'Commissions',      1,   8900.00, 0.00,   8900.00, 0.96, '2026-01-07 17:00:00.0000000'),
-- Invoice 118 - UniFirst (,200)
(546, 518, 1, 'Linen rental - Sheets and towels',        'Operations',       1,   3800.00, 0.00,   3800.00, 0.97, '2026-01-10 18:00:00.0000000'),
(547, 518, 2, 'Uniform cleaning service',               'Operations',       1,   1400.00, 0.00,   1400.00, 0.95, '2026-01-10 18:00:00.0000000'),
-- Invoice 119 - Prestige Valet (,400)
(548, 519, 1, 'Valet parking service - January',         'Operations',       1,   6400.00, 0.00,   6400.00, 0.95, '2026-02-12 19:00:00.0000000'),
-- Invoice 120 - Amazon Logistics (,000)
(549, 520, 1, 'Contract logistics services - February',  'Logistics',        1, 230000.00, 0.00, 230000.00, 0.99, '2026-02-20 14:00:00.0000000'),
(550, 520, 2, 'Warehouse fulfillment operations',        'Logistics',        1,  50000.00, 0.00,  50000.00, 0.98, '2026-02-20 14:00:00.0000000'),
-- Invoice 121 - Ryder (,000)
(551, 521, 1, 'Lease - Freightliner Cascadia (x3)',      'Leasing',          3,   5500.00, 0.00,  16500.00, 0.97, '2026-01-08 15:00:00.0000000'),
(552, 521, 2, 'Lease - International HV (x1)',           'Leasing',          1,   4500.00, 0.00,   4500.00, 0.96, '2026-01-08 15:00:00.0000000'),
(553, 521, 3, 'Maintenance package - Monthly',           'Leasing',          4,    750.00, 0.00,   3000.00, 0.95, '2026-01-08 15:00:00.0000000'),
-- Invoice 122 - Shell Fleet (,400)
(554, 522, 1, 'Diesel fuel - Week 1',                    'Fuel',             1,  18400.00, 0.00,  18400.00, 0.98, '2026-01-05 16:00:00.0000000'),
-- Invoice 123 - Penske (,800)
(555, 523, 1, 'Brake system overhaul - Truck #401',      'Maintenance',      1,   2800.00, 0.00,   2800.00, 0.96, '2026-01-15 17:00:00.0000000'),
(556, 523, 2, 'Oil change and filter - Fleet (x4)',      'Maintenance',      4,    450.00, 0.00,   1800.00, 0.95, '2026-01-15 17:00:00.0000000'),
(557, 523, 3, 'Tire rotation and alignment (x4)',        'Maintenance',      4,    550.00, 0.00,   2200.00, 0.94, '2026-01-15 17:00:00.0000000'),
-- Invoice 124 - Samsara (,400)
(558, 524, 1, 'GPS Fleet Tracking - 12 vehicles',        'Software',         12,    200.00, 0.00,   2400.00, 0.95, '2026-02-08 18:00:00.0000000'),
-- Invoice 125 - Tokyo Fish Market (,800)
(559, 525, 1, 'Bluefin Tuna - Fresh sushi grade (lb)',   'Seafood',          50,     80.00, 0.00,   4000.00, 0.98, '2026-01-04 14:00:00.0000000'),
(560, 525, 2, 'Salmon - Fresh Atlantic (lb)',            'Seafood',          40,     45.00, 0.00,   1800.00, 0.97, '2026-01-04 14:00:00.0000000'),
(561, 525, 3, 'Yellowtail - Hamachi (lb)',               'Seafood',          20,     50.00, 0.00,   1000.00, 0.96, '2026-01-04 14:00:00.0000000'),
-- Invoice 126 - Mutual Trading (,200)
(562, 526, 1, 'Sake - Junmai Daiginjo (Case of 12)',     'Beverage',          5,    480.00, 0.00,   2400.00, 0.97, '2026-01-07 15:00:00.0000000'),
(563, 526, 2, 'Japanese beer - Asahi (Case of 24)',      'Beverage',         10,    120.00, 0.00,   1200.00, 0.96, '2026-01-07 15:00:00.0000000'),
(564, 526, 3, 'Soju - Various flavors (Case of 20)',     'Beverage',          3,    200.00, 0.00,    600.00, 0.95, '2026-01-07 15:00:00.0000000'),
-- Invoice 127 - JFC International (,100)
(565, 527, 1, 'Sushi rice - Calrose (50lb bags)',        'Dry Goods',        20,     80.00, 0.00,   1600.00, 0.97, '2026-01-25 16:00:00.0000000'),
(566, 527, 2, 'Nori seaweed sheets (100 pack)',          'Dry Goods',        10,     65.00, 0.00,    650.00, 0.96, '2026-01-25 16:00:00.0000000'),
(567, 527, 3, 'Soy sauce - Kikkoman (1 gal)',            'Dry Goods',        10,     45.00, 0.00,    450.00, 0.95, '2026-01-25 16:00:00.0000000'),
(568, 527, 4, 'Mirin cooking wine (1 gal)',              'Dry Goods',         5,     80.00, 0.00,    400.00, 0.94, '2026-01-25 16:00:00.0000000'),
-- Invoice 128 - DoorDash (,400)
(569, 528, 1, 'Delivery commissions - January',           'Commissions',      1,   8400.00, 0.00,   8400.00, 0.96, '2026-02-15 17:00:00.0000000'),
-- Invoice 129 - Toast ()
(570, 529, 1, 'POS System - Monthly subscription',        'Software',          1,    400.00, 0.00,    400.00, 0.99, '2026-01-28 18:00:00.0000000'),
-- Invoice 130 - Organically Grown (,200)
(571, 530, 1, 'Organic apples - Mixed varieties (Case)',  'Produce',         100,     45.00, 0.00,   4500.00, 0.98, '2026-01-05 14:00:00.0000000'),
(572, 530, 2, 'Organic mixed greens (Case of 6)',         'Produce',          80,     55.00, 0.00,   4400.00, 0.97, '2026-01-05 14:00:00.0000000'),
(573, 530, 3, 'Organic root vegetables (50 lb)',          'Produce',          50,     38.00, 0.00,   1900.00, 0.96, '2026-01-05 14:00:00.0000000'),
(574, 530, 4, 'Organic citrus - Oranges & Grapefruit',    'Produce',          40,     85.00, 0.00,   3400.00, 0.95, '2026-01-05 14:00:00.0000000'),
-- Invoice 131 - Organic Valley (,600)
(575, 531, 1, 'Organic whole milk (gal)',                  'Dairy',           100,     45.00, 0.00,   4500.00, 0.97, '2026-01-08 15:00:00.0000000'),
(576, 531, 2, 'Organic free-range eggs (dozen)',           'Dairy',            80,     35.00, 0.00,   2800.00, 0.96, '2026-01-08 15:00:00.0000000'),
(577, 531, 3, 'Organic butter (lb)',                       'Dairy',            50,     26.00, 0.00,   1300.00, 0.95, '2026-01-08 15:00:00.0000000'),
-- Invoice 132 - Applegate Farms (,200)
(578, 532, 1, 'Organic chicken breasts (lb)',              'Meat',            200,     32.00, 0.00,   6400.00, 0.97, '2026-01-25 16:00:00.0000000'),
(579, 532, 2, 'Organic ground beef 85/15 (lb)',            'Meat',            100,     36.00, 0.00,   3600.00, 0.96, '2026-01-25 16:00:00.0000000'),
(580, 532, 3, 'Organic turkey breast (lb)',                'Meat',             50,     24.00, 0.00,   1200.00, 0.95, '2026-01-25 16:00:00.0000000'),
-- Invoice 133 - Bob's Red Mill (,600)
(581, 533, 1, 'Organic rolled oats (25 lb)',               'Dry Goods',        30,     70.00, 0.00,   2100.00, 0.97, '2026-01-22 17:00:00.0000000'),
(582, 533, 2, 'Organic quinoa (25 lb)',                    'Dry Goods',        20,     90.00, 0.00,   1800.00, 0.96, '2026-01-22 17:00:00.0000000'),
(583, 533, 3, 'Organic lentils (25 lb)',                   'Dry Goods',        15,     60.00, 0.00,    900.00, 0.95, '2026-01-22 17:00:00.0000000'),
(584, 533, 4, 'Organic chickpeas (25 lb)',                 'Dry Goods',        10,     80.00, 0.00,    800.00, 0.94, '2026-01-22 17:00:00.0000000'),
-- Invoice 134 - Stumptown Coffee (,800)
(585, 534, 1, 'Organic House Blend - Whole Bean (5 lb)',   'Coffee',           20,    160.00, 0.00,   3200.00, 0.96, '2026-02-08 18:00:00.0000000'),
(586, 534, 2, 'Organic Single Origin - Ethiopia (5 lb)',  'Coffee',           10,    160.00, 0.00,   1600.00, 0.95, '2026-02-08 18:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_invoice_line_items OFF;
GO
-- ============================================================
-- 11. INVOICE-TRANSACTION MATCHES
-- ============================================================
PRINT 'Seeding FP26_invoice_transaction_matches...';
SET IDENTITY_INSERT dbo.FP26_invoice_transaction_matches ON;

INSERT INTO dbo.FP26_invoice_transaction_matches
    (id, invoice_id, transaction_id, match_type, matched_amount, match_method, match_confidence, match_reason, matched_by_user_id, installment_number, installment_note, created_at, updated_at)
VALUES
-- Company 100 - Baker Construction
(400, 500, 1010, 'full', 250000.00, 'amount_exact',  1.00, 'Exact amount match on payment from Related Companies for 1201 Broadway project', 107, NULL, NULL, '2026-02-08 16:30:00.0000000', '2026-02-08 16:30:00.0000000'),
(401, 501, 1001, 'full',  48320.00, 'amount_exact',  1.00, 'Exact amount match on steel rebar purchase from US Steel Supply Co',           107, NULL, NULL, '2026-01-20 10:00:00.0000000', '2026-01-20 10:00:00.0000000'),
(402, 502, 1003, 'full',  15750.00, 'amount_exact',  1.00, 'Exact amount match on concrete delivery from ReadyMix Concrete Inc',            107, NULL, NULL, '2026-01-25 11:00:00.0000000', '2026-01-25 11:00:00.0000000'),
(403, 503, 1011, 'full',  34200.00, 'amount_exact',  1.00, 'Exact amount match on HVAC equipment from Trane Technologies',                  107, NULL, NULL, '2026-02-10 16:00:00.0000000', '2026-02-10 16:00:00.0000000'),
(404, 504, 1007, 'full',  18900.00, 'manual_review', 0.95, 'Manual review - amounts match for lumber supply from Home Depot Pro',            107, NULL, NULL, '2026-02-10 17:00:00.0000000', '2026-02-10 17:00:00.0000000'),
-- Company 101 - PAL Technologies
(405, 505, 1024, 'full', 125000.00, 'amount_exact',  1.00, 'Exact amount match on API licensing payment from DataStream Solutions',         108, NULL, NULL, '2026-02-01 17:30:00.0000000', '2026-02-01 17:30:00.0000000'),
(406, 506, 1015, 'full',  24560.00, 'amount_exact',  1.00, 'Exact amount match on AWS Cloud Services December 2025',                         108, NULL, NULL, '2026-01-18 10:00:00.0000000', '2026-01-18 10:00:00.0000000'),
(407, 507, 1016, 'full',   8400.00, 'amount_exact',  1.00, 'Exact amount match on GitHub Enterprise annual renewal',                         108, NULL, NULL, '2026-01-20 09:00:00.0000000', '2026-01-20 09:00:00.0000000'),
(408, 508, 1019, 'full',   3600.00, 'amount_exact',  1.00, 'Exact amount match on Slack Enterprise annual plan',                             108, NULL, NULL, '2026-01-28 08:00:00.0000000', '2026-01-28 08:00:00.0000000'),
(409, 509, 1022, 'full',   4890.00, 'amount_exact',  1.00, 'Exact amount match on Datadog Monitoring December 2025',                         108, NULL, NULL, '2026-01-25 21:30:00.0000000', '2026-01-25 21:30:00.0000000'),
-- Company 102 - Medina Medical Clinic
(410, 510, 1029, 'full',  42300.00, 'amount_exact',  1.00, 'Exact amount match on medical supplies from McKesson January order',             109, NULL, NULL, '2026-01-20 12:00:00.0000000', '2026-01-20 12:00:00.0000000'),
(411, 511, 1032, 'full',  28400.00, 'amount_exact',  1.00, 'Exact amount match on pharmaceutical order from Cardinal Health',                109, NULL, NULL, '2026-01-28 08:00:00.0000000', '2026-01-28 08:00:00.0000000'),
(412, 512, 1030, 'full',   3600.00, 'amount_exact',  1.00, 'Exact amount match on practice management software from Practice Fusion',        109, NULL, NULL, '2026-01-22 09:00:00.0000000', '2026-01-22 09:00:00.0000000'),
(413, 513, 1035, 'full',  18500.00, 'amount_exact',  1.00, 'Exact amount match on MRI machine lease from GE Healthcare Financial',           109, NULL, NULL, '2026-02-05 10:00:00.0000000', '2026-02-05 10:00:00.0000000'),
(414, 514, 1039, 'full',  12000.00, 'amount_exact',  1.00, 'Exact amount match on EHR system support renewal from Epic Systems',             109, NULL, NULL, '2026-02-10 20:30:00.0000000', '2026-02-10 20:30:00.0000000'),
-- Company 103 - Harbor View Hospitality
(415, 515, 1043, 'full',  34500.00, 'amount_exact',  1.00, 'Exact amount match on food supply from Sysco Miami',                              110, NULL, NULL, '2026-01-18 10:00:00.0000000', '2026-01-18 10:00:00.0000000'),
(416, 516, 1046, 'full',  12800.00, 'amount_exact',  1.00, 'Exact amount match on beverage supply from Southern Glazers',                    110, NULL, NULL, '2026-01-25 11:00:00.0000000', '2026-01-25 11:00:00.0000000'),
(417, 517, 1044, 'full',   8900.00, 'amount_exact',  1.00, 'Exact amount match on hotel booking commission from Expedia Group',              110, NULL, NULL, '2026-01-20 09:00:00.0000000', '2026-01-20 09:00:00.0000000'),
(418, 518, 1045, 'full',   5200.00, 'amount_exact',  1.00, 'Exact amount match on linen and laundry services from UniFirst Hospitality',     110, NULL, NULL, '2026-01-22 08:00:00.0000000', '2026-01-22 08:00:00.0000000'),
(419, 519, 1054, 'full',   6400.00, 'amount_exact',  1.00, 'Exact amount match on valet parking service from Prestige Valet Parking',        110, NULL, NULL, '2026-02-12 19:30:00.0000000', '2026-02-12 19:30:00.0000000'),
-- Company 104 - O'Brien Logistics
(420, 520, 1070, 'full', 280000.00, 'amount_exact',  1.00, 'Exact amount match on contract logistics payment from Amazon Logistics',         111, NULL, NULL, '2026-02-20 18:00:00.0000000', '2026-02-20 18:00:00.0000000'),
(421, 521, 1058, 'full',  24000.00, 'amount_exact',  1.00, 'Exact amount match on truck lease payments from Ryder Truck Leasing',            111, NULL, NULL, '2026-01-22 09:00:00.0000000', '2026-01-22 09:00:00.0000000'),
(422, 522, 1057, 'full',  18400.00, 'amount_exact',  1.00, 'Exact amount match on fleet fuel from Shell Fleet Solutions',                    111, NULL, NULL, '2026-01-18 10:00:00.0000000', '2026-01-18 10:00:00.0000000'),
(423, 523, 1060, 'full',   6800.00, 'amount_exact',  1.00, 'Exact amount match on vehicle maintenance from Penske Truck Services',           111, NULL, NULL, '2026-01-28 08:00:00.0000000', '2026-01-28 08:00:00.0000000'),
(424, 524, 1067, 'full',   2400.00, 'amount_exact',  1.00, 'Exact amount match on GPS tracking software from Samsara Networks',              111, NULL, NULL, '2026-02-08 18:30:00.0000000', '2026-02-08 18:30:00.0000000'),
-- Company 105 - Tokyo Bites
(425, 525, 1071, 'full',   6800.00, 'amount_exact',  1.00, 'Exact amount match on fresh fish delivery from Tokyo Fish Market LA',            112, NULL, NULL, '2026-01-18 09:00:00.0000000', '2026-01-18 09:00:00.0000000'),
(426, 526, 1072, 'full',   4200.00, 'amount_exact',  1.00, 'Exact amount match on sake and beverages from Mutual Trading Co Inc',            112, NULL, NULL, '2026-01-20 10:00:00.0000000', '2026-01-20 10:00:00.0000000'),
(427, 527, 1077, 'full',   3100.00, 'amount_exact',  1.00, 'Exact amount match on rice and dry goods from JFC International Inc',            112, NULL, NULL, '2026-02-05 09:00:00.0000000', '2026-02-05 09:00:00.0000000'),
(428, 528, 1083, 'full',   8400.00, 'amount_exact',  1.00, 'Exact amount match on DoorDash commission from DoorDash Inc',                    112, NULL, NULL, '2026-02-15 17:30:00.0000000', '2026-02-15 17:30:00.0000000'),
(429, 529, 1078, 'full',    400.00, 'amount_exact',  1.00, 'Exact amount match on POS system subscription from Toast Inc',                   112, NULL, NULL, '2026-02-10 09:00:00.0000000', '2026-02-10 09:00:00.0000000'),
-- Company 106 - GreenLeaf Organic Grocers
(430, 530, 1085, 'full',  14200.00, 'amount_exact',  1.00, 'Exact amount match on organic produce delivery from Organically Grown Company',  113, NULL, NULL, '2026-01-19 09:00:00.0000000', '2026-01-19 09:00:00.0000000'),
(431, 531, 1086, 'full',   8600.00, 'amount_exact',  1.00, 'Exact amount match on dairy and eggs from Organic Valley Farms',                 113, NULL, NULL, '2026-01-22 10:00:00.0000000', '2026-01-22 10:00:00.0000000'),
(432, 532, 1091, 'full',  11200.00, 'amount_exact',  1.00, 'Exact amount match on organic meat and poultry from Applegate Farms',            113, NULL, NULL, '2026-02-08 09:00:00.0000000', '2026-02-08 09:00:00.0000000'),
(433, 533, 1090, 'full',   5600.00, 'amount_exact',  1.00, 'Exact amount match on bulk grains and legumes from Bob''s Red Mill Natural Foods',113, NULL, NULL, '2026-02-04 10:00:00.0000000', '2026-02-04 10:00:00.0000000'),
(434, 534, 1095, 'full',   4800.00, 'amount_exact',  1.00, 'Exact amount match on organic coffee beans from Stumptown Coffee Roasters',      113, NULL, NULL, '2026-02-08 18:30:00.0000000', '2026-02-08 18:30:00.0000000');

SET IDENTITY_INSERT dbo.FP26_invoice_transaction_matches OFF;
GO
-- ============================================================
-- 12. ANOMALIES
-- ============================================================
PRINT 'Seeding FP26_anomalies...';
SET IDENTITY_INSERT dbo.FP26_anomalies ON;

INSERT INTO dbo.FP26_anomalies
    (id, company_id, anomaly_type, title, description, severity, status, suggested_action, related_invoice_id, related_transaction_id, related_match_id, amount, detection_method, detection_confidence, resolved_by_user_id, resolution_notes, resolved_at, created_at, updated_at)
VALUES
(100, 100, 'duplicate_transaction', 'Duplicate transaction detected',
    'Transaction #1004 (Equipment rental - Mini excavators, ,400.00) from Herc Rentals Inc appears to be a duplicate of another entry. Same vendor and amount posted on the same day.',
    'warning', 'open', 'Review and merge or remove duplicate transaction',
    NULL, 1004, NULL, 8400.00, 'ai', 0.92, NULL, NULL, NULL,
    '2026-01-16 09:00:00.0000000', '2026-01-16 09:00:00.0000000'),
(101, 101, 'suspicious_vendor', 'Vendor flagged for review',
    'Stripe Inc transactions (,230.00) flagged due to high processing fees relative to transaction volume. Potential rate optimization opportunity.',
    'warning', 'open', 'Review Stripe pricing agreement and negotiate rates',
    NULL, 1018, NULL, 6230.00, 'ai', 0.82, NULL, NULL, NULL,
    '2026-01-13 10:00:00.0000000', '2026-01-13 10:00:00.0000000'),
(102, 102, 'missing_invoice', 'Transaction missing invoice',
    'Transaction #1037 (Medical supplies - February, ,900.00) from McKesson Medical-Surgical has no corresponding invoice uploaded.',
    'high', 'open', 'Upload invoice for this transaction',
    NULL, 1037, NULL, 38900.00, 'ai', 0.95, NULL, NULL, NULL,
    '2026-02-03 09:00:00.0000000', '2026-02-03 09:00:00.0000000'),
(103, 103, 'unusual_amount', 'Unusually high transaction amount',
    'Transaction #1051 (,000.00) from Various OTAs (booking revenue) is significantly higher than the average monthly revenue from this category.',
    'info', 'open', 'Verify the transaction with the accounting department',
    NULL, 1051, NULL, 95000.00, 'ai', 0.75, NULL, NULL, NULL,
    '2026-02-02 10:00:00.0000000', '2026-02-02 10:00:00.0000000'),
(104, 104, 'duplicate_invoice', 'Duplicate invoice submitted',
    'Invoice INV-2026-403 (,400.00) from Shell Fleet Solutions appears to reference the same invoice number as a previously submitted invoice for the same vendor.',
    'high', 'open', 'Verify with vendor if this is a corrected reissue or a duplicate',
    522, NULL, NULL, 18400.00, 'ai', 0.96, NULL, NULL, NULL,
    '2026-02-01 08:00:00.0000000', '2026-02-01 08:00:00.0000000'),
(105, 105, 'vendor_anomaly', 'New vendor - no prior transactions',
    'Transaction to DoorDash Inc (,400.00) is the first transaction with this vendor. Consider verifying vendor details and contract terms.',
    'info', 'resolved', 'Verify vendor credentials and partnership agreement',
    NULL, 1083, NULL, 8400.00, 'rule', 1.00,
    112, 'Verified DoorDash partnership agreement on file. Approved for ongoing delivery commission payments.',
    '2026-02-16 11:00:00.0000000',
    '2026-02-16 08:00:00.0000000', '2026-02-16 11:00:00.0000000'),
(106, 106, 'approval_required', 'Large transaction requires approval',
    'Invoice INV-2026-605 (,800.00) from Stumptown Coffee Roasters exceeds the standard monthly spend threshold for beverage category.',
    'warning', 'open', 'Review and approve the payment',
    534, NULL, NULL, 4800.00, 'rule', 0.90, NULL, NULL, NULL,
    '2026-02-09 09:00:00.0000000', '2026-02-09 09:00:00.0000000'),
(107, 100, 'approval_required', 'Large transaction requires approval',
    'Transaction #1010 (,000.00) from Related Companies exceeds the auto-approval threshold of ,000.00. Manual approval required.',
    'high', 'resolved', 'Review and approve the payment',
    NULL, 1010, 400, 250000.00, 'rule', 1.00,
    107, 'Approved - relates to signed contract #BC-2026-001 for 1201 Broadway project. Funds received and reconciled.',
    '2026-02-09 10:00:00.0000000',
    '2026-02-08 17:00:00.0000000', '2026-02-09 10:00:00.0000000'),
(108, 103, 'late_payment', 'Potential lost early payment discount',
    'Invoice INV-2026-302 (,800.00) from Southern Glazers Wine & Spirits was processed on 2026-01-14, potentially missing the 2% early payment discount window.',
    'warning', 'open', 'Check payment terms and negotiate if needed for future orders',
    516, NULL, NULL, 12800.00, 'rule', 0.90, NULL, NULL, NULL,
    '2026-01-15 09:00:00.0000000', '2026-01-15 09:00:00.0000000'),
(109, 104, 'missing_transaction', 'Invoice without matching transaction',
    'Invoice INV-2026-405 (,400.00) from Samsara Networks is marked as is_matched but the matched transaction was not found during reconciliation.',
    'low', 'open', 'Check if the transaction needs to be imported or if this represents a prepaid annual service',
    524, NULL, NULL, 2400.00, 'ai', 0.85, NULL, NULL, NULL,
    '2026-02-09 10:00:00.0000000', '2026-02-09 10:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_anomalies OFF;
GO

-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================
PRINT 'Seeding FP26_notifications...';
SET IDENTITY_INSERT dbo.FP26_notifications ON;

INSERT INTO dbo.FP26_notifications
    (id, event_id, user_id, event_type, scope, title, body, severity, is_read, company_id, link, target_type, target_id, dedupe_key, created_at, read_at)
VALUES
(2000, NEWID(), 107, 'invoice_matched', 'company', 'Invoice matched successfully',
    'Invoice INV-2026-001 for ,000.00 from Related Companies has been matched to transaction #1010.',
    'success', 0, 100, '/companies/100/invoices/100', 'invoice', '100', 'inv-matched-100', '2026-02-08 16:30:00.0000000', NULL),
(2001, NEWID(), 108, 'new_anomaly', 'company', 'Anomaly detected',
    'A new anomaly has been detected for PAL Technologies Ltd. Stripe processing fees flagged for review.',
    'warning', 0, 101, '/companies/101/anomalies/101', 'anomaly', '101', 'anom-101-101', '2026-01-13 10:00:00.0000000', NULL),
(2002, NEWID(), 107, 'accountant_granted', 'personal', 'Accountant granted access',
    'Michael Goldstein (CPA) has been granted access to Baker Construction Group with full permissions.',
    'info', 1, NULL, '/accountants/102', 'accountant', '102', 'acc-grant-107-102', '2026-01-10 09:00:00.0000000', '2026-01-11 08:00:00.0000000'),
(2003, NEWID(), 112, 'access_request', 'personal', 'New access request from accountant',
    'Dr. Emily Watson has requested access to Tokyo Bites Restaurant LLC. Review and respond to this request.',
    'info', 0, NULL, '/companies/105/access', 'access_request', '113', 'access-req-112-105', '2026-02-05 15:00:00.0000000', NULL),
(2004, NEWID(), 109, 'accountant_granted', 'personal', 'Accountant access approved',
    'Michael Goldstein (CPA) now has access to Medina Medical Clinic accounts.',
    'success', 1, NULL, '/accountants/102', 'accountant', '102', 'acc-grant-109-102', '2026-01-15 10:00:00.0000000', '2026-01-16 09:00:00.0000000'),
(2005, NEWID(), 107, 'report_ready', 'personal', 'Monthly report ready',
    'Your January 2026 financial report for Baker Construction Group is now available for review.',
    'info', 0, 100, '/companies/100/reports', 'report', '2026-01', 'report-100-2026-01', '2026-02-05 08:00:00.0000000', NULL),
(2006, NEWID(), 111, 'invoice_verified', 'company', 'Invoice verified',
    'Invoice INV-2026-401 for ,000.00 from Amazon Logistics has been verified and is pending payment.',
    'success', 0, 104, '/companies/104/invoices/120', 'invoice', '120', 'inv-ver-104-120', '2026-02-20 14:30:00.0000000', NULL),
(2007, NEWID(), 108, 'payment_reminder', 'personal', 'Payment due reminder',
    'Invoice INV-2026-105 for ,890.00 from Datadog Inc is due in 7 days on February 24, 2026.',
    'warning', 0, 101, '/companies/101/invoices/109', 'invoice', '109', 'pay-rem-101-109', '2026-02-17 08:00:00.0000000', NULL),
(2008, NEWID(), 113, 'welcome', 'personal', 'Welcome to FinalProject!',
    'Your account has been created for GreenLeaf Organic Grocers. Start by uploading your first transaction file or connecting your bank account.',
    'info', 1, NULL, '/getting-started', 'user', '113', 'welcome-113', '2025-11-20 10:00:00.0000000', '2025-11-20 10:30:00.0000000'),
(2009, NEWID(), 110, 'anomaly_resolved', 'company', 'Anomaly resolved',
    'Anomaly regarding large booking revenue transaction (,000.00) has been reviewed and marked for follow-up.',
    'info', 0, 103, '/companies/103/anomalies/103', 'anomaly', '103', 'anom-res-103-103', '2026-02-03 10:00:00.0000000', NULL),
(2010, NEWID(), 107, 'accountant_review', 'personal', 'New review submitted',
    'A review has been submitted for Amir Hashemi (CPA) by Baker Construction Group. Rating: 5/5.',
    'info', 1, NULL, '/accountants/106', 'review', '105', 'review-107-106', '2026-03-05 08:00:00.0000000', '2026-03-05 09:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_notifications OFF;
GO
-- ============================================================
-- 14. AUDIT LOGS
-- ============================================================
PRINT 'Seeding FP26_audit_logs...';
SET IDENTITY_INSERT dbo.FP26_audit_logs ON;

INSERT INTO dbo.FP26_audit_logs
    (id, user_id, company_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at)
VALUES
(3000, 107, 100, 'create', 'company', 100, NULL, '{"name":"Baker Construction Group"}', '192.168.1.100', '2025-07-15 14:30:00.0000000'),
(3001, 108, 101, 'create', 'company', 101, NULL, '{"name":"PAL Technologies Ltd"}', '192.168.1.101', '2025-08-20 12:00:00.0000000'),
(3002, 109, 102, 'create', 'company', 102, NULL, '{"name":"Medina Medical Clinic"}', '192.168.1.102', '2025-09-10 09:30:00.0000000'),
(3003, 110, 103, 'create', 'company', 103, NULL, '{"name":"Harbor View Hospitality Inc"}', '192.168.1.103', '2025-10-05 13:30:00.0000000'),
(3004, 111, 104, 'create', 'company', 104, NULL, '{"name":"O''Brien Logistics Corp"}', '192.168.1.104', '2025-11-05 10:30:00.0000000'),
(3005, 112, 105, 'create', 'company', 105, NULL, '{"name":"Tokyo Bites Restaurant LLC"}', '192.168.1.105', '2025-12-01 12:30:00.0000000'),
(3006, 113, 106, 'create', 'company', 106, NULL, '{"name":"GreenLeaf Organic Grocers"}', '192.168.1.106', '2025-11-20 10:00:00.0000000'),
(3007, 107, 100, 'match', 'invoice_transaction', 100, NULL, '{"invoice_id":100,"transaction_id":1010,"amount":250000}', '192.168.1.100', '2026-02-08 16:30:00.0000000'),
(3008, 108, 101, 'upload', 'transaction', 1015, NULL, '{"count":14,"source":"excel"}', '192.168.1.101', '2026-01-03 08:00:00.0000000'),
(3009, 109, 102, 'upload', 'invoice', 110, NULL, '{"filename":"INV-2026-201.pdf","size":342000}', '192.168.1.102', '2026-01-06 16:00:00.0000000'),
(3010, 107, 100, 'resolve', 'anomaly', 107, '{"status":"open"}', '{"status":"resolved"}', '192.168.1.100', '2026-02-09 10:00:00.0000000'),
(3011, 112, 105, 'resolve', 'anomaly', 105, '{"status":"open"}', '{"status":"resolved"}', '192.168.1.105', '2026-02-16 11:00:00.0000000'),
(3012, 103, 101, 'access', 'user_company_access', 109, NULL, '{"access_level":"full","status":"active"}', '192.168.1.101', '2026-01-12 11:00:00.0000000'),
(3013, 100, NULL, 'login', 'user', 100, NULL, '{"ip":"10.0.0.50"}', '10.0.0.50', '2026-03-10 08:30:00.0000000'),
(3014, 101, NULL, 'login', 'user', 101, NULL, '{"ip":"10.0.0.51"}', '10.0.0.51', '2026-03-09 09:15:00.0000000');

SET IDENTITY_INSERT dbo.FP26_audit_logs OFF;
GO

-- ============================================================
-- 15. SYSTEM LOGS
-- ============================================================
PRINT 'Seeding FP26_system_logs...';
SET IDENTITY_INSERT dbo.FP26_system_logs ON;

INSERT INTO dbo.FP26_system_logs
    (id, level, category, message, details, user_id, ip_address, user_agent, created_at)
VALUES
(1000, 'info',    'Startup',    'Application started successfully',                         NULL,                                           NULL, NULL, NULL, '2026-03-10 06:00:00.0000000'),
(1001, 'info',    'Database',   'Database connection established',                          '{"server":"Media.ruppin.ac.il","db":"igroup104_test2"}', NULL, NULL, NULL, '2026-03-10 06:00:01.0000000'),
(1002, 'info',    'Hangfire',   'Hangfire server started',                                  NULL,                                           NULL, NULL, NULL, '2026-03-10 06:00:02.0000000'),
(1003, 'info',    'Matching',   'Scheduled matching job completed for 7 companies',         '{"companies_processed":7,"matches_created":0}', NULL, NULL, NULL, '2026-03-10 06:30:00.0000000'),
(1004, 'warning', 'Auth',       'Failed login attempt for unknown email',                   '{"email":"hacker@malicious.com"}',             NULL, '10.0.0.99', 'Mozilla/5.0', '2026-03-09 22:15:00.0000000'),
(1005, 'info',    'Upload',     'File upload completed: INV-2026-605.pdf',                  '{"size":14500,"type":"application/pdf"}',      113, '192.168.1.106', 'Mozilla/5.0 Chrome/120', '2026-02-08 18:00:00.0000000'),
(1006, 'info',    'AI',         'AI extraction completed for invoice 134',                  '{"confidence":0.94,"method":"hybrid"}',        113, NULL, NULL, '2026-02-08 18:01:00.0000000'),
(1007, 'info',    'Matching',   'Manual match created by user 107',                         '{"invoice_id":100,"transaction_id":1010}',      107, '192.168.1.100', NULL, '2026-02-08 16:30:00.0000000'),
(1008, 'info',    'Anomaly',    'New anomaly detected (type: duplicate_transaction)',       '{"company_id":100,"amount":8400}',              NULL, NULL, NULL, '2026-01-16 09:00:00.0000000'),
(1009, 'info',    'Email',      'Welcome email sent to fatima@greenleaf.com',               NULL,                                           NULL, NULL, NULL, '2025-11-20 10:01:00.0000000'),
(1010, 'warning', 'Storage',    'Disk space warning: uploads directory at 72% capacity',    '{"used_gb":28.8,"total_gb":40}',               NULL, NULL, NULL, '2026-03-01 00:00:00.0000000');

SET IDENTITY_INSERT dbo.FP26_system_logs OFF;
GO

PRINT '============================================';
PRINT 'Seed data insertion complete!';
PRINT '============================================';
PRINT '';
PRINT 'All users password: Password123!';
PRINT 'SHA-512 hash: nLpzwxrBXSFRI4LOayHoP4uf3dMRlv9PVFWajimt0eO8QDjIbJvudRLQ2Opy7JSAWA3Gd6nxcrRjZuy1GYYVzA==';
GO

