# Development Guidelines

## Overview

This document defines the development standards, best practices, and rules for building and maintaining the AI-Powered Financial Reconciliation Platform. Following these guidelines ensures code quality, maintainability, and consistency across the team.

---

## Core Principles

### 1. Separation of Concerns

**Keep business logic in backend services**

✅ **DO**:
```javascript
// Backend API - business logic
function approveMatch(matchId, userId) {
  const match = getMatch(matchId);
  if (match.confidence < 0.7) {
    throw new Error('Cannot approve low confidence match');
  }
  match.status = 'approved';
  match.approvedBy = userId;
  match.approvedAt = new Date();
  return saveMatch(match);
}
```

❌ **DON'T**:
```javascript
// Frontend - business logic (WRONG)
function approveMatch(match) {
  // Don't put business rules in frontend
  if (match.confidence < 0.7) {
    alert('Cannot approve');
    return;
  }
  api.post('/matches/approve', { matchId: match.id });
}
```

**Why**: Business logic belongs in the backend where it can be tested, secured, and reused. Frontend only handles presentation and user interaction.

---

### 2. Database for Storage, Not Logic

**Use database for storage and relational integrity, not complex logic**

✅ **DO**:
```javascript
// Backend - matching logic
function findMatches(invoices, transactions) {
  const matches = [];
  for (const invoice of invoices) {
    for (const transaction of transactions) {
      if (isMatch(invoice, transaction)) {
        matches.push({ invoiceId: invoice.id, transactionId: transaction.id });
      }
    }
  }
  return saveBulkMatches(matches);
}
```

❌ **DON'T**:
```sql
-- Database stored procedure (TOO MUCH LOGIC)
CREATE PROCEDURE match_invoices()
BEGIN
  -- Complex matching logic in SQL
  -- This makes testing and debugging difficult
END;
```

**Why**: SQL is great for queries but not for complex business logic. Keep logic in application code where it's easier to test, debug, and maintain.

---

### 3. AI Logic Isolated in Python Service

**Keep AI/ML/OCR logic in the specialized Python service**

✅ **DO**:
```python
# AI Service - OCR and matching logic
@app.post("/ocr/extract")
async def extract_invoice_data(file: UploadFile):
    text = perform_ocr(file)
    data = parse_invoice_fields(text)
    confidence = calculate_confidence(data)
    return {"data": data, "confidence": confidence}
```

❌ **DON'T**:
```javascript
// Backend Node.js - OCR logic (WRONG)
function extractInvoiceData(file) {
  // Don't implement OCR in Node.js
  // Use the Python AI service instead
}
```

**Why**: Python has the best ecosystem for AI/ML. Keep it isolated for easier upgrades and scaling.

---

### 4. Modular Service Design

**Each service has a clear, focused responsibility**

Services should:
- Have a single, well-defined purpose
- Communicate via well-defined APIs
- Be independently deployable
- Not share databases directly (except backend ↔ database)

---

### 5. Clear Separation Between Services

**Services communicate via HTTP APIs, never directly**

✅ **DO**:
```javascript
// Backend calls AI service via HTTP
const ocrResult = await axios.post('http://ai-service:8000/ocr/extract', {
  file_path: filePath
});
```

❌ **DON'T**:
```javascript
// Backend tries to import Python code (IMPOSSIBLE)
import { extract_invoice } from 'ai-service';  // WRONG
```

**Why**: HTTP APIs provide clear contracts and allow services to be developed, deployed, and scaled independently.

---

## Code Organization

### Frontend Structure

```
src/
  components/        # Reusable UI components
    Button.jsx
    DataTable.jsx
    Modal.jsx
  pages/            # Page-level components
    Dashboard.jsx
    InvoiceList.jsx
  services/         # API communication
    api.js
    authService.js
  hooks/            # Custom React hooks
    useAuth.js
    useCompany.js
  utils/            # Helper functions
    formatters.js
    validators.js
  locales/          # Translations
    en/
    he/
    ar/
```

**Guidelines**:
- Components should be small and focused (< 200 lines)
- Extract reusable logic into custom hooks
- Keep API calls in service files, not components
- Use meaningful component and file names

---

### Backend Structure

```
server/
  config/           # Configuration files
    database.js
    env.js
  routes/           # Express route definitions
    auth.js
    invoices.js
  controllers/      # Request handlers
    authController.js
    invoiceController.js
  services/         # Business logic
    matchingService.js
    notificationService.js
  models/           # Database models/schemas
    User.js
    Invoice.js
  middleware/       # Express middleware
    auth.js
    validation.js
    errorHandler.js
  utils/            # Helper functions
    dateUtils.js
    fileUtils.js
```

**Guidelines**:
- Routes define endpoints and call controllers
- Controllers handle HTTP requests/responses
- Services contain reusable business logic
- Models define data schemas and database operations
- Middleware handles cross-cutting concerns

**Example Flow**:
```
Request → Route → Middleware → Controller → Service → Model → Database
```

---

### AI Service Structure

