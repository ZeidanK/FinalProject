# Backend Server Documentation

## Overview

Node.js/Express backend server connected to SQL Server database for the FinalProject application.

## Project Structure

```
server/
├── index.js                 # Main server entry point
├── config/
│   └── database.js         # SQL Server connection configuration
└── routes/
    ├── users.js            # User management endpoints
    ├── companies.js        # Company management endpoints
    ├── invoices.js         # Invoice CRUD and processing
    ├── transactions.js     # Transaction management and bulk import
    ├── matches.js          # Invoice-transaction matching
    ├── anomalies.js        # Anomaly detection and resolution
    └── reports.js          # Reports and dashboard statistics
```

## Dependencies

- **express** (^4.21.2) - Web framework
- **mssql** (^10.0.4) - SQL Server client
- **cors** (^2.8.5) - Cross-origin resource sharing
- **dotenv** (^16.4.7) - Environment variable management
- **concurrently** (^9.1.2) - Run multiple npm scripts

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=3000
NODE_ENV=development

# SQL Server
DB_SERVER=localhost
DB_DATABASE=FP
DB_TRUSTED_CONNECTION=true  # Windows Authentication

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Database Setup

Before starting the server, ensure:

1. SQL Server is installed and running
2. Database `FP` has been created
3. Schema from `randTest/our_sqlserver.sql` has been executed
4. (Optional) CHECK constraints from `randTest/add_check_constraints.sql` have been added

## Running the Server

### Development (Full Stack)
```bash
npm run dev
```
Runs both backend (port 3000) and frontend (port 5173) concurrently.

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run client
```

## API Endpoints

### Health Check
- `GET /api/health` - Server and database connection status

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Companies
- `GET /api/companies` - List all active companies
- `GET /api/companies/:id` - Get company by ID
- `GET /api/companies/user/:userId` - Get companies for a user (multi-tenant)
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company

### Invoices
- `GET /api/invoices/company/:companyId` - List invoices for company (with filters)
- `GET /api/invoices/:id` - Get invoice with line items
- `POST /api/invoices` - Create invoice with line items
- `PUT /api/invoices/:id/status` - Update invoice status

Query parameters for listing:
- `status` - Filter by status (uploaded, processing, matched, etc.)
- `startDate` - Filter by date range start
- `endDate` - Filter by date range end

### Transactions
- `GET /api/transactions/company/:companyId` - List transactions for company
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create single transaction
- `POST /api/transactions/bulk` - Bulk import transactions

Query parameters for listing:
- `type` - Filter by transaction type (debit, credit)
- `matched` - Filter by matched status (true/false)
- `startDate` - Filter by date range start
- `endDate` - Filter by date range end

### Matches
- `GET /api/matches/company/:companyId` - List matches for company
- `GET /api/matches/:id` - Get match details
- `GET /api/matches/suggestions/invoice/:invoiceId` - Get AI suggestions for matching
- `POST /api/matches` - Create new match (reconcile invoice and transaction)
- `DELETE /api/matches/:id` - Delete match (unmatch)

### Anomalies
- `GET /api/anomalies/company/:companyId` - List anomalies for company
- `GET /api/anomalies/:id` - Get anomaly details
- `GET /api/anomalies/stats/company/:companyId` - Get anomaly statistics
- `POST /api/anomalies` - Create new anomaly
- `PUT /api/anomalies/:id/resolve` - Resolve anomaly

Query parameters for listing:
- `status` - Filter by status (open, investigating, resolved, etc.)
- `severity` - Filter by severity (critical, warning, info)
- `type` - Filter by anomaly type

### Reports
- `GET /api/reports/dashboard/company/:companyId` - Dashboard statistics
- `GET /api/reports/reconciliation/company/:companyId` - Reconciliation report
- `GET /api/reports/vat/company/:companyId` - VAT reports
- `GET /api/reports/exports/company/:companyId` - Export history

## Request Examples

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password_hash": "hashed_password",
    "name": "John Doe",
    "role": "business_owner"
  }'
```

### Create Invoice with Line Items
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "invoice_number": "INV-2024-001",
    "vendor_name": "Acme Corp",
    "invoice_date": "2024-01-15",
    "subtotal": 100.00,
    "vat_rate": 17.00,
    "vat_amount": 17.00,
    "total_amount": 117.00,
    "uploaded_by_user_id": 1,
    "line_items": [
      {
        "line_number": 1,
        "description": "Consulting Services",
        "quantity": 1,
        "unit_price": 100.00,
        "vat_rate": 17.00,
        "total_amount": 117.00
      }
    ]
  }'
```

### Bulk Import Transactions
```bash
curl -X POST http://localhost:3000/api/transactions/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "created_by_user_id": 1,
    "transactions": [
      {
        "bank_account_id": 1,
        "transaction_date": "2024-01-15",
        "description": "Payment from Customer",
        "amount": 117.00,
        "transaction_type": "credit"
      }
    ]
  }'
```

### Create Match
```bash
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": 1,
    "transaction_id": 1,
    "matched_amount": 117.00,
    "match_method": "manual",
    "match_confidence": 1.0,
    "matched_by_user_id": 1
  }'
```

## Error Handling

All endpoints return JSON responses with appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Database Connection

The server uses connection pooling for optimal performance:
- **Max connections**: 10
- **Min connections**: 0
- **Idle timeout**: 30 seconds

All queries use parameterized statements to prevent SQL injection.

## Security Features

- **CORS**: Configured to only allow requests from frontend origin
- **SQL Injection Prevention**: All queries use parameterized statements
- **Input Validation**: Required fields validated before database operations
- **Transaction Support**: Critical operations use database transactions

## Development Tips

### Test Database Connection
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

### View Server Logs
The server logs all requests:
```
2024-01-15T10:30:00.000Z - GET /api/users
2024-01-15T10:30:05.000Z - POST /api/invoices
```

### Debug SQL Queries
Set `LOG_LEVEL=debug` in `.env` for detailed logging.

## Troubleshooting

### "Database connection failed"
1. Verify SQL Server is running
2. Check database name in `.env`
3. Verify Windows Authentication or SQL credentials
4. Test connection in SSMS first

### "Port 3000 already in use"
Change `PORT` in `.env` to a different port (e.g., 3001)

### "Module not found"
Run `npm install` to ensure all dependencies are installed

### CORS errors
Verify `CORS_ORIGIN` in `.env` matches your frontend URL

## Next Steps

1. ✅ Backend server created
2. ⏭️ Add authentication middleware (JWT)
3. ⏭️ Create frontend service layer
4. ⏭️ Generate seed data
5. ⏭️ Add file upload support for invoices
6. ⏭️ Implement AI matching suggestions
