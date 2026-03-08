# Deploy Test - AI Invoice OCR Demo

## What This Does

A minimal deployment test that demonstrates the full stack:
1. Upload an invoice/document (PDF or image)
2. Backend receives it and calls AI service
3. AI service extracts text using OCR
4. Results saved to PostgreSQL database
5. Results displayed to user

**Minimal authentication, basic database** - just a proof of concept scaffold for testing all deployment containers.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for deployment)

### Run Locally Without Docker

**Prerequisites:**
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (running locally or use Docker for just the DB)

**Optional - PostgreSQL with Docker only:**
```bash
docker run --name deploy-postgres -e POSTGRES_DB=deploytest -e POSTGRES_USER=deployuser -e POSTGRES_PASSWORD=deploypass -p 5432:5432 -v $(pwd)/database/init.sql:/docker-entrypoint-initdb.d/init.sql postgres:15-alpine
```

**Terminal 1 - Backend**:
```bash
cd backend
npm install
# Make sure PostgreSQL is running on localhost:5432
npm start
```

**Terminal 2 - AI Service**:
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

---

## Deploy with Docker

### 1. Build and start all services:
```bash
docker-compose up --build
```

### 2. Access the application:
```
http://localhost
```

### 3. Stop services:
```bash
docker-compose down
```

---

## How to Test

1. Open http://localhost (or http://localhost:5173 for dev mode)
2. Click "Choose File" and select a PDF or image (invoice, receipt, etc.)
3. Click "Upload & Extract"
4. Wait for OCR processing
5. See extracted text displayed below

---

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ Upload File
       ▼
┌─────────────┐
│   Nginx     │ :80 (in Docker)
└──────┬──────┘
       │
┌──────▼──────┐
│  Frontend   │ :5173 (dev) or served by nginx
│   (React)   │
└──────┬──────┘
       │ POST /api/upload
       ▼
┌─────────────┐
│   Backend   │ :3000
│  (Node.js)  │
└──────┬──────┘
       │ POST /extract
       ▼
┌─────────────┐
│ AI Service  │ :8000
│   (Python)  │
└──────┬──────┘
       │
       ▼
   OCR Result
```

---

## Project Structure

```
deploy-test/
  frontend/          # React + Vite
    src/
      App.jsx        # Main upload component
  backend/           # Node.js + Express
    index.js         # API server
    uploads/         # Temporary file storage
  ai-service/        # Python + FastAPI
    main.py          # OCR endpoint
  nginx/
    nginx.conf       # Reverse proxy config
  docker-compose.yml # Orchestration
```

---

## Deployment Notes

### Environment Variables
None required for this basic test! Everything uses defaults.

### Ports
- **80**: Nginx (production)
- **3000**: Backend API
- **5173**: Frontend dev server
- **8000**: AI Service

### File Uploads
- Max size: 10MB
- Supported: PDF, PNG, JPG, JPEG
- Files stored temporarily in `/backend/uploads`

---

## Troubleshooting

### "Cannot connect to backend"
```bash
# Check backend is running
curl http://localhost:3000/health

# View logs
docker-compose logs backend
```

### "OCR not working"
```bash
# Check AI service is running
curl http://localhost:8000/health

# View logs
docker-compose logs ai-service
```

### "Port already in use"
```bash
# Stop conflicting services or change ports in docker-compose.yml
docker-compose down
```

---

## Next Steps

This is a **proof of concept**. For production, you'd add:
- User authentication (JWT)
- Database (PostgreSQL)
- Persistent file storage
- Error handling and retries
- Rate limiting
- HTTPS/SSL
- Logging and monitoring

See the main `/docs` folder for full production architecture.

---

## Clean Up

Remove everything:
```bash
docker-compose down -v
rm -rf backend/uploads/*
```
