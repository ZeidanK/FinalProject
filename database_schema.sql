-- Financial Reconciliation System - Complete Database Schema
-- Created: November 25, 2025
-- This schema supports the full feature set of the mock frontend application

-- ============================================================================
-- CORE USER & AUTHENTICATION TABLES
-- ============================================================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('accountant', 'business_owner', 'admin') NOT NULL DEFAULT 'business_owner',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

CREATE TABLE password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- ============================================================================
-- COMPANY/BUSINESS TABLES
-- ============================================================================

CREATE TABLE companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    tax_id VARCHAR(100),
    vat_number VARCHAR(100),
    fiscal_year_start DATE,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_by_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_registration (registration_number),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- Many-to-many relationship between users and companies
CREATE TABLE user_company_access (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    access_level ENUM('full_access', 'view_only', 'limited') NOT NULL DEFAULT 'view_only',
    status ENUM('active', 'pending', 'revoked', 'expired') NOT NULL DEFAULT 'pending',
    granted_at TIMESTAMP NULL,
    granted_by_user_id BIGINT,
    revoked_at TIMESTAMP NULL,
    revoked_by_user_id BIGINT,
    expires_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_company (user_id, company_id),
    INDEX idx_user (user_id),
    INDEX idx_company (company_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- BANK ACCOUNT TABLES
-- ============================================================================

CREATE TABLE bank_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    account_number_masked VARCHAR(50), -- e.g., "****1234"
    account_type ENUM('checking', 'savings', 'credit_card', 'line_of_credit') NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP NULL,
    balance DECIMAL(15, 2),
    created_by_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_company (company_id),
    INDEX idx_active (is_active)
);

-- ============================================================================
-- INVOICE TABLES
-- ============================================================================

CREATE TABLE invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(255),
    vendor_tax_id VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    payment_date DATE NULL,
    subtotal DECIMAL(15, 2),
    vat_rate DECIMAL(5, 2), -- e.g., 20.00 for 20%
    vat_amount DECIMAL(15, 2),
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- File storage
    original_file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(50), -- pdf, jpg, png, etc.
    file_size_kb INT,
    
    -- Processing status
    status ENUM('uploaded', 'processing', 'processed', 'verified', 'matched', 'partially_matched', 'exported', 'error') NOT NULL DEFAULT 'uploaded',
    
    -- AI extraction metadata
    ai_confidence_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    ai_extraction_complete BOOLEAN DEFAULT FALSE,
    ai_processed_at TIMESTAMP NULL,
    
    -- Manual verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by_user_id BIGINT,
    verified_at TIMESTAMP NULL,
    
    -- Matching status
    is_matched BOOLEAN DEFAULT FALSE,
    matched_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Payment tracking
    number_of_payments INT DEFAULT 1,
    last_four_digits_card VARCHAR(4),
    
    -- Notes
    notes TEXT,
    internal_reference VARCHAR(100),
    
    -- Audit
    uploaded_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    UNIQUE KEY unique_company_invoice (company_id, invoice_number),
    INDEX idx_company (company_id),
    INDEX idx_status (status),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_vendor (vendor_name),
    INDEX idx_matched (is_matched),
    INDEX idx_verified (verified)
);

CREATE TABLE invoice_line_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id BIGINT NOT NULL,
    line_number INT NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(15, 2),
    vat_rate DECIMAL(5, 2),
    total_amount DECIMAL(15, 2) NOT NULL,
    ai_confidence_score DECIMAL(5, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice (invoice_id)
);

-- ============================================================================
-- TRANSACTION TABLES
-- ============================================================================

CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    bank_account_id BIGINT NOT NULL,
    
    -- Transaction details
    transaction_date DATE NOT NULL,
    value_date DATE,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL, -- negative for expenses, positive for income
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Classification
    transaction_type ENUM('debit', 'credit', 'fee', 'interest', 'transfer') NOT NULL,
    direction ENUM('in', 'out') NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Matching status
    status ENUM('unmatched', 'matched', 'partially_matched', 'review_needed', 'ignored') NOT NULL DEFAULT 'unmatched',
    is_matched BOOLEAN DEFAULT FALSE,
    matched_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    -- AI classification
    ai_suggested_category VARCHAR(100),
    ai_confidence_score DECIMAL(5, 4),
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP NULL,
    reconciled_by_user_id BIGINT,
    
    -- Duplicate detection
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_transaction_id BIGINT,
    
    -- Import tracking
    imported_from VARCHAR(100), -- file name or source
    import_batch_id VARCHAR(100),
    
    -- Audit
    imported_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (reconciled_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (imported_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (duplicate_of_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    
    INDEX idx_company (company_id),
    INDEX idx_bank_account (bank_account_id),
    INDEX idx_date (transaction_date),
    INDEX idx_status (status),
    INDEX idx_matched (is_matched),
    INDEX idx_type (transaction_type),
    INDEX idx_category (category)
);

-- ============================================================================
-- MATCHING TABLES (Many-to-Many between Invoices and Transactions)
-- ============================================================================

CREATE TABLE invoice_transaction_matches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id BIGINT NOT NULL,
    transaction_id BIGINT NOT NULL,
    
    -- Match details
    match_type ENUM('full', 'partial', 'split_invoice', 'split_transaction') NOT NULL DEFAULT 'full',
    matched_amount DECIMAL(15, 2) NOT NULL,
    
    -- Match source
    matched_by ENUM('ai_automatic', 'ai_suggested', 'manual', 'rule_based') NOT NULL,
    match_confidence DECIMAL(5, 4), -- AI confidence if applicable
    match_reason TEXT, -- explanation of why matched
    
    -- Status
    status ENUM('active', 'disputed', 'cancelled', 'confirmed') NOT NULL DEFAULT 'active',
    
    -- User actions
    matched_by_user_id BIGINT,
    confirmed_by_user_id BIGINT,
    confirmed_at TIMESTAMP NULL,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (matched_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_invoice (invoice_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (status),
    INDEX idx_matched_by (matched_by)
);

-- ============================================================================
-- ANOMALY & ALERT TABLES
-- ============================================================================

CREATE TABLE anomalies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    
    -- Classification
    anomaly_type ENUM(
        'duplicate_transaction',
        'duplicate_invoice',
        'amount_mismatch',
        'missing_invoice',
        'missing_transaction',
        'date_discrepancy',
        'unusual_amount',
        'vat_calculation_error',
        'vendor_mismatch',
        'unmatched_for_long_time',
        'other'
    ) NOT NULL,
    
    severity ENUM('critical', 'high', 'medium', 'low', 'info') NOT NULL DEFAULT 'medium',
    
    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT,
    suggested_action TEXT,
    
    -- Related entities
    invoice_id BIGINT,
    transaction_id BIGINT,
    related_invoice_id BIGINT, -- for duplicates
    related_transaction_id BIGINT, -- for duplicates
    
    -- Status
    status ENUM('open', 'investigating', 'resolved', 'ignored', 'false_positive') NOT NULL DEFAULT 'open',
    
    -- Resolution
    resolved_by_user_id BIGINT,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    
    -- Detection
    detected_by ENUM('ai', 'rule_engine', 'manual', 'system') NOT NULL DEFAULT 'ai',
    detection_confidence DECIMAL(5, 4),
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (related_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_company (company_id),
    INDEX idx_type (anomaly_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- ============================================================================
-- REPORTS & EXPORT TABLES
-- ============================================================================

CREATE TABLE exports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    
    -- Export details
    export_type ENUM(
        'vat_report',
        'consolidated_transactions',
        'invoice_list',
        'transaction_list',
        'matching_report',
        'anomaly_report',
        'audit_trail',
        'custom'
    ) NOT NULL,
    
    file_format ENUM('csv', 'excel', 'pdf', 'json', 'xml') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size_kb INT,
    
    -- Date range
    period_start DATE,
    period_end DATE,
    
    -- Filters applied
    filters_json JSON, -- store applied filters as JSON
    
    -- Stats
    record_count INT,
    total_amount DECIMAL(15, 2),
    
    -- Status
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Audit
    exported_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (exported_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_company (company_id),
    INDEX idx_type (export_type),
    INDEX idx_created (created_at)
);

CREATE TABLE vat_reports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    export_id BIGINT,
    
    -- Report period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_type ENUM('monthly', 'quarterly', 'annual') NOT NULL,
    
    -- VAT summary by rate
    vat_rate DECIMAL(5, 2) NOT NULL,
    taxable_amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) NOT NULL,
    
    -- Category breakdown
    category VARCHAR(100),
    transaction_count INT DEFAULT 0,
    
    -- Audit
    generated_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (export_id) REFERENCES exports(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_company (company_id),
    INDEX idx_period (period_start, period_end)
);

-- ============================================================================
-- SETTINGS & CONFIGURATION TABLES
-- ============================================================================

CREATE TABLE settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    company_id BIGINT,
    
    -- Settings can be user-specific or company-specific
    setting_category ENUM('general', 'ai', 'notifications', 'security', 'integration', 'export') NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    
    -- Metadata
    is_encrypted BOOLEAN DEFAULT FALSE,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Either user or company must be set, not both
    CHECK ((user_id IS NOT NULL AND company_id IS NULL) OR (user_id IS NULL AND company_id IS NOT NULL)),
    
    UNIQUE KEY unique_user_setting (user_id, setting_key),
    UNIQUE KEY unique_company_setting (company_id, setting_key),
    INDEX idx_category (setting_category)
);

CREATE TABLE ai_configurations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    
    -- AI provider settings
    provider ENUM('openai', 'anthropic', 'custom', 'none') NOT NULL DEFAULT 'openai',
    api_key_encrypted TEXT,
    model_name VARCHAR(100),
    
    -- Feature toggles
    enable_invoice_extraction BOOLEAN DEFAULT TRUE,
    enable_auto_matching BOOLEAN DEFAULT TRUE,
    enable_anomaly_detection BOOLEAN DEFAULT TRUE,
    enable_category_suggestion BOOLEAN DEFAULT TRUE,
    
    -- Thresholds
    auto_match_confidence_threshold DECIMAL(5, 4) DEFAULT 0.9000,
    auto_verify_confidence_threshold DECIMAL(5, 4) DEFAULT 0.9500,
    
    -- Advanced settings
    max_suggestions_per_item INT DEFAULT 3,
    learning_enabled BOOLEAN DEFAULT TRUE,
    
    updated_by_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_company (company_id)
);

-- ============================================================================
-- AUDIT & LOGGING TABLES
-- ============================================================================

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Who did what
    user_id BIGINT,
    company_id BIGINT,
    
    -- Action details
    action_type ENUM(
        'create', 'read', 'update', 'delete',
        'login', 'logout', 'permission_change',
        'upload', 'import', 'export',
        'match', 'unmatch', 'verify',
        'resolve_anomaly', 'system'
    ) NOT NULL,
    
    entity_type VARCHAR(50), -- e.g., 'invoice', 'transaction', 'user'
    entity_id BIGINT, -- ID of the affected entity
    
    -- Details
    action_description TEXT,
    old_values JSON,
    new_values JSON,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_company (company_id),
    INDEX idx_action (action_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Log details
    log_level ENUM('debug', 'info', 'warning', 'error', 'critical') NOT NULL,
    category VARCHAR(50), -- e.g., 'ai_processing', 'file_storage', 'matching_engine'
    message TEXT NOT NULL,
    
    -- Context
    company_id BIGINT,
    user_id BIGINT,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    
    -- Technical details
    stack_trace TEXT,
    error_code VARCHAR(50),
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_level (log_level),
    INDEX idx_category (category),
    INDEX idx_created (created_at),
    INDEX idx_company (company_id)
);

CREATE TABLE user_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session details
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    logged_out_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
);

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT,
    
    -- Notification details
    notification_type ENUM(
        'anomaly_detected',
        'processing_complete',
        'match_suggestion',
        'access_granted',
        'access_revoked',
        'export_ready',
        'system_alert',
        'reminder'
    ) NOT NULL,
    
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Related entities
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    action_url VARCHAR(500), -- deep link to relevant page
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP NULL,
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
);

