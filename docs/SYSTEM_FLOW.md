# System Flow

## Overview

This document describes how data flows through the system for each major workflow. Each flow shows the sequence of operations and interactions between components.

---

## 1. User Login Flow

### Purpose
Authenticate users and establish a secure session for API access.

### Step-by-Step Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Enter credentials
     ▼
┌──────────────┐
│   Frontend   │
└───────┬──────┘
        │ 2. POST /api/auth/login
        │    { email, password }
        ▼
┌──────────────┐
│   Backend    │
└───────┬──────┘
        │ 3. Query user by email
        ▼
┌──────────────┐
│  Database    │
└───────┬──────┘
        │ 4. Return user record
        ▼
┌──────────────┐
│   Backend    │ 5. Verify password (bcrypt)
└───────┬──────┘    6. Generate JWT token
        │           7. Load user's companies
        │
        │ 8. Return JWT + user data
        ▼
┌──────────────┐
│   Frontend   │ 9. Store token in memory
└───────┬──────┘    10. Store user data in state
        │           11. Redirect to dashboard
        ▼
┌──────────┐
│  User    │ Sees dashboard
└──────────┘
```

### Data Flow Details

**Request** (Frontend → Backend):
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "plaintext_password"
}
```

**Database Query** (Backend → Database):
```sql
SELECT id, email, password_hash, role, name
FROM users
WHERE email = $1 AND active = true
```

**Response** (Backend → Frontend):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "BUSINESS_OWNER"
  },
  "companies": [
    { "id": "1", "name": "Acme Corp", "role": "owner" }
  ]
}
```

**Subsequent Requests**:
All API calls include the JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

---

## 2. Invoice Upload + OCR Flow

### Purpose
Extract structured data from uploaded invoice files using OCR.

### Step-by-Step Flow

```
┌──────────┐
│  User    │ 1. Select invoice file (PDF/image)
└────┬─────┘
     │
     ▼
┌──────────────┐
│   Frontend   │ 2. Upload file
└───────┬──────┘
        │ 3. POST /api/invoices/upload
        │    multipart/form-data
        │    + JWT token
        ▼
┌──────────────┐
│   Backend    │ 4. Validate file type/size
└───────┬──────┘ 5. Save file to disk/storage
        │        6. Create invoice record (status: processing)
        │
        │ 7. Save to database
        ▼
┌──────────────┐
│  Database    │ 8. Return invoice ID
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 9. Call OCR service
└───────┬──────┘
        │ 10. POST /ai/ocr/extract
        │     + file path or bytes
        ▼
┌──────────────┐
│ AI/OCR       │ 11. Load file
│ Service      │ 12. Perform OCR extraction
└───────┬──────┘ 13. Parse amounts, dates, vendor
        │        14. Calculate confidence scores
        │
        │ 15. Return extracted data
        ▼
┌──────────────┐
│   Backend    │ 16. Update invoice record with OCR data
└───────┬──────┘ 17. Set status: review_needed or ready
        │
        │ 18. Update database
        ▼
┌──────────────┐
│  Database    │ 19. Confirm update
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 20. Return complete invoice data
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Frontend   │ 21. Display extracted data
└───────┬──────┘ 22. Allow user to confirm/edit
        │
        ▼
┌──────────┐
│  User    │ Reviews and approves data
└──────────┘
```

### Data Flow Details

**Upload Request**:
```
POST /api/invoices/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: invoice.pdf
company_id: 123
```

**Database Insert**:
```sql
INSERT INTO invoices (company_id, filename, status, uploaded_by, uploaded_at)
VALUES ($1, $2, 'processing', $3, NOW())
RETURNING id
```

**OCR Service Request**:
```json
POST /ai/ocr/extract
{
  "file_path": "/uploads/invoice_123.pdf",
  "language": "eng"
}
```

**OCR Service Response**:
```json
{
  "success": true,
  "data": {
    "vendor_name": "ABC Suppliers Ltd",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "total_amount": 1200.00,
    "vat_amount": 204.00,
    "currency": "USD",
    "line_items": [...]
  },
  "confidence": {
    "vendor_name": 0.95,
    "total_amount": 0.98,
    "invoice_date": 0.92
  }
}
```

**Database Update**:
```sql
UPDATE invoices
SET vendor_name = $1,
    invoice_number = $2,
    invoice_date = $3,
    total_amount = $4,
    vat_amount = $5,
    ocr_data = $6,
    status = 'review_needed',
    processed_at = NOW()
