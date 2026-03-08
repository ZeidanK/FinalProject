# Database Overview

## Purpose

This document describes the main database entities, their purpose, and how they relate to each other. The database uses PostgreSQL and follows relational design principles with proper normalization and referential integrity.

## Database Design Principles

- **Referential Integrity**: Foreign keys enforce relationships between entities
- **Data Integrity**: Constraints ensure data validity (NOT NULL, CHECK constraints)
- **Normalization**: Eliminate redundancy while maintaining query performance
- **Audit Trail**: Track who did what and when for all critical operations
- **Soft Deletes**: Important records marked as deleted rather than physically removed
- **Timestamps**: All entities track created_at and updated_at

---

## Core Entities

### 1. Users

**Purpose**: Store user account information for authentication and authorization

**Key Attributes**:
- `id` - Unique identifier (UUID or auto-increment)
- `email` - Unique email address for login
- `password_hash` - Bcrypt hashed password
- `name` - Full name of the user
- `role` - User role (BUSINESS_OWNER, ACCOUNTANT, ADMIN)
- `active` - Account status (active/inactive)
- `email_verified` - Whether email has been verified
- `created_at`, `updated_at` - Timestamps

**Relationships**:
- One user can own multiple Companies (as owner)
- One user can be linked to multiple Companies (as accountant)
- One user creates many Invoices (uploaded_by)
- One user performs many Actions (audit logs)

**Business Rules**:
- Email must be unique across the system
- Password must meet complexity requirements
- Role determines access permissions
- Deleted users are soft-deleted (active = false)

---

### 2. Roles & Permissions

**Purpose**: Define granular permissions for role-based access control

**Key Attributes**:
- `role_name` - BUSINESS_OWNER, ACCOUNTANT, ADMIN
- `permission` - Specific permission (e.g., upload_invoices, view_reports)

**Relationships**:
- Many-to-many between Roles and Permissions
- Users have one primary role

**Common Permissions**:
- `upload_invoices`
- `import_transactions`
- `approve_matches`
- `view_reports`
- `manage_accountants`
- `view_audit_logs`
- `configure_ai_settings`

---

### 3. Companies

**Purpose**: Represent business entities (tenants) in the multi-tenant system

**Key Attributes**:
- `id` - Unique identifier
- `name` - Company name
- `registration_number` - Official business registration number
- `vat_number` - VAT/tax identification number
- `address` - Company address
- `owner_id` - Foreign key to Users (the business owner)
- `active` - Whether company is active
- `settings` - JSON field for company-specific settings
- `created_at`, `updated_at` - Timestamps

**Relationships**:
- One Company belongs to one User (owner)
- One Company has many BankAccounts
- One Company has many Invoices
- One Company employs many Accountants (via junction table)
- One Company has many Reports
- One Company has many Anomalies

**Business Rules**:
- Each company must have an owner
- Company name must be unique per owner
- VAT number should be unique if provided
- Settings can include matching thresholds, notification preferences

---

### 4. Accountant Access (Junction Table)

**Purpose**: Grant accountants access to manage specific companies

**Key Attributes**:
- `id` - Unique identifier
- `accountant_id` - Foreign key to Users (where role = ACCOUNTANT)
- `company_id` - Foreign key to Companies
- `granted_by` - Foreign key to Users (who granted access)
- `granted_at` - When access was granted
- `revoked_at` - When access was revoked (NULL if active)
- `permissions` - JSON field for specific permissions granted

**Relationships**:
- Many-to-many relationship between Accountants and Companies
- Links Users (accountants) to Companies they manage

**Business Rules**:
- Accountant can access multiple companies
- Company can have multiple accountants
- Access can be revoked by company owner or admin
- Audit trail of who granted/revoked access

---

### 5. Bank Accounts

**Purpose**: Represent bank accounts linked to companies

**Key Attributes**:
- `id` - Unique identifier
- `company_id` - Foreign key to Companies
- `account_name` - Friendly name (e.g., "Main Checking")
- `account_number` - Masked account number (last 4 digits)
- `bank_name` - Name of the bank
- `currency` - Account currency (USD, GBP, EUR, etc.)
- `active` - Whether account is active
- `created_at`, `updated_at` - Timestamps

