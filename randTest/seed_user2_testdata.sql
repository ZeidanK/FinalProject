-- ============================================================
-- Seed Script: Test Data for User ID 2
-- Database: FinalProject (SQL Server)
-- Purpose: Populate all operational tables with realistic data
--          so we can test invoices, transactions, matching,
--          anomalies, bank accounts, and reports.
-- Usage:   Run this script against your dev database.
--          Safe to re-run — it deletes existing user-2 data first.
-- ============================================================

BEGIN TRANSACTION;
BEGIN TRY

-- ============================================================
-- 0. CLEAN UP previous test data for user 2 (child → parent order)
-- ============================================================
DELETE FROM audit_logs        WHERE user_id = 2;
DELETE FROM anomalies         WHERE company_id IN (SELECT id FROM companies WHERE created_by_user_id = 2);
DELETE FROM invoice_transaction_matches
    WHERE invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE created_by_user_id = 2));
DELETE FROM invoice_line_items
    WHERE invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE created_by_user_id = 2));
DELETE FROM transactions      WHERE company_id IN (SELECT id FROM companies WHERE created_by_user_id = 2);
DELETE FROM invoices          WHERE company_id IN (SELECT id FROM companies WHERE created_by_user_id = 2);
DELETE FROM bank_accounts     WHERE company_id IN (SELECT id FROM companies WHERE created_by_user_id = 2);
DELETE FROM user_company_access WHERE user_id = 2;
DELETE FROM companies         WHERE created_by_user_id = 2;
-- Do NOT delete the user row itself — it may already exist from registration.

-- ============================================================
-- 1. ENSURE USER 2 EXISTS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE id = 2)
BEGIN
    SET IDENTITY_INSERT users ON;
    INSERT INTO users (id, email, password_hash, name, role, phone, is_active, email_verified, created_at, updated_at)
    VALUES (2, 'testuser@example.com',
            -- bcrypt hash of 'Test1234!' (placeholder — update if your app uses a different hashing scheme)
            '$2a$11$K4WzQ5q5q5q5q5q5q5q5qOabc123def456ghi789jkl012mno345pqr',
            'Test User', 'business_owner', '050-1234567', 1, 1, GETDATE(), GETDATE());
    SET IDENTITY_INSERT users OFF;
END;

-- ============================================================
-- 2. COMPANIES (2 companies owned by user 2)
-- ============================================================
DECLARE @Company1Id BIGINT, @Company2Id BIGINT;

INSERT INTO companies
    (name, registration_number, street, city, state, postal_code, country, email, phone, tax_id, vat_number, fiscal_year_start, currency, is_active, created_by_user_id, created_at, updated_at)
VALUES
    ('Test Electronics Ltd', 'REG-TEST-001', '123 Tech Blvd', 'Tel Aviv', 'Tel Aviv', '6100001', 'Israel',
     'info@testelectronics.co.il', '03-1234567', 'IL-514000001', 'IL514000001',
     '2026-01-01', 'ILS', 1, 2, GETDATE(), GETDATE());
SET @Company1Id = SCOPE_IDENTITY();

INSERT INTO companies
    (name, registration_number, street, city, state, postal_code, country, email, phone, tax_id, vat_number, fiscal_year_start, currency, is_active, created_by_user_id, created_at, updated_at)
VALUES
    ('Test Consulting LLC', 'REG-TEST-002', '45 Business Ave', 'Haifa', 'Haifa', '3100001', 'Israel',
     'hello@testconsulting.co.il', '04-7654321', 'IL-514000002', 'IL514000002',
     '2026-01-01', 'ILS', 1, 2, GETDATE(), GETDATE());
SET @Company2Id = SCOPE_IDENTITY();

-- ============================================================
-- 3. USER-COMPANY ACCESS (admin access to both companies)
-- ============================================================
INSERT INTO user_company_access
    (user_id, company_id, access_level, status, granted_by_user_id, granted_at, created_at, updated_at)
