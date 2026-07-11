# Invoice & Transaction Reconciliation System

A full-stack financial management platform for businesses to manage invoices, bank transactions, and automated reconciliation. Designed for the Israeli market with Hebrew-language support, AI-powered invoice extraction, and multi-tenant role-based access.

## Features

- **AI-Powered Invoice Extraction** — Upload PDF invoices; data extracted automatically via Google Gemini API, Ollama (local LLM), or a custom Python Transformer model with hybrid fallback.
- **Transaction Management** — Import bank transactions from Excel/CSV, preview before committing, bulk operations.
- **Smart Matching Engine** — Multi-layer rule pipeline (fuzzy matching, vendor normalization, FX rate handling, combination evaluation) for reconciling invoices against bank transactions.
- **Anomaly Detection** — Duplicate file detection, duplicate invoice detection, bulk resolution.
- **Real-Time Notifications** — SignalR-powered live toasts for long-running upload and matching operations.
- **Background Jobs** — Hangfire processes invoice/transaction uploads asynchronously with queue management.
- **Role-Based Access** — Three roles: Admin, Accountant, Business Owner. Accountants can request access to multiple companies.
- **Dashboard & Reports** — Reconciliation reports, aging reports, per-company dashboards with charts.
- **Activity Audit Log** — Middleware logs every API request for full traceability.

## Tech Stack

| Layer              | Technologies                                                                 |
|--------------------|------------------------------------------------------------------------------|
| Frontend           | React 19, Material-UI 7, React Query 5, React Router 6, Recharts, Framer Motion |
| Backend            | C# .NET 6, ASP.NET Core Web API, SignalR, Hangfire                           |
| Database           | Microsoft SQL Server, 108 stored procedures                                  |
| AI/ML              | Google Gemini API, Ollama (local LLM), Python Transformers + FastAPI         |
| OCR & PDF          | Tesseract 5, iText 7, pdfjs-dist                                             |
| Authentication     | JWT Bearer tokens                                                             |
| Testing            | xUnit + Moq (backend), Vitest + Testing Library + MSW (frontend)             |

## Architecture

```
Client (React + Vite)
       |
       | HTTP / SignalR
       v
API Controllers (ASP.NET Core)
       |
       v
Business Logic Layer (Services)
       |
       v
Data Access Layer (ADO.NET + Stored Procedures)
       |
       v
SQL Server
```

The matching engine runs as a separate pipeline within the BL layer, with pluggable rule layers (exact match, fuzzy match, installment grouping, etc.). AI extraction supports three providers toggled via configuration.

## Prerequisites

- [.NET 6 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Node.js 20+](https://nodejs.org/)
- SQL Server (local or remote)
- (Optional) Google Gemini API key for AI extraction
- (Optional) Ollama or Python FastAPI server for local model inference

## Setup

### 1. Clone & configure

```bash
git clone https://github.com/ZeidanK/FinalProject.git
cd FinalProject
```

Copy `Server/appsettings.json` and update the connection string and API keys:

```json
{
  "ConnectionStrings": {
    "myProjDB": "Data Source=your-server;Initial Catalog=your-db;User ID=your-user;Password=your-password"
  },
  "GeminiSettings": {
    "ApiKey": "your-gemini-api-key"
  }
}
```

### 2. Database

Run the scripts in `Server/Tables/` to create the schema, then `Server/StoredProcedures/` to deploy all procedures.

### 3. Backend

```bash
cd Server
dotnet restore
dotnet run
```

API runs at `http://localhost:5050` with Swagger at `/swagger`.

### 4. Frontend

```bash
cd ClientSide
npm install
npm run dev
```

App runs at `http://localhost:5173` with API proxy to the backend.

## Test Accounts

| Role              | Email          | Password   |
|-------------------|----------------|------------|
| Accountant        | 1@account.com  | 123456     |
| Business Owner    | 1@1.com        | 123456789  |
| Admin             | test@test.com  | test1234   |

## Running Tests

```bash
# Both backend and frontend
npm run test:all

# Backend only
npm run test:server

# Frontend only
npm run test:client
```

## Project Structure

```
FinalProject/
├── ClientSide/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom hooks + React Query hooks
│   │   ├── pages/       # Route page components
│   │   ├── services/    # API client modules
│   │   ├── schemas/     # Zod validation schemas
│   │   └── test/        # Frontend tests
│   └── ...
├── Server/              # .NET Web API
│   ├── BL/              # Business logic services
│   ├── Controllers/     # API controllers
│   ├── DAL/             # Data access layer
│   ├── MatchingEngine/  # Multi-layer matching pipeline
│   ├── Middleware/      # Exception, security, logging
│   ├── Models/          # Domain models
│   ├── Realtime/        # SignalR hub
│   ├── LocalModel/      # Python ML inference server
│   ├── StoredProcedures/
│   └── Tables/
├── Tests/               # Backend tests (xUnit)
└── training/            # ML training data & models
```

## Deployment

The project includes a PowerShell deployment script (`deploy.ps1`) that builds both projects and uploads via FTP. Configure the FTP server address and credentials in the script before running.

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

## Team

- **Mohammad Noor Abuasbe**
- **Karim Zeidan**
- **Yazan Watad**