**Relationships**:
- One Company has many BankAccounts
- One BankAccount has many Transactions

**Business Rules**:
- Account number should be masked for security
- Currency defaults to company's base currency
- Inactive accounts don't show in transaction imports

---

### 6. Invoices

**Purpose**: Store invoice data from uploaded documents

**Key Attributes**:
- `id` - Unique identifier
- `company_id` - Foreign key to Companies
- `invoice_number` - Vendor's invoice number
- `vendor_name` - Name of the supplier/vendor
- `invoice_date` - Date on the invoice
- `due_date` - Payment due date
- `total_amount` - Total invoice amount
- `vat_amount` - VAT/tax amount
- `vat_rate` - VAT rate applied (e.g., 0.20 for 20%)
- `currency` - Invoice currency
- `reference` - Payment reference or PO number
- `file_path` - Path to uploaded file
- `ocr_data` - JSON field with raw OCR extraction
- `status` - processing, review_needed, ready, matched
- `uploaded_by` - Foreign key to Users
- `created_at`, `updated_at` - Timestamps

**Relationships**:
- One Company has many Invoices
- One Invoice can match one or more Transactions (via Matches)
- One Invoice can have multiple Anomalies

**Business Rules**:
- Invoice number should be unique per company and vendor
- Duplicate invoices trigger anomaly alerts
- Total amount and VAT amount must be positive
- Status workflow: processing → review_needed → ready → matched
- When matched, status changes to 'matched'

---

### 7. Transactions

**Purpose**: Store bank transactions imported from statements

**Key Attributes**:
- `id` - Unique identifier
- `bank_account_id` - Foreign key to BankAccounts
- `date` - Transaction date
- `description` - Bank's description of transaction
- `amount` - Transaction amount (positive for credits, negative for debits)
- `balance_after` - Account balance after transaction (optional)
- `reference` - Reference number or code
- `category` - Transaction category (optional)
- `status` - unmatched, matched, excluded
- `imported_at` - When transaction was imported
- `created_at` - Timestamp

**Relationships**:
- One BankAccount has many Transactions
- One Transaction can match one or more Invoices (via Matches)

**Business Rules**:
- Transactions should be unique per account (date + amount + reference)
- Duplicates detected during import are skipped
- Amount can be positive (income) or negative (expense)
- Status changes to 'matched' when matched with invoice

---

### 8. Matches

**Purpose**: Link invoices to their corresponding bank transactions

**Key Attributes**:
- `id` - Unique identifier
- `invoice_id` - Foreign key to Invoices
- `transaction_id` - Foreign key to Transactions
- `match_type` - auto, manual, partial
- `confidence` - Confidence score (0.0 to 1.0) for auto matches
- `match_reasons` - JSON array of why this was matched
- `status` - pending, approved, rejected
- `approved_by` - Foreign key to Users (who approved)
- `matched_at` - When match was created
- `approved_at` - When match was approved

**Relationships**:
- Many-to-one with Invoices
- Many-to-one with Transactions
- Enables one-to-one, one-to-many, and many-to-one matching

**Match Types**:
- **auto**: Automatically matched by AI algorithm
- **manual**: User manually matched
- **partial**: Partial match (invoice split across multiple transactions)

**Business Rules**:
- High confidence matches (>0.95) can be auto-approved
- Medium confidence matches (0.70-0.95) require manual review
- Low confidence matches (<0.70) flagged for attention
- Users can reject and delete incorrect matches
- Approved matches are considered final

---

### 9. Anomalies

**Purpose**: Track detected issues, discrepancies, and suspicious patterns

**Key Attributes**:
- `id` - Unique identifier
- `company_id` - Foreign key to Companies
- `anomaly_type` - Type of anomaly (duplicate_invoice, amount_mismatch, etc.)
- `severity` - low, medium, high, critical
- `description` - Human-readable description of the issue
- `invoice_id` - Foreign key to Invoices (if related to invoice)
- `transaction_id` - Foreign key to Transactions (if related to transaction)
- `match_id` - Foreign key to Matches (if related to match)
- `detected_data` - JSON field with details of what was detected
- `status` - open, investigating, resolved, false_positive
- `resolved_by` - Foreign key to Users
- `resolved_at` - When anomaly was resolved
- `resolution_note` - User's explanation of resolution
- `created_at` - When detected