VALUES
    (2, @Company1Id, 'admin', 'active', 2, GETDATE(), GETDATE(), GETDATE()),
    (2, @Company2Id, 'admin', 'active', 2, GETDATE(), GETDATE(), GETDATE());

-- ============================================================
-- 4. BANK ACCOUNTS (3 accounts across both companies)
-- ============================================================
DECLARE @BankAcct1 BIGINT, @BankAcct2 BIGINT, @BankAcct3 BIGINT;

INSERT INTO bank_accounts
    (company_id, bank_name, account_name, account_number_masked, account_type, currency, is_active, balance, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, 'Bank Leumi', 'Main Checking', '****4521', 'checking', 'ILS', 1, 52340.00, 2, GETDATE(), GETDATE());
SET @BankAcct1 = SCOPE_IDENTITY();

INSERT INTO bank_accounts
    (company_id, bank_name, account_name, account_number_masked, account_type, currency, is_active, balance, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, 'Bank Leumi', 'Savings', '****4522', 'savings', 'ILS', 1, 150000.00, 2, GETDATE(), GETDATE());
SET @BankAcct2 = SCOPE_IDENTITY();

INSERT INTO bank_accounts
    (company_id, bank_name, account_name, account_number_masked, account_type, currency, is_active, balance, created_by_user_id, created_at, updated_at)
VALUES
    (@Company2Id, 'Bank Hapoalim', 'Operating Account', '****8810', 'checking', 'ILS', 1, 28750.00, 2, GETDATE(), GETDATE());
SET @BankAcct3 = SCOPE_IDENTITY();

-- ============================================================
-- 5. INVOICES (6 invoices across both companies, mixed statuses)
-- ============================================================
DECLARE @Inv1 BIGINT, @Inv2 BIGINT, @Inv3 BIGINT,
        @Inv4 BIGINT, @Inv5 BIGINT, @Inv6 BIGINT;

-- Invoice 1: Matched invoice (company 1)
INSERT INTO invoices
    (company_id, invoice_number, vendor_name, vendor_tax_id, invoice_date, due_date, subtotal, vat_rate, vat_amount, total_amount, currency, status, is_verified, is_matched, matched_amount, uploaded_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, 'INV-2026-001', 'Shiran Supplies Ltd', 'IL-520000010', '2026-01-15', '2026-02-15',
     4200.00, 17.00, 714.00, 4914.00, 'ILS', 'matched', 1, 1, 4914.00, 2, GETDATE(), GETDATE());
SET @Inv1 = SCOPE_IDENTITY();

-- Invoice 2: Verified, not yet matched (company 1)
INSERT INTO invoices
    (company_id, invoice_number, vendor_name, vendor_tax_id, invoice_date, due_date, subtotal, vat_rate, vat_amount, total_amount, currency, status, is_verified, is_matched, uploaded_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, 'INV-2026-002', 'Office Plus Co', 'IL-520000020', '2026-02-01', '2026-03-01',
     1800.00, 17.00, 306.00, 2106.00, 'ILS', 'verified', 1, 0, 2, GETDATE(), GETDATE());
SET @Inv2 = SCOPE_IDENTITY();

-- Invoice 3: Extracted by AI, pending verification (company 1)
INSERT INTO invoices
    (company_id, invoice_number, vendor_name, invoice_date, due_date, subtotal, vat_rate, vat_amount, total_amount, currency, status, ai_extraction_confidence, ai_processed, is_verified, is_matched, uploaded_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, 'INV-2026-003', 'DataNet Solutions', '2026-02-20', '2026-03-20',
     8500.00, 17.00, 1445.00, 9945.00, 'ILS', 'extracted', 0.9200, 1, 0, 0, 2, GETDATE(), GETDATE());
SET @Inv3 = SCOPE_IDENTITY();

-- Invoice 4: Just uploaded (company 1)
INSERT INTO invoices
    (company_id, invoice_number, vendor_name, invoice_date, subtotal, total_amount, currency, status, is_verified, is_matched, uploaded_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, 'INV-2026-004', 'Quick Logistics', '2026-03-10',
     3200.00, 3200.00, 'ILS', 'uploaded', 0, 0, 2, GETDATE(), GETDATE());
