# API Structure

## Overview

This document defines the structure of the backend REST API, including endpoint organization, naming conventions, request/response formats, and authentication requirements.

---

## API Design Principles

**1. RESTful Design**
- Use HTTP verbs correctly (GET, POST, PUT, PATCH, DELETE)
- Resources represented by nouns, not verbs
- Stateless requests (all context in request or JWT)

**2. Consistent Naming**
- Use plural nouns for collections: `/invoices`, `/transactions`
- Use kebab-case for URLs: `/bank-accounts`
- Use camelCase for JSON properties

**3. Versioning**
- All endpoints prefixed with version: `/api/v1/`
- Allows future breaking changes without breaking old clients

**4. Standard Response Format**
- Success: Return data directly or in `data` wrapper
- Error: Return consistent error format

**5. Authentication**
- All endpoints except `/auth/*` require JWT token
- Token in `Authorization: Bearer <token>` header

---

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://yourdomain.com/api/v1
```

---

## API Modules

### 1. Authentication & Authorization (`/auth`)

**Purpose**: Handle user authentication, registration, and session management

#### Endpoints

##### POST `/auth/register`
**Description**: Register a new user account

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "BUSINESS_OWNER",
  "companyName": "Acme Corp"
}
```

**Response** (201 Created):
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "BUSINESS_OWNER"
  }
}
```

**Errors**: 400 (validation), 409 (email exists)

---

##### POST `/auth/login`
**Description**: Authenticate user and receive JWT token

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "BUSINESS_OWNER"
  },
  "companies": [
    {
      "id": "1",
      "name": "Acme Corp",
      "role": "owner"
    }
  ]
}
```

**Errors**: 401 (invalid credentials), 403 (account disabled)

---

##### POST `/auth/logout`
**Description**: Invalidate current session

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

##### POST `/auth/forgot-password`
**Description**: Request password reset email

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

---