-- ============================================================================
-- AI LEARNING & FEEDBACK TABLES
-- ============================================================================

CREATE TABLE ai_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    
    -- What was the AI action
    feedback_type ENUM(
        'invoice_extraction',
        'transaction_match',
        'category_suggestion',
        'anomaly_detection'
    ) NOT NULL,
    
    -- Related entities
    invoice_id BIGINT,
    transaction_id BIGINT,
    match_id BIGINT,
    anomaly_id BIGINT,
    
    -- Original AI prediction
    ai_prediction TEXT,
    ai_confidence DECIMAL(5, 4),
    
    -- User correction
    user_correction TEXT,
    was_correct BOOLEAN NOT NULL,
    
    -- Feedback
    feedback_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES invoice_transaction_matches(id) ON DELETE CASCADE,
    FOREIGN KEY (anomaly_id) REFERENCES anomalies(id) ON DELETE CASCADE,
    
    INDEX idx_company (company_id),
    INDEX idx_type (feedback_type),
    INDEX idx_correct (was_correct)
);

-- ============================================================================
-- HELPER/UTILITY TABLES
-- ============================================================================

CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT, -- NULL means global/system category
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id BIGINT,
    category_type ENUM('income', 'expense', 'asset', 'liability') NOT NULL,
    
    -- Accounting
    account_code VARCHAR(50),
    tax_deductible BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE, -- system categories can't be deleted
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL,
    
    INDEX idx_company (company_id),
    INDEX idx_name (name)
);

