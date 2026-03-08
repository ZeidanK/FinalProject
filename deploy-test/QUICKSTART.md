# Deploy Test - Quick Reference

## What It Does

Upload document → OCR extraction → Save to database → Display results

**Stack:** React + Nginx + Node.js + Python + PostgreSQL + Docker

## 🚀 Quick Deploy (Choose One)

### Option 1: Automated Script

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Steps

```bash
# 1. Build frontend
cd frontend
npm install
npm run build
cd ..

# 2. Start all services
docker-compose up --build -d

# 3. Access at http://localhost
```

---

## 🛠️ Development Mode (No Docker)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Access: http://localhost:5173

---

## 📊 Service Endpoints

- **Frontend**: http://localhost (Docker) or http://localhost:5173 (Dev)
- **Backend API**: http://localhost:3000
- **AI Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432 (user: deployuser, db: deploytest)
- **Backend Health**: http://localhost:3000/health
- **AI Health**: http://localhost:8000/health

---

## 📂 Database Access

```bash
# Access database from host
psql -h localhost -p 5432 -U deployuser -d deploytest

# From Docker container
docker-compose exec postgres psql -U deployuser -d deploytest

# View all invoices
docker-compose exec postgres psql -U deployuser -d deploytest -c "SELECT * FROM invoices;"
```

---

## 🧪 Testing

1. Go to http://localhost
2. Upload a PDF or image file
3. Click "Upload & Extract"
4. View extracted text

**Test Files**: Use any PDF or image with text (invoices, receipts, documents)

---

## 🔍 Troubleshooting

**Frontend can't reach backend:**
```bash
# Check backend is running
curl http://localhost:3000/health

# Check Docker logs
docker-compose logs backend
```

**Backend can't reach AI service:**
```bash
# Check AI service
curl http://localhost:8000/health

# Check logs
docker-compose logs ai-service
```

**Port conflicts:**
```bash
# Stop all containers
docker-compose down

# Check what's using port
netstat -ano | findstr :80    # Windows
lsof -i :80                   # Mac/Linux
```

---

## 🧹 Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove all data
docker-compose down -v
rm -rf backend/uploads/*
rm -rf frontend/dist
```

---

## 📦 What's Included

```
deploy-test/
├── frontend/           React + Vite UI
├── backend/            Node.js + Express API
├── ai-service/         Python + FastAPI OCR
├── database/           PostgreSQL schema & init
├── nginx/              Reverse proxy config
├── docker-compose.yml  Container orchestration (4 services)
└── README.md           Full documentation
```

---

## 🎯 Next Steps

This is a **basic scaffold** for testing deployment. For production:

1. Add authentication (JWT, sessions)
2. Add more database tables and relationships
3. Add error handling and retries
4. Add logging and monitoring
5. Change default passwords
6. Add SSL/HTTPS
7. Add backup and recovery
5. Add HTTPS/SSL
6. Add rate limiting
7. Add automated tests

See `/docs` for full production architecture.