SET @Inv4 = SCOPE_IDENTITY();

-- Invoice 5: Matched invoice (company 2)
INSERT INTO invoices
    (company_id, invoice_number, vendor_name, vendor_tax_id, invoice_date, due_date, subtotal, vat_rate, vat_amount, total_amount, currency, status, is_verified, is_matched, matched_amount, uploaded_by_user_id, created_at, updated_at)
VALUES
    (@Company2Id, 'INV-2026-005', 'Cloud Hosting Pro', 'IL-520000050', '2026-01-20', '2026-02-20',
     1200.00, 17.00, 204.00, 1404.00, 'ILS', 'matched', 1, 1, 1404.00, 2, GETDATE(), GETDATE());
SET @Inv5 = SCOPE_IDENTITY();

-- Invoice 6: Partially matched (company 2)
INSERT INTO invoices
    (company_id, invoice_number, vendor_name, invoice_date, due_date, subtotal, vat_rate, vat_amount, total_amount, currency, status, is_verified, is_matched, matched_amount, uploaded_by_user_id, created_at, updated_at)
VALUES
    (@Company2Id, 'INV-2026-006', 'Marketing Agency X', '2026-03-01', '2026-03-31',
     5000.00, 17.00, 850.00, 5850.00, 'ILS', 'verified', 1, 1, 3000.00, 2, GETDATE(), GETDATE());
SET @Inv6 = SCOPE_IDENTITY();

-- ============================================================
-- 6. INVOICE LINE ITEMS (1-2 per invoice)
-- ============================================================
INSERT INTO invoice_line_items
    (invoice_id, line_number, description, category, quantity, unit_price, vat_rate, total_amount, created_at, updated_at)
VALUES
    -- Inv1 line items
    (@Inv1, 1, 'USB-C Cables (bulk)', 'Office Supplies', 50, 60.00, 17.00, 3000.00, GETDATE(), GETDATE()),
    (@Inv1, 2, 'Monitor Stand', 'Office Equipment', 4, 300.00, 17.00, 1200.00, GETDATE(), GETDATE()),
    -- Inv2 line items
    (@Inv2, 1, 'Printer Paper A4 (500 sheets x 10)', 'Office Supplies', 10, 85.00, 17.00, 850.00, GETDATE(), GETDATE()),
    (@Inv2, 2, 'Ink Cartridges Set', 'Office Supplies', 2, 475.00, 17.00, 950.00, GETDATE(), GETDATE()),
    -- Inv3 line items
    (@Inv3, 1, 'Annual SaaS License - CRM Module', 'Software', 1, 8500.00, 17.00, 8500.00, GETDATE(), GETDATE()),
    -- Inv4 line item
    (@Inv4, 1, 'Express Freight Tel-Aviv to Haifa', 'Logistics', 1, 3200.00, NULL, 3200.00, GETDATE(), GETDATE()),
    -- Inv5 line items
    (@Inv5, 1, 'Cloud Hosting - January 2026', 'Cloud Services', 1, 1200.00, 17.00, 1200.00, GETDATE(), GETDATE()),
    -- Inv6 line items
    (@Inv6, 1, 'Social Media Campaign Q1', 'Marketing', 1, 3500.00, 17.00, 3500.00, GETDATE(), GETDATE()),
    (@Inv6, 2, 'Google Ads Management Fee', 'Marketing', 1, 1500.00, 17.00, 1500.00, GETDATE(), GETDATE());

-- ============================================================
-- 7. TRANSACTIONS (8 transactions across both companies)
-- ============================================================
DECLARE @Txn1 BIGINT, @Txn2 BIGINT, @Txn3 BIGINT, @Txn4 BIGINT,
        @Txn5 BIGINT, @Txn6 BIGINT, @Txn7 BIGINT, @Txn8 BIGINT;