CREATE TABLE file_uploads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL,
    
    -- File details
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size_kb INT,
    mime_type VARCHAR(100),
    
    -- Purpose
    upload_type ENUM('invoice', 'transaction', 'document', 'profile', 'other') NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    
    -- Status
    status ENUM('uploading', 'uploaded', 'processing', 'completed', 'error') NOT NULL DEFAULT 'uploading',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_company (company_id),
    INDEX idx_type (upload_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_invoices_company_status_date ON invoices(company_id, status, invoice_date);
CREATE INDEX idx_transactions_company_status_date ON transactions(company_id, status, transaction_date);
CREATE INDEX idx_matches_invoice_status ON invoice_transaction_matches(invoice_id, status);
CREATE INDEX idx_matches_transaction_status ON invoice_transaction_matches(transaction_id, status);
CREATE INDEX idx_anomalies_company_status_severity ON anomalies(company_id, status, severity);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Dashboard statistics per company
CREATE VIEW v_company_dashboard_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    COUNT(DISTINCT i.id) as total_invoices,
    COUNT(DISTINCT CASE WHEN i.status = 'verified' THEN i.id END) as verified_invoices,
    COUNT(DISTINCT CASE WHEN i.is_matched = FALSE THEN i.id END) as unmatched_invoices,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(DISTINCT CASE WHEN t.is_matched = FALSE THEN t.id END) as unmatched_transactions,
    COUNT(DISTINCT CASE WHEN a.status = 'open' AND a.severity IN ('critical', 'high') THEN a.id END) as critical_anomalies,
    COUNT(DISTINCT m.id) as total_matches,
    COALESCE(SUM(i.total_amount), 0) as total_invoice_amount,
    COALESCE(SUM(ABS(t.amount)), 0) as total_transaction_amount
FROM companies c
LEFT JOIN invoices i ON c.id = i.company_id
LEFT JOIN transactions t ON c.id = t.company_id
LEFT JOIN anomalies a ON c.id = a.company_id
LEFT JOIN invoice_transaction_matches m ON i.id = m.invoice_id
GROUP BY c.id, c.name;

-- View: Pending matches for review
CREATE VIEW v_pending_matches AS
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.vendor_name,
    i.total_amount as invoice_amount,
    i.invoice_date,
    t.id as transaction_id,
    t.description as transaction_description,
    t.amount as transaction_amount,
    t.transaction_date,
    ABS(i.total_amount - ABS(t.amount)) as amount_difference,
    DATEDIFF(t.transaction_date, i.invoice_date) as date_difference_days,
    i.company_id
FROM invoices i
JOIN transactions t ON i.company_id = t.company_id
WHERE i.is_matched = FALSE
  AND t.is_matched = FALSE
  AND i.status != 'error'
  AND t.status != 'ignored'
  AND ABS(i.total_amount - ABS(t.amount)) < 10.00 -- Within $10
  AND ABS(DATEDIFF(t.transaction_date, i.invoice_date)) <= 30; -- Within 30 days

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

DELIMITER $$

-- Trigger: Log invoice changes
CREATE TRIGGER trg_invoice_audit_update
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id, company_id, action_type, entity_type, entity_id,
        action_description, old_values, new_values
    ) VALUES (
        NEW.verified_by_user_id,
        NEW.company_id,
        'update',
        'invoice',
        NEW.id,
        CONCAT('Invoice ', NEW.invoice_number, ' updated'),
        JSON_OBJECT(
            'status', OLD.status,
            'total_amount', OLD.total_amount,
            'is_matched', OLD.is_matched
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'total_amount', NEW.total_amount,
            'is_matched', NEW.is_matched
        )
    );
