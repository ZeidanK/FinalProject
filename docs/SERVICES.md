# Services

## Overview

This document defines the responsibilities and boundaries of each service in the system. Following these guidelines ensures clean separation of concerns, maintainability, and scalability.

---

## Service Responsibilities

### Frontend Service (React)

**Primary Responsibility**: User interface and user experience

#### What the Frontend SHOULD Do:

**1. User Interface**
- Render all UI components (forms, tables, dashboards, charts)
- Handle user interactions (clicks, form submissions, navigation)
- Provide responsive design for mobile, tablet, and desktop
- Support RTL/LTR for multiple languages
- Display loading states and error messages

**2. Client-Side Validation**
- Validate form inputs before submission (email format, required fields)
- Provide immediate feedback to users
- Prevent invalid data from being sent to backend

**3. State Management**
- Manage UI state (open/closed modals, selected tabs)
- Store user session (JWT token, user profile)
- Track currently selected business/company
- Cache frequently accessed data (user preferences, company list)

**4. API Communication**
- Make HTTP requests to backend API
- Handle authentication (send JWT tokens)
- Process API responses and display data
- Handle errors gracefully (network errors, API errors)
- Retry failed requests when appropriate

**5. File Handling**
- Upload files to backend (invoices, bank statements)
- Download generated reports
- Preview documents before upload
- Validate file types and sizes before upload

**6. Routing**
- Client-side navigation between pages
- Protect routes based on user role
- Handle deep linking and browser history

#### What the Frontend SHOULD NOT Do:

❌ **Business Logic**
- Don't calculate VAT amounts or matching scores
- Don't perform reconciliation logic
- Don't implement security decisions (rely on backend)

❌ **Data Storage**
- Don't store sensitive data in localStorage
- Don't maintain authoritative data (backend is source of truth)
- Don't cache data that could become stale

❌ **Direct Database Access**
- Never connect directly to the database
- Always go through backend API

❌ **OCR or AI Processing**
- Don't attempt OCR in browser
- Don't implement matching algorithms

❌ **Authorization Decisions**
- Don't decide what user can access (backend controls this)
- Don't trust client-side role checks (can be manipulated)

---

### Backend API Service (Node.js + Express)

**Primary Responsibility**: Business logic, orchestration, and data management

#### What the Backend SHOULD Do:

**1. Authentication & Authorization**
- Verify user credentials (login)
- Generate and validate JWT tokens
- Check user permissions for every request
- Enforce role-based access control
- Session management

**2. Business Logic**
- Implement all business rules
- Calculate VAT amounts
- Validate invoice and transaction data
- Determine matching eligibility
- Apply matching thresholds and rules
- Generate notifications based on events

**3. Data Management**
- Create, read, update, delete database records
- Validate data before saving
- Ensure data integrity (check for duplicates, validate references)
- Manage transactions (database ACID)
- Handle data migrations

**4. Orchestration**
- Coordinate between AI service and database
- Call AI service for OCR and matching
- Process AI service responses
- Handle multi-step workflows

**5. API Design**
- Expose RESTful endpoints
- Return consistent JSON responses
- Provide clear error messages
- Use appropriate HTTP status codes
- Handle pagination for large datasets

**6. File Management**
- Receive uploaded files
- Validate file types and sizes
- Store files securely
- Generate file URLs for download
- Clean up old files

**7. Report Generation**
- Query database for report data
- Calculate report metrics
- Generate PDF or Excel files
- Store report metadata

**8. Anomaly Detection Coordination**
- Schedule periodic anomaly checks
- Call AI service for pattern detection
- Create anomaly records
- Generate alert notifications

**9. Audit Logging**
- Log all critical actions
- Record who did what and when
- Track data changes (old vs new values)

#### What the Backend SHOULD NOT Do:

❌ **OCR Processing**
- Don't implement OCR logic (delegate to AI service)
- Don't parse PDF/image files directly

❌ **Complex AI Algorithms**
- Don't implement matching algorithms (delegate to AI service)
- Don't implement machine learning models

❌ **Frontend Rendering**
- Don't render HTML (return JSON only)
- Don't serve static assets (Nginx handles this)

❌ **Heavy Computation**
- Don't perform resource-intensive calculations
- Delegate to appropriate service if needed

---

### AI/OCR Service (Python + FastAPI)

