# Deployment Verification Checklist

Use this checklist to verify your deployment is working correctly.

## ✅ Pre-Deployment Checks

- [ ] Docker Desktop is running
- [ ] Ports 80, 3000, 5432, 8000 are available
- [ ] Git repository is cloned/downloaded
- [ ] You're in the `deploy-test` directory

## ✅ Build Checks

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

- [ ] No errors during `npm install`
- [ ] No errors during `npm run build`
- [ ] `frontend/dist` directory created
- [ ] `frontend/dist/index.html` exists

### Docker Build
```bash
docker-compose build
```

- [ ] All 4 services build successfully:
  - [ ] nginx
  - [ ] backend
  - [ ] ai-service
  - [ ] postgres
- [ ] No build errors in output

## ✅ Startup Checks

```bash
docker-compose up -d
```

- [ ] All containers start successfully
- [ ] All containers stay running (not exiting)

### Check Container Status
```bash
docker-compose ps
```

Expected output: All services "Up"
```
NAME                    STATUS
deploy_test_nginx       Up
deploy_test_backend     Up
deploy_test_postgres    Up (healthy)
```

## ✅ Health Check Tests

### PostgreSQL Health
```bash
docker-compose exec postgres pg_isready -U deployuser -d deploytest
```

- [ ] Returns: "deploytest:5432 - accepting connections"
- [ ] Database is ready
## ✅ Health Check Tests"database":"connected",...}`
- [ ] Database shows as "connected"

### Backend Health
```bash
curl http://localhost:3000/health
```

- [ ] Returns JSON response
- [ ] Status code: 200
- [ ] Response contains: `{"status":"ok",...}`

### AI Service Health
```bash
curl http://localhost:8000/health
```

- [ ] Returns JSON response
- [ ] Status code: 200
- [ ] Response contains: `{"status":"ok",...}`

### Frontend Access
```bash
curl http://localhost
```

- [ ] Returns HTML (not error page)
- [ ] Status code: 200
- [ ] Contains: `<title>AI Invoice OCR Demo</title>`

## ✅ Functional Tests

### Test 1: Frontend Loads
1. [ ] Open http://localhost in browser
2. [ ] Page loads without errors
3. [ ] Upload form is visible
4. [ ] No console errors (F12)

### Test 2: File Upload (Image)
1. [ ] Select a PNG or JPG image with text
2. [ ] Click "Upload & Extract"
3. [ ] Wait for processing
4. [ ] Extracted text appears below
5. [ ] No errors shown

### Test 3: File Upload (PDF)
1. [ ] Select a PDF file
2. [ ] Click "Upload & Extract"
3. [ ] Wait for processing (may take longer)
4. [ ] Extracted text appears
5. [ ] No errors shown

### Test 4: Error Handling
1. [ ] Try uploading a non-supported file (e.g., .txt)
2. [ ] Should show error message
3. [ ] Try uploading without selecting file
4. [ ] Should show error message

## ✅ Log Checks

```bash
docker-compose logs
```

- [ ] No critical errors in any service
- [ ] Backend shows: "Backend server running on port 3000"
- [ ] AI service shows: "Application startup complete"
- [ ] Nginx shows access logs (after page visit)

### Backend Logs Should Show:
```
🚀 Backend server running on port 3000
🤖 AI Service URL: http://ai-service:8000
📁 Uploads directory: /app/uploads
```

### AI Service Logs Should Show:
```
INFO:     Started server process
INFO:     Waiting for application startup
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## ✅ Performance Checks

### Processing Time
- [ ] Image files: < 5 seconds
- [ ] PDF files (1-2 pages): < 10 seconds
- [ ] PDF files (3-5 pages): < 20 seconds

### Resource Usage
```bash
docker stats
```

- [ ] CPU usage reasonable (< 80% per container)
- [ ] Memory usage reasonable (< 512MB per container)

## ✅ Network Checks

### Container Network
```bash
docker network inspect deploy-test_app-network
```

- [ ] All 3 containers are connected
- [ ] Each has an IP address assigned

### Internal Communication
```bash
# From inside backend container
docker-compose exec backend curl http://ai-service:8000/health
```

- [ ] Returns successful response
- [ ] Proves backend can reach AI service

## ✅ File System Checks

### Uploads Directory
```bash
ls -la backend/uploads/
```

- [ ] Directory exists
- [ ] Should be empty (files deleted after processing)
- [ ] Contains only `.gitkeep` file

### Frontend Build
```bash
ls -la frontend/dist/
```

- [ ] Contains `index.html`
- [ ] Contains `assets/` folder
- [ ] Contains JavaScript and CSS files

## ✅ Cleanup Test

### Stop Services
```bash
docker-compose down
```

- [ ] All containers stop cleanly
- [ ] No errors during shutdown

### Restart Test
```bash
docker-compose up -d
```

- [ ] All services start again
- [ ] All health checks still pass
- [ ] Application still works

## 🔍 Troubleshooting

If any checks fail:

1. **Check logs first:**
   ```bash
   docker-compose logs backend
   docker-compose logs ai-service
   docker-compose logs nginx
   ```

2. **Port conflicts:**
   ```bash
   # Windows
   netstat -ano | findstr :80
   
   # Mac/Linux
   lsof -i :80
   ```

3. **Restart services:**
   ```bash
   docker-compose restart
   ```

4. **Full rebuild:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

5. **Check TROUBLESHOOTING.md** for specific issues

## ✅ Deployment Success!

If all checks pass:

🎉 **Your deployment is successful!**

You now have:
- ✅ Working React frontend
- ✅ Working Node.js backend
- ✅ Working Python AI service
- ✅ All services communicating
- ✅ Docker deployment functional
- ✅ OCR extraction working

## 📝 Next Steps

1. **Test with real invoices/documents**
2. **Review the code to understand how it works**
3. **Check `/docs` for production architecture**
4. **Consider adding authentication, database, etc.**
5. **Deploy to a VPS for real-world testing**

---

**Date tested:** ________________

**Tester:** ________________

**All checks passed:** ☐ Yes  ☐ No (see notes below)

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