-- Txn1: Matches Inv1 exactly (4914.00)
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, @BankAcct1, '2026-01-18', '2026-01-18', 'Payment to Shiran Supplies Ltd', -4914.00, 47426.00, 'debit', 'Office Supplies', 'REF-001018', 1, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn1 = SCOPE_IDENTITY();

-- Txn2: Matches Inv2 amount (2106.00) — not yet matched
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, @BankAcct1, '2026-02-05', '2026-02-05', 'Bank Transfer - Office Plus', -2106.00, 45320.00, 'debit', 'Office Supplies', 'REF-002005', 0, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn2 = SCOPE_IDENTITY();

-- Txn3: Customer payment (income)
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, @BankAcct1, '2026-02-10', '2026-02-10', 'Customer Payment - Acme Corp', 15000.00, 60320.00, 'credit', 'Revenue', 'REF-002010', 0, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn3 = SCOPE_IDENTITY();

-- Txn4: Salary payment
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, @BankAcct1, '2026-03-01', '2026-03-01', 'Salary - March 2026', -12000.00, 48320.00, 'debit', 'Payroll', 'REF-003001', 0, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn4 = SCOPE_IDENTITY();

-- Txn5: Suspicious duplicate of Txn1 (for anomaly testing)
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, is_duplicate, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company1Id, @BankAcct1, '2026-01-19', '2026-01-19', 'Payment to Shiran Supplies Ltd', -4914.00, 43412.00, 'debit', 'Office Supplies', 'REF-001019', 0, 1, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn5 = SCOPE_IDENTITY();

-- Txn6: Matches Inv5 exactly (1404.00) — company 2
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company2Id, @BankAcct3, '2026-01-25', '2026-01-25', 'Cloud Hosting Pro - Jan', -1404.00, 27346.00, 'debit', 'Cloud Services', 'REF-C2-001', 1, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn6 = SCOPE_IDENTITY();

-- Txn7: Partial match for Inv6 (3000 of 5850)
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company2Id, @BankAcct3, '2026-03-05', '2026-03-05', 'Marketing Agency X - Deposit', -3000.00, 24346.00, 'debit', 'Marketing', 'REF-C2-002', 1, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn7 = SCOPE_IDENTITY();

-- Txn8: Unmatched expense (company 2)
INSERT INTO transactions
    (company_id, bank_account_id, transaction_date, posted_date, description, amount, balance_after, transaction_type, category, reference_number, is_matched, status, created_by_user_id, created_at, updated_at)
VALUES
    (@Company2Id, @BankAcct3, '2026-03-15', '2026-03-15', 'Office Rent - March', -4500.00, 19846.00, 'debit', 'Rent', 'REF-C2-003', 0, 'confirmed', 2, GETDATE(), GETDATE());
SET @Txn8 = SCOPE_IDENTITY();

-- ============================================================
-- 8. INVOICE-TRANSACTION MATCHES (3 matches)
-- ============================================================

-- Match 1: Inv1 <-> Txn1 — full auto match
INSERT INTO invoice_transaction_matches
    (invoice_id, transaction_id, match_type, matched_amount, match_method, match_confidence, match_reason, status, matched_by_user_id, created_at, updated_at)
VALUES
    (@Inv1, @Txn1, 'full', 4914.00, 'auto', 0.9800,
     'Exact amount match (4914.00 ILS) + vendor name match', 'active', 2, GETDATE(), GETDATE());

-- Match 2: Inv5 <-> Txn6 — full manual match
INSERT INTO invoice_transaction_matches
    (invoice_id, transaction_id, match_type, matched_amount, match_method, match_confidence, match_reason, status, matched_by_user_id, created_at, updated_at)
VALUES
    (@Inv5, @Txn6, 'full', 1404.00, 'manual', 1.0000,
     'Manually matched by user - cloud hosting monthly payment', 'active', 2, GETDATE(), GETDATE());

-- Match 3: Inv6 <-> Txn7 — partial match (3000 of 5850)
INSERT INTO invoice_transaction_matches
    (invoice_id, transaction_id, match_type, matched_amount, match_method, match_confidence, match_reason, status, matched_by_user_id, created_at, updated_at)