**Primary Responsibility**: AI-powered functionality (OCR, matching, anomaly detection)

#### What the AI Service SHOULD Do:

**1. Invoice OCR**
- Extract text from PDF files
- Extract text from image files (PNG, JPG)
- Parse structured data (amounts, dates, vendor names)
- Identify invoice fields (invoice number, VAT, total)
- Return confidence scores for each extraction

**2. Data Extraction**
- Extract dates in various formats
- Parse monetary amounts
- Identify vendor/supplier names
- Detect currency symbols
- Extract VAT/tax information

**3. Intelligent Matching**
- Compare invoices to transactions
- Calculate similarity scores
- Match based on multiple criteria:
  - Amount matching (exact or within threshold)
  - Date proximity
  - Vendor name similarity (fuzzy matching)
  - Reference number matching
- Return confidence scores for matches
- Suggest multiple match candidates

**4. Anomaly Detection**
- Detect duplicate invoice patterns
- Identify amount mismatches
- Find suspicious patterns
- Detect unusual transaction timing
- Flag round-number anomalies
- Identify outliers in transaction data

**5. Pattern Recognition**
- Learn from approved matches (future ML enhancement)
- Recognize vendor name variations
- Detect common description patterns

#### What the AI Service SHOULD NOT Do:

❌ **Data Persistence**
- Don't store invoices or transactions
- Don't maintain state between requests
- Don't access the database directly

❌ **Business Rules**
- Don't decide which matches to auto-approve (backend decides)
- Don't generate notifications
- Don't enforce user permissions

❌ **User Management**
- Don't authenticate users
- Don't manage sessions
- Trust the backend to only send authorized requests

❌ **Report Generation**
- Don't generate VAT reports
- Don't create PDF/Excel files

❌ **File Storage**
- Don't permanently store uploaded files
- Process files in memory or temp storage
- Let backend handle file persistence

**Design Philosophy**: The AI service should be stateless, focused purely on data processing and returning results. It trusts the backend to make business decisions based on its output.

---

### Database Service (PostgreSQL)

**Primary Responsibility**: Persistent data storage and relational integrity

#### What the Database SHOULD Do:

**1. Data Storage**
- Store all application data permanently
- Organize data in normalized tables
- Maintain data integrity with constraints

**2. Referential Integrity**
- Enforce foreign key relationships
- Ensure orphaned records don't exist
- Cascade deletes where appropriate

**3. Data Validation**
- Enforce NOT NULL constraints
- Check constraints for valid values
- Unique constraints to prevent duplicates

**4. Query Execution**
- Execute SELECT queries efficiently
- Use indexes for fast lookups
- Optimize JOIN operations

**5. Transactions**
- Provide ACID guarantees
- Handle concurrent operations safely
- Roll back failed transactions

**6. Data Aggregation**
- SUM, COUNT, AVG for reports
- GROUP BY for aggregations
- Window functions for analytics

#### What the Database SHOULD NOT Do:

❌ **Business Logic**
- Don't implement complex business rules in stored procedures
- Don't make business decisions in triggers
- Keep logic in the backend service

❌ **External Communication**
- Don't call external APIs
- Don't send emails
- Don't access file systems (except for data)

❌ **Complex Calculations**
- Don't implement matching algorithms in SQL
- Don't perform OCR or AI processing
- Keep complex logic in application layer

**Design Philosophy**: The database should be a reliable storage layer with constraints for data integrity, but complex logic belongs in the application layer for maintainability and testability.

---

## Service Communication Rules

### 1. Frontend ↔ Backend

**Protocol**: HTTP/HTTPS REST API

**Data Format**: JSON

**Authentication**: JWT token in Authorization header

**Frontend responsibilities**:
- Always send authentication token
- Handle all HTTP status codes appropriately
- Display backend error messages to users
- Retry failed requests with exponential backoff

**Backend responsibilities**:
- Validate every request
- Return consistent response format
- Use appropriate HTTP status codes
- Never trust client data

### 2. Backend ↔ AI Service

**Protocol**: HTTP REST API

**Data Format**: JSON

**Authentication**: API key or service token (internal only)

**Backend responsibilities**:
- Send complete data for processing
- Handle AI service failures gracefully
- Validate AI service responses
- Don't blindly trust AI results (validate confidence scores)