```
ai-service/
  app/
    routers/        # FastAPI routers
      ocr.py
      matching.py
    services/       # AI logic
      ocr_service.py
      matching_service.py
    models/         # Pydantic models
      invoice.py
    utils/          # Helper functions
      pdf_parser.py
  tests/            # Unit tests
  requirements.txt
  main.py
```

---

## Coding Standards

### JavaScript/TypeScript (Frontend & Backend)

**1. Use meaningful variable names**

✅ **DO**:
```javascript
const unmatchedInvoices = invoices.filter(inv => inv.status === 'unmatched');
const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
```

❌ **DON'T**:
```javascript
const x = invoices.filter(i => i.s === 'unmatched');
const t = invoices.reduce((s, i) => s + i.a, 0);
```

**2. Use const/let, never var**

```javascript
const API_URL = 'http://localhost:3000';  // Constants in UPPERCASE
let currentUser = null;  // Variables that change
```

**3. Use async/await instead of callbacks**

✅ **DO**:
```javascript
async function loadInvoices() {
  try {
    const response = await axios.get('/api/invoices');
    return response.data;
  } catch (error) {
    console.error('Failed to load invoices:', error);
    throw error;
  }
}
```

**4. Always handle errors**

```javascript
// Wrap async operations in try/catch
try {
  await riskyOperation();
} catch (error) {
  logError(error);
  showUserFriendlyMessage();
}
```

**5. Use JSDoc for complex functions**

```javascript
/**
 * Calculate VAT amount based on total and rate
 * @param {number} total - Total amount including VAT
 * @param {number} rate - VAT rate (e.g., 0.20 for 20%)
 * @returns {number} VAT amount
 */
function calculateVAT(total, rate) {
  return total * (rate / (1 + rate));
}
```

**6. Validate input data**

```javascript
function createInvoice(data) {
  if (!data.amount || data.amount <= 0) {
    throw new Error('Invalid amount');
  }
  if (!data.vendorName) {
    throw new Error('Vendor name required');
  }
  // ... proceed with creation
}
```

---

### Python (AI Service)

**1. Follow PEP 8 style guide**

```python
# Use snake_case for functions and variables
def extract_invoice_data(file_path):
    invoice_text = read_file(file_path)
    return parse_text(invoice_text)

# Use PascalCase for classes
class InvoiceExtractor:
    def __init__(self, config):
        self.config = config
```

**2. Type hints for clarity**

```python
from typing import Dict, List, Optional

def find_matches(
    invoices: List[Dict],
    transactions: List[Dict],
    threshold: float = 0.85
) -> List[Dict]:
    """Find matches between invoices and transactions."""
    matches = []
    # ... matching logic
    return matches
```

**3. Use docstrings**

```python
def calculate_confidence(match_reasons: List[str]) -> float:
    """
    Calculate confidence score based on match reasons.
    
    Args:
        match_reasons: List of reasons why invoice and transaction match
        
    Returns:
        Confidence score between 0.0 and 1.0
    """
    # ... calculation
    return confidence
```

**4. Handle exceptions properly**

```python
def parse_pdf(file_path: str) -> str:
    try:
        with open(file_path, 'rb') as file:
            return extract_text(file)
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        raise
    except Exception as e:
        logger.error(f"Failed to parse PDF: {e}")
        raise
```

---

## Database Guidelines

### 1. Always Use Parameterized Queries

✅ **DO**:
```javascript
// Parameterized query - safe from SQL injection
const result = await db.query(
  'SELECT * FROM invoices WHERE company_id = $1 AND status = $2',
  [companyId, status]
);
```

❌ **DON'T**:
```javascript
// String concatenation - SQL INJECTION RISK!
const query = `SELECT * FROM invoices WHERE company_id = ${companyId}`;
```

### 2. Always Filter by company_id (Multi-Tenancy)

✅ **DO**:
```javascript
// Always include company_id to prevent data leaks
const invoices = await db.query(
  'SELECT * FROM invoices WHERE company_id = $1',
  [companyId]
);
```

❌ **DON'T**:
```javascript
// Missing company_id - SECURITY RISK!
const invoices = await db.query('SELECT * FROM invoices');
```

### 3. Use Transactions for Multi-Step Operations

```javascript
async function createMatchWithAudit(matchData, userId) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    // Create match
    const match = await client.query(
      'INSERT INTO matches (...) VALUES (...) RETURNING *',
      [...]
    );
    
    // Log audit trail
    await client.query(
      'INSERT INTO audit_logs (...) VALUES (...)',
      [userId, 'create_match', match.id]
    );
    
    await client.query('COMMIT');
    return match;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 4. Add Indexes for Performance

```sql
-- Index frequently queried columns
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- Composite index for common queries
CREATE INDEX idx_invoices_company_date ON invoices(company_id, invoice_date);
```

### 5. Keep Migrations in Version Control

- Use migration tools (e.g., node-pg-migrate, Knex)
- Never modify old migrations (create new ones)
- Test migrations on copy of production data

---

## Security Best Practices

### 1. Authentication & Authorization

**Always validate JWT token**:
```javascript
// Middleware to protect routes
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Check user has access to requested company**:
```javascript
async function checkCompanyAccess(req, res, next) {
  const { companyId } = req.params;
  const hasAccess = await userHasAccessToCompany(req.user.id, companyId);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}
```