END$$

-- Trigger: Update invoice match status when match is created
CREATE TRIGGER trg_update_invoice_match_status
AFTER INSERT ON invoice_transaction_matches
FOR EACH ROW
BEGIN
    -- Update invoice matched amount
    UPDATE invoices i
    SET 
        matched_amount = (
            SELECT COALESCE(SUM(matched_amount), 0)
            FROM invoice_transaction_matches
            WHERE invoice_id = NEW.invoice_id AND status = 'active'
        ),
        is_matched = (
            SELECT COALESCE(SUM(matched_amount), 0)
            FROM invoice_transaction_matches
            WHERE invoice_id = NEW.invoice_id AND status = 'active'
        ) >= i.total_amount,
        status = CASE 
            WHEN (SELECT COALESCE(SUM(matched_amount), 0)
                  FROM invoice_transaction_matches
                  WHERE invoice_id = NEW.invoice_id AND status = 'active') >= i.total_amount
            THEN 'matched'
            WHEN (SELECT COALESCE(SUM(matched_amount), 0)
                  FROM invoice_transaction_matches
                  WHERE invoice_id = NEW.invoice_id AND status = 'active') > 0
            THEN 'partially_matched'
            ELSE i.status
        END
    WHERE id = NEW.invoice_id;
    
    -- Update transaction matched amount
    UPDATE transactions t
    SET 
        matched_amount = (
            SELECT COALESCE(SUM(matched_amount), 0)
            FROM invoice_transaction_matches
            WHERE transaction_id = NEW.transaction_id AND status = 'active'
        ),
        is_matched = (
            SELECT COALESCE(SUM(matched_amount), 0)
            FROM invoice_transaction_matches
            WHERE transaction_id = NEW.transaction_id AND status = 'active'
        ) >= ABS(t.amount),
        status = CASE 
            WHEN (SELECT COALESCE(SUM(matched_amount), 0)
                  FROM invoice_transaction_matches
                  WHERE transaction_id = NEW.transaction_id AND status = 'active') >= ABS(t.amount)
            THEN 'matched'
            WHEN (SELECT COALESCE(SUM(matched_amount), 0)
                  FROM invoice_transaction_matches
                  WHERE transaction_id = NEW.transaction_id AND status = 'active') > 0
            THEN 'partially_matched'
            ELSE t.status
        END
    WHERE id = NEW.transaction_id;
END$$

DELIMITER ;

-- ============================================================================
-- SAMPLE DATA INSERTION (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Insert default admin user (password should be hashed in real application)
INSERT INTO users (email, password_hash, name, role, is_active, email_verified)
VALUES ('admin@reconcile.com', '$2y$10$...hashedpassword...', 'System Administrator', 'admin', TRUE, TRUE);

-- Insert default categories
INSERT INTO categories (name, description, category_type, is_system) VALUES
('Office Supplies', 'Office supplies and materials', 'expense', TRUE),
('Professional Services', 'Consulting and professional fees', 'expense', TRUE),
('Utilities', 'Electricity, water, internet', 'expense', TRUE),
('Marketing', 'Advertising and marketing expenses', 'expense', TRUE),
('Travel', 'Business travel expenses', 'expense', TRUE),
('Sales Revenue', 'Income from sales', 'income', TRUE),
('Service Revenue', 'Income from services', 'income', TRUE);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