VALUES
    (@Inv6, @Txn7, 'partial', 3000.00, 'ai_suggested', 0.7500,
     'Partial deposit payment - 3000 of 5850 ILS total', 'active', 2, GETDATE(), GETDATE());

-- ============================================================
-- 9. ANOMALIES (3 anomalies for testing)
-- ============================================================

-- Anomaly 1: Duplicate transaction detected (critical, open)
INSERT INTO anomalies
    (company_id, anomaly_type, title, description, severity, status,
     suggested_action, related_transaction_id, amount,
     detection_method, detection_confidence, created_at, updated_at)
VALUES
    (@Company1Id, 'duplicate_transaction',
     'Possible Duplicate Payment to Shiran Supplies',
     'Two transactions of 4914.00 ILS to Shiran Supplies Ltd detected on consecutive days (Jan 18 & Jan 19). This may be a duplicate payment.',
     'critical', 'open',
     'Review both transactions (REF-001018 and REF-001019) and confirm whether the second payment was intentional.',
     @Txn5, 4914.00,
     'ai', 0.9100, GETDATE(), GETDATE());

-- Anomaly 2: Amount mismatch warning (warning, open)
INSERT INTO anomalies
    (company_id, anomaly_type, title, description, severity, status,
     suggested_action, related_invoice_id, amount,
     detection_method, detection_confidence, created_at, updated_at)
VALUES
    (@Company2Id, 'amount_mismatch',
     'Partial Payment on Invoice INV-2026-006',
     'Invoice INV-2026-006 has a total of 5850.00 ILS but only 3000.00 ILS has been matched. Remaining balance: 2850.00 ILS.',
     'warning', 'open',
     'Verify if a second payment is expected or if the invoice amount needs correction.',
     @Inv6, 2850.00,
     'ai', 0.8500, GETDATE(), GETDATE());

-- Anomaly 3: Unusual amount (info, resolved)
INSERT INTO anomalies
    (company_id, anomaly_type, title, description, severity, status,
     suggested_action, related_invoice_id, amount,
     detection_method, detection_confidence,
     resolved_by_user_id, resolution_notes, resolved_at, created_at, updated_at)
VALUES
    (@Company1Id, 'unusual_amount',
     'High-Value Invoice from DataNet Solutions',
     'Invoice INV-2026-003 for 9945.00 ILS is significantly higher than the average invoice amount for this company (approx. 3500 ILS).',
     'info', 'resolved',
     'Review the invoice details and confirm the amount is correct.',
     @Inv3, 9945.00,
     'ai', 0.6500,
     2, 'Confirmed - annual SaaS license renewal, amount is correct.', GETDATE(), GETDATE(), GETDATE());

-- ============================================================
-- 10. AUDIT LOG ENTRIES (4 entries)
-- ============================================================
INSERT INTO audit_logs
    (user_id, company_id, action, entity_type, entity_id, description, created_at)
VALUES
    (2, @Company1Id, 'create', 'company', @Company1Id, 'Created company: Test Electronics Ltd', GETDATE()),
    (2, @Company2Id, 'create', 'company', @Company2Id, 'Created company: Test Consulting LLC', GETDATE()),
    (2, @Company1Id, 'upload', 'invoice', @Inv1, 'Uploaded invoice INV-2026-001 from Shiran Supplies Ltd', GETDATE()),
    (2, @Company1Id, 'create', 'match', NULL, 'Auto-matched INV-2026-001 with transaction REF-001018', GETDATE());

-- ============================================================
-- DONE
-- ============================================================
PRINT 'Seed data for user 2 inserted successfully.';
PRINT '  Companies created: 2  (IDs ' + CAST(@Company1Id AS VARCHAR) + ', ' + CAST(@Company2Id AS VARCHAR) + ')';
PRINT '  Bank accounts:     3';
PRINT '  Invoices:          6';
PRINT '  Line items:        9';
PRINT '  Transactions:      8';
PRINT '  Matches:           3';
PRINT '  Anomalies:         3';
PRINT '  Audit logs:        4';

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