**Anomaly Types**:
- `duplicate_invoice` - Same invoice number uploaded multiple times
- `amount_mismatch` - Invoice and transaction amounts don't match
- `missing_transaction` - Invoice without matching transaction
- `vat_calculation_error` - VAT amount doesn't match expected calculation
- `suspicious_pattern` - Unusual patterns detected by AI
- `round_number` - Suspiciously round numbers
- `timing_anomaly` - Unusual transaction timing

**Relationships**:
- One Company has many Anomalies
- Can reference Invoices, Transactions, or Matches

**Business Rules**:
- Anomalies generate notifications
- Status workflow: open → investigating → resolved
- False positives are marked but kept for audit purposes
- Critical anomalies require immediate attention

---

### 10. Notifications

**Purpose**: Store and manage user notifications

**Key Attributes**:
- `id` - Unique identifier
- `user_id` - Foreign key to Users
- `company_id` - Foreign key to Companies (optional)
- `type` - match_found, anomaly_detected, report_ready, etc.
- `title` - Notification title
- `message` - Notification message
- `data` - JSON field with additional context
- `read` - Whether notification has been read
- `read_at` - When notification was read
- `created_at` - Timestamp

**Notification Types**:
- `match_found` - Invoice matched with transaction
- `anomaly_detected` - New anomaly detected
- `report_ready` - VAT report generated
- `access_granted` - Accountant granted access to company
- `access_revoked` - Access revoked

**Relationships**:
- One User has many Notifications
- Can reference Company for business-specific notifications

**Business Rules**:
- Notifications can be in-app only or trigger emails
- Users can configure notification preferences
- Old notifications auto-archived after 90 days

---

### 11. Reports

**Purpose**: Store metadata about generated reports

**Key Attributes**:
- `id` - Unique identifier
- `company_id` - Foreign key to Companies
- `report_type` - vat_report, reconciliation_report, audit_report
- `period_start` - Report period start date
- `period_end` - Report period end date
- `parameters` - JSON field with report parameters
- `file_path` - Path to generated report file
- `format` - pdf, excel, csv
- `status` - generating, ready, failed
- `generated_by` - Foreign key to Users
- `generated_at` - When report was generated
- `created_at` - Timestamp

**Report Types**:
- `vat_report` - VAT/sales tax report
- `reconciliation_report` - Matched and unmatched items
- `audit_report` - Comprehensive audit trail
- `anomaly_report` - List of detected anomalies

**Relationships**:
- One Company has many Reports
- One User generates many Reports

**Business Rules**:
- Reports are immutable once generated
- File path points to PDF or Excel file
- Parameters stored for reproducibility

---

### 12. Audit Logs

**Purpose**: Maintain complete audit trail of all system actions

**Key Attributes**:
- `id` - Unique identifier
- `user_id` - Foreign key to Users (who performed action)
- `company_id` - Foreign key to Companies (if action was company-specific)
- `action` - Type of action (login, upload_invoice, approve_match, etc.)
- `entity_type` - What was affected (invoice, transaction, match, etc.)
- `entity_id` - ID of the affected entity
- `old_values` - JSON field with values before action
- `new_values` - JSON field with values after action
- `ip_address` - User's IP address
- `user_agent` - Browser/client information
- `created_at` - Timestamp (immutable)

**Common Actions**:
- `user_login`, `user_logout`
- `upload_invoice`, `update_invoice`, `delete_invoice`
- `import_transactions`
- `create_match`, `approve_match`, `reject_match`
- `generate_report`
- `grant_access`, `revoke_access`
- `resolve_anomaly`

**Relationships**:
- One User performs many Actions
- Logs can reference any entity type

**Business Rules**:
- Audit logs are immutable (never updated or deleted)
- All critical actions must be logged
- Logs retained for compliance (minimum 7 years)
- Only admins can view full audit logs

---

## Entity Relationship Summary