### 2. Input Validation

**Validate all user input**:
```javascript
const { body, validationResult } = require('express-validator');

app.post('/invoices', [
  body('amount').isFloat({ min: 0.01 }),
  body('vendorName').trim().notEmpty().isLength({ max: 200 }),
  body('invoiceDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... process valid data
});
```

### 3. Password Security

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash password before storing
async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Verify password during login
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

### 4. File Upload Security

```javascript
// Validate file type and size
const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
const maxSize = 10 * 1024 * 1024; // 10MB

function validateFile(file) {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
}
```

### 5. Environment Variables

**Never commit secrets to Git**:

```javascript
// .env file (NOT in Git)
DB_PASSWORD=secret123
JWT_SECRET=supersecret456

// Use in code
const dbPassword = process.env.DB_PASSWORD;
```

---

## Testing

### 1. Write Tests for Critical Logic

**Backend service tests**:
```javascript
describe('Matching Service', () => {
  test('should match invoice to transaction with exact amount', async () => {
    const invoice = { amount: 1200.00, date: '2024-01-15' };
    const transaction = { amount: 1200.00, date: '2024-01-16' };
    
    const match = findMatch(invoice, transaction);
    
    expect(match.confidence).toBeGreaterThan(0.9);
  });
});
```

**Frontend component tests**:
```javascript
test('renders invoice list', () => {
  render(<InvoiceList invoices={mockInvoices} />);
  expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
});
```

### 2. Test API Endpoints

```javascript
describe('POST /invoices/upload', () => {
  test('should upload invoice successfully', async () => {
    const response = await request(app)
      .post('/api/v1/invoices/upload')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('file', 'test-invoice.pdf')
      .field('companyId', '1');
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

---

## Git Workflow

### 1. Branch Naming

```
feature/invoice-upload
bugfix/matching-confidence
hotfix/security-patch
```

### 2. Commit Messages

Use clear, descriptive commit messages:

```
✅ Good:
- Add invoice upload endpoint with OCR integration
- Fix matching confidence calculation for edge cases
- Update VAT calculation to handle multiple rates

❌ Bad:
- fix bug
- update code
- changes
```

### 3. Pull Request Guidelines

- Create small, focused PRs (< 500 lines if possible)
- Write clear PR descriptions
- Request reviews from team members
- Ensure all tests pass before merging

---

## Error Handling

### Backend Error Response Format

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}
```

### Frontend Error Handling

```javascript
async function loadData() {
  try {
    const data = await api.get('/invoices');
    setState({ data, error: null });
  } catch (error) {
    if (error.response?.status === 401) {
      // Redirect to login
      navigate('/login');
    } else {
      // Show error message
      setState({ error: error.message, data: null });
    }
  }
}
```

---

## Performance Optimization

### 1. Database Query Optimization

- Use indexes for frequently queried columns
- Limit results with LIMIT
- Avoid SELECT * (specify needed columns)
- Use database connection pooling

### 2. API Response Optimization

- Implement pagination for large datasets
- Return only necessary fields
- Use compression (gzip)

### 3. Frontend Optimization

- Lazy load routes and components
- Memoize expensive calculations with useMemo
- Debounce search inputs
- Optimize images and assets

---

## Documentation

### 1. Code Comments

Write comments for **why**, not **what**:

```javascript
// ✅ Good - explains why
// Use fuzzy matching because vendor names vary (Ltd, Limited, Inc)
const similarity = fuzzyMatch(invoice.vendor, transaction.description);

// ❌ Bad - obvious from code
// Calculate similarity
const similarity = fuzzyMatch(invoice.vendor, transaction.description);
```

### 2. API Documentation

Document all endpoints with:
- Purpose
- Request format
- Response format
- Error codes
- Example usage

### 3. README Files

Each service should have README with:
- Setup instructions
- Environment variables needed
- How to run locally
- How to run tests

---

## Summary Checklist

Before committing code, ensure:

- ✅ Business logic is in backend, not frontend
- ✅ Database queries use parameterized values
- ✅ All queries filtered by company_id (multi-tenancy)
- ✅ User input is validated
- ✅ Errors are handled gracefully
- ✅ Secrets are in environment variables, not code
- ✅ Code follows naming conventions
- ✅ Tests pass (if tests exist)
- ✅ No console.log statements left in production code
- ✅ Code is readable and well-commented

---

## Resources

- Express.js Best Practices: https://expressjs.com/en/advanced/best-practice-security.html
- React Best Practices: https://react.dev/learn
- PostgreSQL Performance Tips: https://wiki.postgresql.org/wiki/Performance_Optimization
- OWASP Security Guidelines: https://owasp.org/
