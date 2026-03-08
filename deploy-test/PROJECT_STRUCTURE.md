# Deploy Test - Project Structure

## 📁 Complete File Structure

```
deploy-test/
│
├── README.md                    # Main documentation
├── QUICKSTART.md                # Quick deployment guide
├── ARCHITECTURE.md              # System architecture diagrams
├── TROUBLESHOOTING.md           # Common issues and solutions
├── docker-compose.yml           # Container orchestration
├── deploy.sh                    # Deployment script (Linux/Mac)
├── deploy.bat                   # Deployment script (Windows)
├── .gitignore                   # Git ignore rules
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── App.jsx             # Main upload component
│   │   ├── App.css             # Component styles
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML template
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── Dockerfile              # Frontend container config
│   └── dist/                   # Build output (generated)
│
├── backend/                     # Node.js Backend
│   ├── index.js                # Express API server
│   ├── package.json            # Node dependencies
│   ├── Dockerfile              # Backend container config
│   ├── .gitignore              # Backend-specific ignores
│   └── uploads/                # Temporary file storage
│       └── .gitkeep            # Keep directory in Git
│
├── ai-service/                  # Python AI Service
│   ├── main.py                 # FastAPI OCR service
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # AI service container config
│   └── .gitignore              # Python-specific ignores
│
└── nginx/                       # Reverse Proxy
    └── nginx.conf              # Nginx configuration
```

## 🎯 Key Files Explained

### Documentation Files

- **README.md** - Start here! Complete setup and usage guide
- **QUICKSTART.md** - One-page quick reference
- **ARCHITECTURE.md** - Visual system diagrams and flow
- **TROUBLESHOOTING.md** - Solutions to common problems

### Configuration Files

- **docker-compose.yml** - Defines all services and how they connect
- **nginx/nginx.conf** - Reverse proxy routing configuration
- **vite.config.js** - Frontend build configuration

### Application Code

- **frontend/src/App.jsx** - Upload UI and result display
- **backend/index.js** - API server and file handling
- **ai-service/main.py** - OCR extraction logic

### Deployment Files

- **Dockerfile** (3x) - Container definitions for each service
- **deploy.sh / deploy.bat** - Automated deployment scripts

## 🚀 Quick Start Commands

```bash
# Development Mode (No Docker)
cd backend && npm install && npm start &
cd ai-service && pip install -r requirements.txt && python main.py &
cd frontend && npm install && npm run dev

# Production Mode (Docker)
docker-compose up --build

# Or use scripts
./deploy.sh        # Linux/Mac
deploy.bat         # Windows
```

## 📊 Technology Summary

| Service | Tech Stack | Port | Purpose |
|---------|-----------|------|---------|
| Frontend | React 18 + Vite | 5173 (dev), 80 (prod) | User interface |
| Backend | Node.js 18 + Express | 3000 | API orchestration |
| AI Service | Python 3.11 + FastAPI | 8000 | OCR extraction |
| Proxy | Nginx | 80 | Reverse proxy |

## 🔗 Service Communication

```
Browser
  ↓ (HTTP)
Nginx :80
  ↓ (proxy /api/*)
Backend :3000  
  ↓ (HTTP POST /extract)
AI Service :8000
  ↓ (Return OCR text)
Backend
  ↓ (JSON response)
Browser
```

## ✅ What This Demo Proves

1. ✅ Frontend can be built with React + Vite
2. ✅ Backend can handle file uploads
3. ✅ Backend can call external AI service
4. ✅ AI service can perform OCR
5. ✅ All services work together in Docker
6. ✅ Nginx can route traffic correctly
7. ✅ Stack is deployment-ready

## 🎓 Learning Path

**If you're new to this stack:**

1. Start with **frontend/src/App.jsx** - See how file upload works
2. Look at **backend/index.js** - See how API handles files
3. Check **ai-service/main.py** - See OCR in action
4. Review **docker-compose.yml** - Understand service orchestration
5. Read **/docs** folder - Learn production architecture

## 📝 Next Steps

This is intentionally minimal. To make it production-ready:

### Immediate Additions
- [ ] Add authentication (JWT)
- [ ] Add database (PostgreSQL)
- [ ] Add persistent file storage
- [ ] Add error handling and retries
- [ ] Add logging (Winston, Python logging)
- [ ] Add input validation

### Production Enhancements
- [ ] HTTPS/SSL with Let's Encrypt
- [ ] Rate limiting
- [ ] Request/response compression
- [ ] Monitoring and alerting
- [ ] Automated tests
- [ ] CI/CD pipeline
- [ ] Load balancing

### Feature Additions
- [ ] User accounts
- [ ] Invoice-transaction matching
- [ ] Anomaly detection
- [ ] VAT report generation
- [ ] Multi-language support
- [ ] Audit logging

**See `/docs/SYSTEM_OVERVIEW.md` for the full production vision.**

## 🛠️ Customization

Want to modify the demo?

**Change OCR engine:**
- Edit `ai-service/main.py`
- Swap Tesseract for cloud OCR (Google Vision, AWS Textract)

**Change frontend framework:**
- Replace React with Vue, Svelte, Angular
- Keep the same API contract

**Add database:**
- Add PostgreSQL to docker-compose.yml
- Update backend to save results

**Change deployment:**
- Replace Docker with Kubernetes
- Deploy to AWS, Azure, GCP

## 📞 Support

Issues? Check these in order:

1. **TROUBLESHOOTING.md** - Common issues
2. **docker-compose logs** - Service logs
3. **Health checks** - curl http://localhost:3000/health
4. **Full reset** - `docker-compose down -v` and rebuild

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ `docker-compose ps` shows all services running
2. ✅ http://localhost loads the upload page
3. ✅ Uploading a file returns extracted text
4. ✅ No errors in `docker-compose logs`

**Happy deploying! 🚀**