##### POST `/auth/reset-password`
**Description**: Reset password using token from email

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword123!"
}
```

---

### 2. Users (`/users`)

**Purpose**: Manage user accounts and profiles

#### Endpoints

##### GET `/users/me`
**Description**: Get current user's profile

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "BUSINESS_OWNER",
  "emailVerified": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

##### PATCH `/users/me`
**Description**: Update current user's profile

**Authentication**: Required

**Request Body**:
```json
{
  "name": "John Smith",
  "notificationPreferences": {
    "emailNotifications": true,
    "matchNotifications": true
  }
}
```

---

##### POST `/users/change-password`
**Description**: Change user's password

**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

---

### 3. Companies (`/companies`)

**Purpose**: Manage business entities

#### Endpoints

##### GET `/companies`
**Description**: Get all companies user has access to

**Authentication**: Required

**Response** (200 OK):
```json
{
  "companies": [
    {
      "id": "1",
      "name": "Acme Corp",
      "role": "owner",
      "vatNumber": "GB123456789",
      "active": true
    },
    {
      "id": "2",
      "name": "Client Business Ltd",
      "role": "accountant",
      "vatNumber": "GB987654321",
      "active": true
    }
  ]
}
```

---

##### POST `/companies`
**Description**: Create a new company (business owners only)

**Authentication**: Required (BUSINESS_OWNER)

**Request Body**:
```json
{
  "name": "New Business Ltd",
  "vatNumber": "GB111222333",
  "address": "123 Main St, London",
  "registrationNumber": "12345678"
}
```

---

##### GET `/companies/:id`
**Description**: Get specific company details

**Authentication**: Required (must have access)

**Response** (200 OK):
```json
{
  "id": "1",
  "name": "Acme Corp",
  "vatNumber": "GB123456789",
  "address": "123 Main St, London",
  "owner": {
    "id": "123",
    "name": "John Doe",
    "email": "john@acme.com"
  },
  "accountants": [
    {
      "id": "456",
      "name": "Jane Accountant",
      "email": "jane@accounting.com",
      "grantedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "settings": {
    "matchingThreshold": 0.85,
    "autoApproveThreshold": 0.95
  }
}
```

---

##### PATCH `/companies/:id`
**Description**: Update company details

**Authentication**: Required (owner or admin)

---

##### POST `/companies/:id/grant-access`
**Description**: Grant accountant access to company

**Authentication**: Required (owner or admin)

**Request Body**:
```json
{
  "accountantEmail": "accountant@example.com",
  "permissions": ["view", "edit", "approve_matches"]
}
```

---

##### POST `/companies/:id/revoke-access`
**Description**: Revoke accountant access

**Request Body**:
```json
{
  "accountantId": "456"
}
```

---

### 4. Invoices (`/invoices`)

**Purpose**: Manage invoice uploads and data

#### Endpoints

##### GET `/invoices`
**Description**: Get invoices for a company

**Authentication**: Required

**Query Parameters**:
- `companyId` (required): Company ID
- `status` (optional): filter by status (processing, ready, matched)
- `page` (optional): page number (default: 1)
- `limit` (optional): items per page (default: 20)
- `startDate`, `endDate` (optional): date range filter

**Response** (200 OK):
```json
{
  "invoices": [
    {
      "id": "inv_123",
      "invoiceNumber": "INV-2024-001",
      "vendorName": "ABC Suppliers Ltd",
      "invoiceDate": "2024-01-15",
      "totalAmount": 1200.00,
      "vatAmount": 204.00,
      "currency": "GBP",
      "status": "ready",
      "uploadedBy": "John Doe",
      "uploadedAt": "2024-01-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

##### POST `/invoices/upload`
**Description**: Upload and process an invoice

**Authentication**: Required

**Request**: multipart/form-data
- `file`: Invoice file (PDF, PNG, JPG)
- `companyId`: Company ID

**Response** (201 Created):
```json
{
  "id": "inv_123",
  "status": "processing",
  "message": "Invoice uploaded successfully. Processing OCR..."
}
```

---

##### GET `/invoices/:id`
**Description**: Get specific invoice details

**Response** (200 OK):
```json
{
  "id": "inv_123",
  "invoiceNumber": "INV-2024-001",
  "vendorName": "ABC Suppliers Ltd",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "totalAmount": 1200.00,
  "vatAmount": 204.00,
  "vatRate": 0.20,
  "currency": "GBP",
  "reference": "PO-456",
  "lineItems": [...],
  "ocrData": {
    "confidence": {
      "vendorName": 0.95,
      "totalAmount": 0.98
    }
  },
  "status": "ready",
  "filePath": "/uploads/invoice_123.pdf",
  "matchStatus": "unmatched"
}
```

---

##### PATCH `/invoices/:id`
**Description**: Update invoice data (manually correct OCR results)

**Request Body**:
```json
{
  "vendorName": "ABC Suppliers Limited",
  "totalAmount": 1200.00,
  "invoiceDate": "2024-01-15"
}
```

---

##### DELETE `/invoices/:id`
**Description**: Delete an invoice

**Response** (200 OK):
```json
{
  "message": "Invoice deleted successfully"
}
```

---

### 5. Transactions (`/transactions`)

**Purpose**: Manage bank transactions

#### Endpoints

##### GET `/transactions`
**Description**: Get transactions for a bank account

**Query Parameters**:
- `companyId` (required)
- `bankAccountId` (optional)
- `status` (optional): unmatched, matched, excluded
- `startDate`, `endDate` (optional)
- `page`, `limit`

**Response** (200 OK):
```json
{
  "transactions": [
    {
      "id": "txn_456",
      "date": "2024-01-16",
      "description": "ABC Suppliers Ltd",
      "amount": 1200.00,
      "reference": "INV-2024-001",
      "bankAccount": "Main Checking",
      "status": "unmatched"
    }
  ],
  "pagination": {...}
}
```

---

##### POST `/transactions/import`
**Description**: Import transactions from bank statement

**Request**: multipart/form-data
- `file`: CSV or Excel file
- `bankAccountId`: Bank account ID
- `format` (optional): bank format type for parsing

**Response** (200 OK):
```json
{
  "message": "Import successful",
  "imported": 25,
  "duplicates": 3,
  "errors": 0
}
```

---

##### GET `/transactions/:id`
**Description**: Get specific transaction details

---

##### DELETE `/transactions/:id`
**Description**: Delete a transaction

---

### 6. Matching (`/matching`)

**Purpose**: Handle invoice-transaction matching

#### Endpoints

##### POST `/matching/auto-match`
**Description**: Run automatic matching algorithm

**Request Body**:
```json
{
  "companyId": "1",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "autoApprove": true
}
```

**Response** (200 OK):
```json
{
  "message": "Matching complete",
  "results": {
    "totalInvoices": 50,
    "totalTransactions": 48,
    "matchesFound": 42,
    "autoApproved": 38,
    "pendingReview": 4
  },
  "matches": [
    {
      "id": "match_789",
      "invoice": {...},
      "transaction": {...},
      "confidence": 0.97,
      "status": "approved"
    }
  ]
}
```

---

##### GET `/matching/matches`
**Description**: Get all matches for a company

**Query Parameters**:
- `companyId` (required)
- `status` (optional): pending, approved, rejected
- `page`, `limit`

---

##### POST `/matching/manual-match`
**Description**: Manually match invoice to transaction(s)

**Request Body**:
```json
{
  "invoiceId": "inv_123",
  "transactionIds": ["txn_456"],
  "matchType": "full"
}
```

---

##### PATCH `/matching/:matchId/approve`
**Description**: Approve a pending match

---

##### PATCH `/matching/:matchId/reject`
**Description**: Reject a match

**Request Body**:
```json
{
  "reason": "Amounts don't match correctly"
}
```

---

##### DELETE `/matching/:matchId`
**Description**: Delete/unmatch a match

---

### 7. Anomalies (`/anomalies`)

**Purpose**: Manage detected anomalies and alerts

#### Endpoints

##### GET `/anomalies`
**Description**: Get anomalies for a company

**Query Parameters**:
- `companyId` (required)
- `status` (optional): open, investigating, resolved, false_positive
- `severity` (optional): low, medium, high, critical
- `page`, `limit`

**Response** (200 OK):
```json
{
  "anomalies": [
    {
      "id": "anom_101",
      "type": "duplicate_invoice",
      "severity": "high",
      "description": "Invoice number INV-2024-001 appears twice",
      "status": "open",
      "detectedAt": "2024-01-17T08:00:00Z",
      "relatedInvoices": ["inv_123", "inv_124"]
    }
  ],
  "summary": {
    "total": 5,
    "open": 3,
    "resolved": 2
  }
}
```

---

##### GET `/anomalies/:id`
**Description**: Get anomaly details

---

##### PATCH `/anomalies/:id/resolve`
**Description**: Mark anomaly as resolved

**Request Body**:
```json
{
  "resolution": "Deleted duplicate invoice",
  "status": "resolved"
}
```

---

##### PATCH `/anomalies/:id/mark-false-positive`
**Description**: Mark as false positive

---

### 8. Reports (`/reports`)

**Purpose**: Generate and retrieve reports

#### Endpoints

##### POST `/reports/vat`
**Description**: Generate VAT report

**Request Body**:
```json
{
  "companyId": "1",
  "period": {
    "start": "2024-01-01",
    "end": "2024-03-31"
  },
  "format": "pdf"
}
```

**Response** (200 OK):
```json
{
  "reportId": "report_202",
  "status": "ready",
  "downloadUrl": "/api/v1/reports/report_202/download",
  "summary": {
    "totalSales": 15000.00,
    "totalVAT": 2250.00,
    "vatPayable": 650.00
  }
}
```

---

##### GET `/reports`
**Description**: Get all reports for a company

---

##### GET `/reports/:id`
**Description**: Get report metadata

---

##### GET `/reports/:id/download`
**Description**: Download report file

**Response**: PDF or Excel file

---

##### POST `/reports/reconciliation`
**Description**: Generate reconciliation report

---

##### POST `/reports/audit`
**Description**: Generate audit trail report

---

### 9. Notifications (`/notifications`)

**Purpose**: Manage user notifications

#### Endpoints

##### GET `/notifications`
**Description**: Get user's notifications

**Query Parameters**:
- `unreadOnly` (optional): true/false
- `page`, `limit`

**Response** (200 OK):
```json
{
  "notifications": [
    {
      "id": "notif_301",
      "type": "match_found",
      "title": "New match found",
      "message": "Invoice INV-2024-001 matched with transaction",
      "read": false,
      "createdAt": "2024-01-17T09:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

---

##### PATCH `/notifications/:id/mark-read`
**Description**: Mark notification as read

---

##### POST `/notifications/mark-all-read`
**Description**: Mark all notifications as read

---

### 10. Admin (`/admin`)

**Purpose**: Administrative functions (admins only)

#### Endpoints

##### GET `/admin/users`
**Description**: Get all users

**Authentication**: Required (ADMIN only)

---

##### GET `/admin/system-stats`
**Description**: Get system statistics

**Response** (200 OK):
```json
{
  "users": {
    "total": 150,
    "active": 142,
    "businessOwners": 100,
    "accountants": 40,
    "admins": 10
  },
  "companies": {
    "total": 100,
    "active": 95
  },
  "invoices": {
    "total": 5000,
    "thisMonth": 450
  },
  "matches": {
    "total": 4500,
    "accuracy": 0.96
  }
}
```

---

##### GET `/admin/audit-logs`
**Description**: Get audit logs

**Query Parameters**:
- `userId` (optional)
- `companyId` (optional)
- `action` (optional)
- `startDate`, `endDate`
- `page`, `limit`

---

---

## Standard Error Response Format

All errors return consistent JSON format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input (400)
- `UNAUTHORIZED` - Not logged in (401)
- `FORBIDDEN` - No permission (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists (409)
- `INTERNAL_ERROR` - Server error (500)

---

## Authentication

All endpoints except `/auth/*` require JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Payload

```json
{
  "userId": "123",
  "email": "user@example.com",
  "role": "BUSINESS_OWNER",
  "iat": 1705414800,
  "exp": 1705501200
}
```

---

## Rate Limiting

- Anonymous endpoints: 100 requests/hour per IP
- Authenticated endpoints: 1000 requests/hour per user
- File uploads: 50 requests/hour per user

Exceeded limits return **429 Too Many Requests**

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## API Endpoint Summary

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `/auth` | 5 | Authentication and registration |
| `/users` | 3 | User profile management |
| `/companies` | 6 | Company management |
| `/invoices` | 5 | Invoice upload and management |
| `/transactions` | 4 | Transaction import and management |
| `/matching` | 6 | Matching operations |
| `/anomalies` | 4 | Anomaly management |
| `/reports` | 6 | Report generation |
| `/notifications` | 3 | Notification management |
| `/admin` | 3 | Admin operations |

**Total**: ~45 endpoints (expandable as needed)

---

## Future Considerations

- GraphQL API for complex queries
- WebSocket for real-time notifications
- Bulk operations endpoints
- Export/import endpoints
- Webhook support for integrations
