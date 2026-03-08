# Architecture Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 1. Upload File (PDF/Image)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
│  • File upload form                                              │
│  • Display results                                               │
│  Port: 5173 (dev) or served by nginx                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 2. POST /api/upload
                 │    (multipart/form-data)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                           │
│  • Routes /api/* to backend                                      │
│  • Serves frontend static files                                  │
│  Port: 80                                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 3. Proxy to backend
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Backend API (Node.js + Express)                  │
│  • Receive file upload                                           │
│  • Save to disk temporarily                                      │
│  • Convert to base64                                             │
│  • Call AI service                                               │
│  • Return results                                                │
│  • Clean up file                                                 │
│  Port: 3000                                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 4. POST /extract
                 │    { file_data: base64, filename, mimetype }
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI Service (Python + FastAPI)                       │
│  • Decode base64 file                                            │
│  • Detect file type (PDF/Image)                                  │
│  • Run OCR extraction:                                           │
│    - PDF: pdf2image + pytesseract                               │
│    - Image: pytesseract                                         │
│  • Return extracted text                                         │
│  Port: 8000                                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 5. Return: { text, confidence, method }
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API                                 │
│  • Receive OCR results                                           │
│  • Calculate processing time                                     │
│  • Save to PostgreSQL database                                   │
│  • Delete temp file                                              │
│  • Format response                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 6. Save invoice metadata
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                                 │
│  • users (test users)                                            │
│  • invoices (uploaded file metadata)                             │
│  • transactions (relational data)                                │
│  Port: 5432                                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ 7. Return: {
                 │      success: true,
                 │      invoiceId: 123,
                 │      extractedText: "...",
                 │      processingTime: 1234,
                 │      metadata: {...}
                 │    }
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  • Display extracted text                                        │
│  • Show processing time                                          │
│  • Show metadata                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Docker Network

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network: app-network               │
│                                                              │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  nginx   │─────▶│ backend  │─────▶│ai-service│         │
│  │  :80     │      │  :3000   │      │  :8000   │         │
│  └────┬─────┘      └──────┬───┘      └──────────┘         │
│       │                   │                                 │
│       │ Serves            │ Queries                         │
│       ▼                   ▼                                 │
│  ┌──────────┐      ┌────────────┐                          │
│  │ frontend │      │ postgres   │                          │
│  │  (dist)  │      │   :5432    │                          │
│  └──────────┘      └────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       │
       │ Port 80 exposed to host
       ▼
   Internet/Browser
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | User interface |
| **Proxy** | Nginx | Reverse proxy, static files |
| **Backend** | Node.js 18 + Express | API orchestration |
| **AI/OCR** | Python 3.11 + FastAPI | OCR extraction |
| **OCR Engine** | Tesseract | Text recognition |
| **Database** | PostgreSQL 15 | Data persistence |
| **Containerization** | Docker + Docker Compose | Deployment |

## File Processing Flow

```
1. User selects file
   └─▶ File stored in browser memory

2. User clicks upload
   └─▶ File sent as FormData to backend

3. Backend receives file
   └─▶ Multer saves to /uploads directory
   └─▶ File read as buffer
   └─▶ Converted to base64 string

4. Backend calls AI service
   └─▶ Sends base64 + metadata via HTTP POST

5. AI service processes
   └─▶ Decodes base64 to bytes
   └─▶ Determines type (PDF/Image)
   └─▶ PDF: Convert to images → OCR each page
   └─▶ Image: Direct OCR
   └─▶ Returns plain text

6. Backend processes response
   └─▶ Deletes temp file from disk
   └─▶ Formats response with metadata
   └─▶ Returns to frontend

7. Frontend displays results
   └─▶ Shows extracted text
   └─▶ Shows processing stats
```

## Simplified vs Production

### This Demo (Simplified)
- ❌ No authentication
- ❌ No database
- ❌ No persistent storage
- ❌ No user sessions
- ✅ Core OCR functionality
- ✅ All services working together
- ✅ Docker deployment ready

### Production (See /docs)
- ✅ JWT authentication
- ✅ PostgreSQL database
- ✅ Persistent file storage
- ✅ Multi-user support
- ✅ Role-based access
- ✅ Matching algorithms
- ✅ Anomaly detection
- ✅ VAT reporting
- ✅ Audit logs
