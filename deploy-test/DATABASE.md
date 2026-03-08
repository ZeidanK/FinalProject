# Database Schema Overview

This document describes the minimal PostgreSQL database schema for the deploy-test project.

## Purpose

This is a **basic scaffold** to test database integration in the deployment stack. It includes just enough tables to demonstrate:
- Relational database connectivity
- Data persistence across container restarts
- Foreign key relationships
- Basic CRUD operations

## Database Configuration

- **Database Name**: `deploytest`
- **User**: `deployuser`
- **Password**: `deploypass` (⚠️ CHANGE IN PRODUCTION!)
- **Port**: `5432`
- **Version**: PostgreSQL 15 Alpine

## Schema

### Tables

#### 1. `users`
Stores basic user information.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `username`: Unique username
- `email`: Unique email address
- `created_at`: Timestamp of user creation

**Test Data:**
- One test user is created: `testuser` / `test@example.com`

---

#### 2. `invoices`
Stores metadata about uploaded invoice files.

```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    extracted_text TEXT,
    processing_time INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `filename`: Original filename of uploaded document
- `file_size`: File size in bytes
- `mime_type`: MIME type (e.g., `application/pdf`, `image/png`)
- `extracted_text`: OCR-extracted text content
- `processing_time`: Time taken to process in milliseconds
- `uploaded_by`: Foreign key to `users.id`
- `created_at`: Timestamp of upload

**Indexed:**
- `created_at DESC` for fast recent invoice queries

---

#### 3. `transactions`
Stores financial transactions related to invoices (for testing relationships).

```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2),
    description VARCHAR(500),
    transaction_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `invoice_id`: Foreign key to `invoices.id` (cascading delete)
- `amount`: Transaction amount (supports 2 decimal places)
- `description`: Transaction description
- `transaction_date`: Date of the transaction
- `created_at`: Timestamp of record creation

**Indexed:**
- `invoice_id` for fast lookups by invoice

---

## Relationships

```
users (1) ──────▶ (N) invoices
                      │
                      │
                      │ (1)
                      │
                      ▼
                      (N) transactions
```

- One user can have many invoices
- One invoice can have many transactions
- Deleting an invoice cascades to delete its transactions

## API Endpoints

The backend provides these database-backed endpoints:

### GET `/api/invoices`
Fetch all invoices (limited to 50 most recent).

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": 1,
      "filename": "invoice.pdf",
      "file_size": 123456,
      "mime_type": "application/pdf",
      "processing_time": 1234,
      "created_at": "2026-03-08T12:00:00Z"
    }
  ]
}
```

### GET `/api/invoices/:id`
Fetch a specific invoice by ID.

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": 1,
    "filename": "invoice.pdf",
    "file_size": 123456,
    "mime_type": "application/pdf",
    "extracted_text": "Invoice content...",
    "processing_time": 1234,
    "uploaded_by": 1,
    "created_at": "2026-03-08T12:00:00Z"
  }
}
```

### POST `/api/upload`
Upload a file for OCR processing and save to database.

**Request:** multipart/form-data with `file` field

**Response:**
```json
{
  "success": true,
  "invoiceId": 123,
  "filename": "invoice.pdf",
  "processingTime": 1234,
  "extractedText": "Invoice content...",
  "metadata": { ... }
}
```

## Testing Database Connection

### From Host Machine

```bash
# Using psql
psql -h localhost -p 5432 -U deployuser -d deploytest

# List tables
\dt

# Query invoices
SELECT * FROM invoices;
```

### From Docker Container

```bash
# Access PostgreSQL container
docker-compose exec postgres psql -U deployuser -d deploytest

# Run queries
SELECT COUNT(*) FROM invoices;
```

### Using Backend Health Check

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "service": "backend",
  "database": "connected",
  "timestamp": "2026-03-08T12:00:00.000Z"
}
```

## Data Persistence

The PostgreSQL data is stored in a Docker volume named `postgres-data`. This means:

✅ **Data persists** when containers are stopped/restarted
✅ **Data persists** when running `docker-compose down` and `docker-compose up`
❌ **Data is deleted** when running `docker-compose down -v` (volumes flag)

To completely reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

## Production Considerations

This schema is **intentionally minimal** for testing. For production, you would add:

1. **Authentication & Authorization**
   - Password hashing for users
   - API keys or JWT tokens
   - Role-based access control

2. **More Tables**
   - Companies/Organizations
   - Bank accounts
   - Matches (invoice-transaction matching)
   - Anomalies
   - Audit logs

3. **Security**
   - Change default password
   - Use secrets management
   - SSL/TLS for database connections
   - Principle of least privilege

4. **Performance**
   - More indexes on frequently queried columns
   - Partitioning for large tables
   - Connection pooling (already implemented in backend)

5. **Backup & Recovery**
   - Automated backups
   - Point-in-time recovery
   - Replication for high availability

See the main `/docs` folder for the complete production database design.

## Troubleshooting

### Database connection refused
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify health check
docker-compose exec postgres pg_isready -U deployuser -d deploytest
```

### Tables not created
```bash
# Check init script was executed
docker-compose logs postgres | grep init.sql

# Manually run init script
docker-compose exec postgres psql -U deployuser -d deploytest -f /docker-entrypoint-initdb.d/init.sql
```

### Permission denied errors
```bash
# Grant permissions manually
docker-compose exec postgres psql -U deployuser -d deploytest
# Then run:
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deployuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deployuser;
```