**AI Service responsibilities**:
- Return results within reasonable time
- Include confidence scores
- Return error messages for invalid inputs
- Be stateless (no session)

### 3. Backend ↔ Database

**Protocol**: Direct database connection (pg library)

**Data Format**: SQL queries with parameterized values

**Backend responsibilities**:
- Use connection pooling
- Always use parameterized queries (prevent SQL injection)
- Handle connection failures and retries
- Close connections properly

**Database responsibilities**:
- Enforce constraints
- Return errors for invalid queries
- Handle concurrent connections

---

## Cross-Cutting Concerns

### Logging

**Frontend**:
- Log errors to console (development)
- Send critical errors to backend error tracking service (production)

**Backend**:
- Log all API requests (timestamp, user, endpoint, status)
- Log errors with stack traces
- Log database queries in debug mode
- Use structured logging (JSON format)

**AI Service**:
- Log processing times
- Log errors and failures
- Log confidence scores (for analysis)

**Database**:
- PostgreSQL slow query log
- Log failed connections

### Error Handling

**Frontend**:
- Display user-friendly error messages
- Show retry options for network errors
- Log details for debugging

**Backend**:
- Catch all errors and return consistent error format
- Don't expose internal errors to client
- Log full error details internally
- Return appropriate HTTP status codes:
  - 400: Bad request (validation error)
  - 401: Unauthorized (not logged in)
  - 403: Forbidden (no permission)
  - 404: Not found
  - 500: Internal server error

**AI Service**:
- Return error responses for invalid inputs
- Timeout for long-running operations
- Return partial results if processing fails partway

### Security

**Frontend**:
- Validate user input
- Don't store sensitive data
- Use HTTPS only
- Implement CSRF protection

**Backend**:
- Validate and sanitize all inputs
- Use parameterized queries
- Hash passwords with bcrypt
- Rate limit API requests
- Implement CORS properly
- Check authorization for every request

**AI Service**:
- Accept requests only from backend (not public)
- Validate file uploads
- Timeout after reasonable duration
- Clean up temporary files

**Database**:
- Use read-only users for reporting
- Encrypt connections (SSL)
- Regular backups
- Encrypt sensitive data at rest

---

## Scaling Considerations

### Frontend
- Can be served from CDN
- Static files cached by browser
- Easy to horizontally scale (multiple servers)

### Backend
- Stateless design allows horizontal scaling
- Add more containers behind load balancer
- Session stored in JWT (no shared session store needed)

### AI Service
- Most resource-intensive service
- Can run multiple instances for parallel OCR
- Consider GPU acceleration for ML models (future)

### Database
- Vertical scaling (increase CPU/RAM)
- Read replicas for reporting queries
- Connection pooling to handle more requests
- Partitioning for very large tables (future)

---

## Service Independence

### Guidelines for Maintainability

1. **Each service should be deployable independently**
   - Frontend changes don't require backend redeployment
   - Backend changes don't require AI service update (unless API changes)

2. **Services communicate via well-defined APIs**
   - Document all endpoints (OpenAPI/Swagger)
   - Version APIs (e.g., /api/v1/)
   - Maintain backward compatibility

3. **Each service has its own dependencies**
   - Frontend: package.json for React dependencies
   - Backend: package.json for Node dependencies
   - AI Service: requirements.txt for Python dependencies

4. **Services can be tested independently**
   - Frontend: Mock backend API
   - Backend: Mock AI service responses
   - AI Service: Unit tests for algorithms

5. **Failures should be isolated**
   - If AI service is down, backend can queue requests
   - If backend is down, frontend shows error (doesn't crash)
   - Database failures trigger backend error handling

---

## Summary Table

| Service | Should Do | Should Not Do |
|---------|-----------|---------------|
| **Frontend** | UI/UX, client validation, API calls, routing | Business logic, direct DB access, OCR, authorization |
| **Backend** | Business logic, auth, orchestration, DB operations | OCR processing, complex AI, frontend rendering |
| **AI Service** | OCR, matching algorithms, anomaly detection | Data persistence, business rules, user management |
| **Database** | Data storage, integrity, queries | Business logic, external communication, complex calculations |

Following these service boundaries ensures that each component has a clear, focused responsibility, making the system easier to develop, test, maintain, and scale.