WHERE id = $7
```

---

## 3. Transaction Import Flow

### Purpose
Import bank transactions from uploaded statements.

### Step-by-Step Flow

```
┌──────────┐
│  User    │ 1. Upload bank statement (CSV/Excel)
└────┬─────┘
     │
     ▼
┌──────────────┐
│   Frontend   │ 2. POST /api/transactions/import
└───────┬──────┘
        │ 3. Send file + bank account ID
        ▼
┌──────────────┐
│   Backend    │ 4. Validate file format
└───────┬──────┘ 5. Parse CSV/Excel
        │        6. Normalize data (different bank formats)
        │        7. Deduplicate transactions
        │
        │ 8. Bulk insert transactions
        ▼
┌──────────────┐
│  Database    │ 9. Check for duplicates
└───────┬──────┘ 10. Insert new transactions
        │         11. Return count
        ▼
┌──────────────┐
│   Backend    │ 12. Return import summary
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Frontend   │ 13. Display import results
└───────┬──────┘     "25 transactions imported"
        │
        ▼
┌──────────┐
│  User    │ Reviews transactions
└──────────┘
```

### Data Flow Details

**Import Request**:
```
POST /api/transactions/import
Content-Type: multipart/form-data

file: bank_statement.csv
bank_account_id: 456
```

**CSV Parsing**:
```csv
Date,Description,Amount,Reference
2024-01-15,"ABC Suppliers Ltd",1200.00,INV-2024-001
2024-01-16,"XYZ Services",-500.00,PAY-789
```

**Normalization** (handle different bank formats):
```javascript
{
  date: parseDate(row.Date),
  description: cleanDescription(row.Description),
  amount: parseAmount(row.Amount),
  reference: extractReference(row.Reference || row.Description)
}
```

**Database Bulk Insert**:
```sql
INSERT INTO transactions (bank_account_id, date, description, amount, reference, created_at)
VALUES
  ($1, '2024-01-15', 'ABC Suppliers Ltd', 1200.00, 'INV-2024-001', NOW()),
  ($1, '2024-01-16', 'XYZ Services', -500.00, 'PAY-789', NOW())
ON CONFLICT (bank_account_id, date, amount, reference) DO NOTHING
RETURNING id
```

---

## 4. Automated Matching Flow

### Purpose
Automatically match invoices with bank transactions using AI.

### Step-by-Step Flow

```
┌──────────┐
│  User    │ 1. Click "Run Auto-Match"
└────┬─────┘    OR system runs automatically after import
     │
     ▼
┌──────────────┐
│   Frontend   │ 2. POST /api/matching/auto-match
└───────┬──────┘
        │ 3. Send company_id, date range
        ▼
┌──────────────┐
│   Backend    │ 4. Fetch unmatched invoices
└───────┬──────┘ 5. Fetch unmatched transactions
        │
        │ 6. Query database
        ▼
┌──────────────┐
│  Database    │ 7. Return unmatched items
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 8. Call matching service
└───────┬──────┘
        │ 9. POST /ai/matching/find-matches
        │    { invoices, transactions }
        ▼
┌──────────────┐
│ AI Service   │ 10. Apply matching algorithms:
└───────┬──────┘     - Exact amount match
        │            - Date proximity
        │            - Vendor name similarity
        │            - Reference number match
        │      11. Calculate confidence scores
        │      12. Return match suggestions
        │
        ▼
