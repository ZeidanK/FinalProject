# Architecture

## High-Level Architecture

The system follows a microservices architecture with clear separation of concerns. It consists of five main components:

```
                                    Internet
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  Nginx Reverse   │
                            │      Proxy       │
                            └─────────┬────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         ▼                         ▼
              ┌──────────────────┐      ┌──────────────────┐
              │ React Frontend   │      │  Static Assets   │
              │ (SPA - Vite)     │      │   (Images, etc)  │
              └─────────┬────────┘      └──────────────────┘
                        │
                        │ REST API (JSON)
                        │
                        ▼
              ┌──────────────────┐
              │  Node.js Backend │
              │   (Express)      │
              └────┬────────┬────┘
                   │        │
        HTTP API   │        │   Database Queries
                   │        │
       ┌───────────┘        └────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────────┐           ┌──────────────────┐
│  AI/OCR Service  │           │   PostgreSQL     │
│ (Python FastAPI) │           │    Database      │
└──────────────────┘           └──────────────────┘
```

## Component Details

### 1. Frontend (React + Vite + Tailwind)

**Purpose**: User interface and client-side application logic

**Responsibilities**:
- Render dynamic user interface
- Handle user interactions and form validation
- Manage client-side state (authentication, selected business, UI state)
- Call backend APIs and handle responses
- Display data in tables, charts, and forms
- Support multi-language interface (i18n)
- Handle file uploads (invoices, bank statements)

**Technology**:
- React 18+ for component-based UI
- Vite for fast development and optimized builds
- Tailwind CSS for responsive, utility-first styling
- React Router for client-side routing
- i18next for internationalization
- Axios/Fetch for API communication

**Communication**:
- Sends authenticated REST API requests to backend
- Receives JSON responses
- Handles file uploads via multipart/form-data

### 2. Nginx Reverse Proxy

**Purpose**: Entry point for all HTTP/HTTPS traffic

**Responsibilities**:
- SSL/TLS termination (HTTPS)
- Route requests to appropriate services:
  - `/api/*` → Backend API
  - `/ai/*` → AI/OCR Service
  - `/*` → Frontend static files
- Load balancing (for future scaling)
- Rate limiting and DDoS protection
- Serve static assets efficiently
- Compression (gzip/brotli)

**Configuration**:
```nginx
# Example routing
location /api/ {
    proxy_pass http://backend:3000;
}

location /ai/ {
    proxy_pass http://ai-service:8000;
}

location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
}
```

**Benefits**:
- Single entry point for all traffic
- Enhanced security (hides internal architecture)
- Easy SSL certificate management
- Efficient static file serving

### 3. Backend API (Node.js + Express)

**Purpose**: Core business logic, API orchestration, and data management

**Responsibilities**:
- User authentication (JWT-based)
- Authorization and role-based access control
- Business logic for all features
- Data validation and sanitization
- Database operations (CRUD)
- Orchestrate calls to AI/OCR service
- Matching algorithm execution
- Anomaly detection logic
- Report generation
- Notification management
- Audit logging
- Session management

**Structure**:
```
/server
  /config       - Database, environment configs
  /routes       - API endpoint definitions
  /controllers  - Business logic handlers
  /models       - Database models/schemas
  /middleware   - Auth, validation, error handling
  /services     - Reusable business services
  /utils        - Helper functions
```

**API Design**:
- RESTful endpoints
- JWT authentication via Authorization header
- JSON request/response format
- Proper HTTP status codes
- Error handling with consistent format

**Communication**:
- Receives HTTP requests from frontend via Nginx
- Queries PostgreSQL database
- Calls AI/OCR service via HTTP for invoice processing
- Returns JSON responses

### 4. AI/OCR Service (Python + FastAPI)

**Purpose**: Specialized microservice for AI-powered features

**Responsibilities**:
- Invoice OCR (text extraction from PDFs and images)
- Data extraction (amounts, dates, vendor names, VAT)
- Intelligent matching algorithms
- Confidence scoring
- Pattern recognition for anomalies
- Future: Machine learning model training and prediction

**Technology**:
- Python for AI/ML libraries
- FastAPI for high-performance async API
- Tesseract OCR or cloud OCR services
- PyPDF2 or pdfplumber for PDF parsing
- Pandas for data manipulation
- Scikit-learn for machine learning (future)

**API Endpoints** (examples):
- `POST /ocr/extract` - Extract data from invoice image/PDF
- `POST /matching/find-matches` - Find invoice-transaction matches
- `POST /anomaly/detect` - Detect anomalies in transaction set