```
Users
  ├─ owns → Companies (one-to-many)
  ├─ manages → Companies (via AccountantAccess, many-to-many)
  ├─ uploads → Invoices (one-to-many)
  ├─ creates → Matches (one-to-many)
  └─ generates → Reports (one-to-many)

Companies
  ├─ has → BankAccounts (one-to-many)
  ├─ has → Invoices (one-to-many)
  ├─ has → Anomalies (one-to-many)
  ├─ has → Reports (one-to-many)
  └─ managed_by → Accountants (via AccountantAccess)

BankAccounts
  └─ has → Transactions (one-to-many)

Invoices
  ├─ matches → Transactions (via Matches, many-to-many)
  └─ triggers → Anomalies (one-to-many, optional)

Transactions
  ├─ matches → Invoices (via Matches, many-to-many)
  └─ triggers → Anomalies (one-to-many, optional)

Matches
  ├─ links → Invoice (many-to-one)
  ├─ links → Transaction (many-to-one)
  └─ approved_by → User (many-to-one)

Anomalies
  ├─ belongs_to → Company (many-to-one)
  ├─ references → Invoice (optional)
  ├─ references → Transaction (optional)
  └─ resolved_by → User (many-to-one, optional)
```

---

## Data Isolation (Multi-Tenancy)

### Tenant Isolation Strategy

Every query must be scoped to a company:

```sql
-- CORRECT: Scoped to company
SELECT * FROM invoices WHERE company_id = $1

-- INCORRECT: No company filter (would leak data)
SELECT * FROM invoices
```

### Middleware Enforcement

Backend middleware validates:
1. User is authenticated (valid JWT)
2. User has access to requested company_id
   - Business owners can only access their own companies
   - Accountants can access companies they're granted access to
   - Admins can access all companies

### Cross-Tenant References

- No foreign keys should cross tenant boundaries
- User entities are shared (not tenant-specific)
- All business data (invoices, transactions, etc.) is tenant-scoped

---

## Indexes for Performance

### Recommended Indexes

**Users**:
- Unique index on `email`
- Index on `role` for filtering

**Companies**:
- Index on `owner_id`
- Index on `active` status

**Invoices**:
- Index on `company_id` (critical for tenant isolation)
- Index on `status` for filtering unmatched invoices
- Composite index on `(company_id, invoice_date)` for date range queries
- Index on `invoice_number` for duplicate detection

**Transactions**:
- Index on `bank_account_id`
- Index on `status`
- Composite index on `(bank_account_id, date)` for date range queries

**Matches**:
- Index on `invoice_id`
- Index on `transaction_id`
- Index on `status`

**Audit Logs**:
- Index on `user_id`
- Index on `company_id`
- Composite index on `(entity_type, entity_id)`
- Index on `created_at` for time-based queries

---

## Data Retention & Archiving

### Retention Policies

- **Invoices**: Permanent (legal requirement)
- **Transactions**: Permanent (legal requirement)
- **Matches**: Permanent (audit trail)
- **Audit Logs**: Minimum 7 years
- **Notifications**: 90 days (then archived)
- **Reports**: 7 years

### Archiving Strategy

- Old notifications moved to separate archive table
- Old audit logs can be exported and compressed
- Database should not grow unbounded

---

## Backup & Recovery

### Backup Strategy

- **Daily**: Full database backup
- **Hourly**: Transaction log backup
- **Retention**: 30 days of daily backups, 12 months of monthly backups

### Recovery Plan

- Point-in-time recovery capability
- Test restores quarterly
- Document restoration procedures

---

## Security Considerations

### Sensitive Data

- Passwords hashed with bcrypt (never plain text)
- Bank account numbers masked (show last 4 digits only)
- Credit card data never stored (if payment processing added)

### Encryption

- Database connection encrypted (SSL/TLS)
- Sensitive fields can be encrypted at application level if required
- Backups encrypted before storage

### Access Control

- Database user has only necessary privileges
- No direct database access from outside services
- Read-only replicas for reporting (future)

---

## Future Considerations

As the system grows, consider:

- **Partitioning**: Partition large tables (audit_logs, notifications) by date
- **Read Replicas**: Separate read queries from writes for better performance
- **Time-Series Data**: Consider TimescaleDB extension for time-series transaction data
- **Full-Text Search**: PostgreSQL full-text search or Elasticsearch for invoice/transaction search
- **JSON Querying**: Leverage PostgreSQL's JSON capabilities for flexible OCR data storage