┌──────────────┐
│   Backend    │ 13. Filter by confidence threshold
└───────┬──────┘ 14. Auto-approve high confidence (>95%)
        │        15. Flag medium confidence for review
        │
        │ 16. Insert matches
        ▼
┌──────────────┐
│  Database    │ 17. Create match records
└───────┬──────┘ 18. Update invoice/transaction status
        │
        ▼
┌──────────────┐
│   Backend    │ 19. Create notifications for matches
└───────┬──────┘ 20. Return match results
        │
        ▼
┌──────────────┐
│   Frontend   │ 21. Display matches
└───────┬──────┘ 22. Show pending reviews
        │
        ▼
┌──────────┐
│  User    │ Reviews and approves matches
└──────────┘
```

### Data Flow Details

**Matching Request**:
```json
POST /api/matching/auto-match
{
  "company_id": "123",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**AI Service Request**:
```json
POST /ai/matching/find-matches
{
  "invoices": [
    {
      "id": "inv_1",
      "vendor_name": "ABC Suppliers Ltd",
      "amount": 1200.00,
      "date": "2024-01-15",
      "reference": "INV-2024-001"
    }
  ],
  "transactions": [
    {
      "id": "txn_1",
      "description": "ABC Suppliers",
      "amount": 1200.00,
      "date": "2024-01-16",
      "reference": "INV-2024-001"
    }
  ]
}
```

**AI Service Response**:
```json
{
  "matches": [
    {
      "invoice_id": "inv_1",
      "transaction_id": "txn_1",
      "confidence": 0.97,
      "match_reasons": [
        "Exact amount match",
        "Reference number match",
        "Date within 2 days",
        "Vendor name 85% similar"
      ]
    }
  ]
}
```

**Database Insert**:
```sql
INSERT INTO matches (invoice_id, transaction_id, match_type, confidence, status, matched_at)
VALUES ($1, $2, 'auto', 0.97, 'approved', NOW())
```

---

## 5. Anomaly Detection Flow

### Purpose
Identify suspicious patterns, duplicates, and discrepancies.

### Step-by-Step Flow

```
┌──────────────┐
│   Backend    │ 1. Scheduled job OR manual trigger
└───────┬──────┘
        │ 2. Fetch recent invoices and transactions
        ▼
┌──────────────┐
│  Database    │ 3. Return data
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 4. Call anomaly detection
└───────┬──────┘
        │ 5. POST /ai/anomaly/detect
        ▼
┌──────────────┐
│ AI Service   │ 6. Run detection algorithms:
└───────┬──────┘    - Duplicate invoice numbers
        │           - Amount mismatches
        │           - Missing expected transactions
        │           - Suspicious patterns
        │           - Unusual amounts
        │     7. Return anomalies
        │
        ▼
┌──────────────┐
│   Backend    │ 8. Create anomaly records
└───────┬──────┘ 9. Generate notifications
        │
        │ 10. Insert anomalies
        ▼
┌──────────────┐
│  Database    │ 11. Confirm insert
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 12. Notify users (email + in-app)
└───────┬──────┘
        │
        │ 13. WebSocket or polling
        ▼
┌──────────────┐
│   Frontend   │ 14. Show notification badge
└───────┬──────┘
        │
        ▼
┌──────────┐
│  User    │ Clicks to view anomalies
└──────────┘
```

### Anomaly Types Detected

**Duplicate Invoice Detection**:
```sql
SELECT invoice_number, COUNT(*) 
FROM invoices 
WHERE company_id = $1 
GROUP BY invoice_number 
HAVING COUNT(*) > 1
```

**Amount Mismatch**:
- Invoice amount != Transaction amount (beyond tolerance)
- VAT calculation errors

**Missing Transactions**:
- Invoices without matching transactions after X days
- Expected regular transactions missing

**Suspicious Patterns**:
- Round number amounts (possible estimates)
- Same amount repeated multiple times
- Transactions outside business hours
- Unusual vendor names

---

## 6. VAT Report Generation Flow

### Purpose
Generate tax-compliant VAT reports from matched transactions.

### Step-by-Step Flow

```
┌──────────┐
│  User    │ 1. Select period (month/quarter)
└────┬─────┘
     │
     ▼
┌──────────────┐
│   Frontend   │ 2. POST /api/reports/vat
└───────┬──────┘
        │ 3. { company_id, start_date, end_date }
        ▼
┌──────────────┐
│   Backend    │ 4. Fetch matched invoices/transactions
└───────┬──────┘
        │ 5. Query with date filter
        ▼
┌──────────────┐
│  Database    │ 6. Return matched records with VAT data
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 7. Group by VAT rate
└───────┬──────┘ 8. Calculate totals:
        │           - Total sales
        │           - Total VAT collected
        │           - Total purchases
        │           - Total VAT paid
        │     9. Calculate VAT payable/refund
        │    10. Generate PDF/Excel report
        │
        │ 11. Save report record
        ▼
┌──────────────┐
│  Database    │ 12. Insert report metadata
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Backend    │ 13. Return report file + metadata
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Frontend   │ 14. Trigger file download
└───────┬──────┘
        │
        ▼
┌──────────┐
│  User    │ Downloads VAT report
└──────────┘
```

### Data Flow Details

**Report Request**:
```json
POST /api/reports/vat
{
  "company_id": "123",
  "period": {
    "start": "2024-01-01",
    "end": "2024-03-31"
  },
  "format": "pdf"
}
```

**Database Query**:
```sql
SELECT 
  i.invoice_number,
  i.invoice_date,
  i.vendor_name,
  i.total_amount,
  i.vat_amount,
  i.vat_rate,
  t.date as transaction_date,
  t.amount as transaction_amount
FROM invoices i
JOIN matches m ON m.invoice_id = i.id
JOIN transactions t ON t.id = m.transaction_id
WHERE i.company_id = $1
  AND i.invoice_date BETWEEN $2 AND $3
  AND m.status = 'approved'
ORDER BY i.invoice_date
```

**VAT Calculation**:
```javascript
const vatSummary = {
  standard_rate: { rate: 0.20, net: 10000, vat: 2000, gross: 12000 },
  reduced_rate: { rate: 0.05, net: 5000, vat: 250, gross: 5250 },
  total: { net: 15000, vat: 2250, gross: 17250 }
}
```

**Report Format** (PDF/Excel):
```
VAT Report - Q1 2024
Company: Acme Corp

Sales (Output VAT):
  Standard Rate (20%): Net £10,000 | VAT £2,000 | Gross £12,000
  Reduced Rate (5%):   Net £5,000  | VAT £250   | Gross £5,250
  Total Sales:         Net £15,000 | VAT £2,250 | Gross £17,250

Purchases (Input VAT):
  Total Purchases:     Net £8,000  | VAT £1,600 | Gross £9,600

VAT Payable: £650 (Output VAT £2,250 - Input VAT £1,600)
```

---

## Summary of Service Interactions

| Flow | Frontend | Backend | AI Service | Database |
|------|----------|---------|------------|----------|
| **Login** | ✓ | ✓ | — | ✓ |
| **Invoice OCR** | ✓ | ✓ | ✓ | ✓ |
| **Transaction Import** | ✓ | ✓ | — | ✓ |
| **Matching** | ✓ | ✓ | ✓ | ✓ |
| **Anomaly Detection** | ✓ | ✓ | ✓ | ✓ |
| **VAT Report** | ✓ | ✓ | — | ✓ |

All flows follow the same pattern:
1. User interaction in Frontend
2. API request to Backend
3. Backend orchestrates business logic
4. Backend calls AI Service when needed
5. Backend queries/updates Database
6. Backend returns response to Frontend
7. Frontend displays results to User