**Communication**:
- Receives HTTP requests from backend
- Stateless operations (no database access)
- Returns JSON results with extracted data and confidence scores

**Why Separate Service**:
- Python ecosystem better suited for AI/ML tasks
- Independent scaling (OCR is resource-intensive)
- Can be replaced or upgraded without affecting backend
- Clear separation of concerns

### 5. PostgreSQL Database

**Purpose**: Persistent data storage with relational integrity

**Responsibilities**:
- Store all application data
- Enforce referential integrity
- Handle concurrent transactions
- Provide ACID guarantees
- Execute queries efficiently with indexes
- Store audit logs

**Key Tables**:
- Users, Roles, Permissions
- Companies (business entities)
- Accountant-Company relationships
- Invoices and metadata
- Transactions and bank accounts
- Matches (invoice-transaction pairs)
- Anomalies and alerts
- Reports and exports
- Notifications
- Audit logs

**Access Pattern**:
- Only backend API connects directly to database
- Connection pooling for efficiency
- Prepared statements to prevent SQL injection

### 6. Deployment Environment (VPS + Docker)

**Purpose**: Host and orchestrate all services

**Components**:
- VPS (Hostinger or similar)
- Docker for containerization
- Docker Compose for orchestration

**Container Setup**:
```yaml
services:
  nginx:
    - Exposes ports 80, 443
    - Depends on: frontend, backend
  
  frontend:
    - Built React app served by nginx
  
  backend:
    - Node.js application
    - Depends on: database, ai-service
  
  ai-service:
    - Python FastAPI application
  
  database:
    - PostgreSQL with persistent volume
```

**Networking**:
- Internal Docker network for service communication
- Only Nginx exposed to internet
- Database not accessible externally

## Component Interactions

### User Login Flow
```
User → Frontend → Backend → Database
                    ↓
                 Generate JWT
                    ↓
Frontend ← Backend (JWT token)
```

### Invoice Upload & OCR Flow
```
User uploads PDF → Frontend → Backend (saves file)
                                 ↓
                         AI/OCR Service (extracts data)
                                 ↓
                         Backend (saves extracted data)
                                 ↓
                            Database (invoice record)
                                 ↓
                         Frontend (displays result)
```

### Transaction Matching Flow
```
Backend (matching request) → AI Service (matching algorithm)
                                 ↓
                         Return match suggestions
                                 ↓
Backend (save matches) → Database
                                 ↓
                         Frontend (display matches)
```

### Report Generation Flow
```
Frontend (request report) → Backend
                                ↓
                         Query Database (matched transactions)
                                ↓
                         Calculate VAT
                                ↓
                         Generate PDF/Excel
                                ↓
                         Frontend (download)
```

## Security Architecture

### Authentication & Authorization
- JWT tokens for stateless authentication
- Tokens include user ID, role, and business access
- Token refresh mechanism for long-lived sessions
- Role-based access control enforced at API level

### Data Security
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- HTTPS for all communication
- Database credentials in environment variables
- No sensitive data in logs

### Multi-Tenancy Isolation
- Every query filtered by company_id
- Middleware validates user has access to requested company
- Accountants granted explicit access via junction table
- Admin role can access all companies

### API Security
- CORS configuration limiting allowed origins
- Rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- File upload validation (type, size)

## Scalability Considerations

### Horizontal Scaling
- Frontend: Serve from CDN or multiple nginx instances
- Backend: Add more Node.js containers behind load balancer
- AI Service: Add more Python containers for OCR throughput
- Database: Read replicas for reporting queries

### Vertical Scaling
- Increase VPS resources as needed
- Database optimization with indexes and query tuning

### Caching Strategy (Future)
- Redis for session storage
- Cache frequently accessed data (user permissions, company settings)
- Cache matching results temporarily

## Monitoring & Logging

### Application Logs
- Backend logs all API requests and errors
- AI service logs processing times and errors
- Centralized logging (future: ELK stack or cloud service)

### Audit Trail
- All mutations logged to database
- Who, what, when, from where
- Immutable audit records

### Health Monitoring
- Health check endpoints for each service
- Container restart policies
- Uptime monitoring (future: external service)

## Disaster Recovery

### Backup Strategy
- Daily automated database backups
- Backup retention policy (30 days)
- Invoice file backups to separate storage

### Recovery Plan
- Database restore from backup
- Docker images stored in registry
- Environment variable documentation
- Deployment scripts for rapid restoration
