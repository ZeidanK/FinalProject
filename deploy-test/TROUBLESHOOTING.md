# Common Issues and Solutions

## Installation Issues

### "npm install" fails in frontend

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Python dependencies fail to install

**Solution:**
```bash
# Make sure you have Python 3.11+
python --version

# Use a virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

---

## Docker Issues

### "Port already in use" error

**Solution:**
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :80

# Mac/Linux:
lsof -i :80

# Kill the process or change Docker ports in docker-compose.yml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

### Docker build fails

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker is running
docker ps
```

### Container exits immediately

**Solution:**
```bash
# Check logs for specific container
docker-compose logs backend
docker-compose logs ai-service

# Common fix: rebuild
docker-compose down
docker-compose up --build
```

---

## Runtime Issues

### "Cannot connect to backend"

**Symptoms:** Frontend shows error "Failed to connect to server"

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok",...}
   ```

2. **Check Docker logs:**
   ```bash
   docker-compose logs backend
   ```

3. **Restart backend:**
   ```bash
   docker-compose restart backend
   ```

4. **Check environment variables:**
   ```bash
   docker-compose exec backend env | grep AI_SERVICE_URL
   # Should show: AI_SERVICE_URL=http://ai-service:8000
   ```

### "AI service is not available"

**Symptoms:** Upload succeeds but OCR fails

**Solutions:**

1. **Check AI service is running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok",...}
   ```

2. **Check logs:**
   ```bash
   docker-compose logs ai-service
   ```

3. **Verify backend can reach AI service:**
   ```bash
   docker-compose exec backend curl http://ai-service:8000/health
   ```

4. **Restart AI service:**
   ```bash
   docker-compose restart ai-service
   ```

### OCR returns empty or incorrect text

**Symptoms:** File uploads but extracted text is wrong/empty

**Solutions:**

1. **Check file type:** Only PDF, PNG, JPG are supported

2. **File quality:** Image must be clear and readable
   - Min resolution: 300 DPI recommended
   - Good contrast
   - Not blurry or skewed

3. **Check Tesseract is installed:**
   ```bash
   docker-compose exec ai-service tesseract --version
   ```

4. **Try with a clearer test file**

### File upload fails with "File too large"

**Solution:**

Increase limits in multiple places:

**1. Backend (index.js):**
```javascript
limits: {
  fileSize: 20 * 1024 * 1024, // Increase to 20MB
}
```

**2. Nginx (nginx.conf):**
```nginx
client_max_body_size 20M;
```

**3. Rebuild:**
```bash
docker-compose up --build -d
```

---

## Development Issues

### Hot reload not working in frontend

**Solution:**
```bash
# Make sure you're in dev mode
cd frontend
npm run dev

# Check vite.config.js has:
server: {
  host: true
}
```

### CORS errors in browser console

**Symptoms:** "Access-Control-Allow-Origin" error

**Solutions:**

1. **In development:** Make sure backend CORS is enabled
   - Check `backend/index.js` has `app.use(cors())`

2. **In production:** Use nginx proxy (no CORS issues)
   - Access via http://localhost (not 5173)

### Changes not showing after rebuild

**Solution:**
```bash
# Hard refresh in browser
Ctrl + Shift + R  # Windows/Linux
Cmd + Shift + R   # Mac

# Or clear Docker cache and rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

---

## Performance Issues

### OCR is very slow

**Normal:** 2-5 seconds for images, 10-20 seconds for multi-page PDFs

**If slower:**

1. **Check CPU usage:**
   ```bash
   docker stats
   ```

2. **Allocate more resources to Docker:**
   - Docker Desktop → Settings → Resources
   - Increase CPUs and Memory

3. **Reduce file size:**
   - Compress images before upload
   - Reduce PDF page count for testing

### Frontend loads slowly

**Solution:**

1. **Use production build:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Enable nginx caching** (already configured)

3. **Use CDN for production** (future enhancement)

---

## Network Issues

### Services can't communicate in Docker

**Symptoms:** Backend can't reach AI service

**Solution:**

1. **Check network:**
   ```bash
   docker network ls
   docker network inspect deploy-test_app-network
   ```

2. **Use service names, not localhost:**
   ```javascript
   // ✅ Correct in Docker
   AI_SERVICE_URL=http://ai-service:8000
   
   // ❌ Wrong in Docker
   AI_SERVICE_URL=http://localhost:8000
   ```

3. **Recreate network:**
   ```bash
   docker-compose down
   docker-compose up
   ```

---

## Platform-Specific Issues

### Windows: Line ending issues

**Solution:**
```bash
# Configure git
git config --global core.autocrlf true

# Or convert files
dos2unix deploy.sh
```

### Mac: Permission denied on scripts

**Solution:**
```bash
chmod +x deploy.sh
chmod +x backend/node_modules/.bin/*
```

### Linux: Docker requires sudo

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
```

---

## Still Having Issues?

### Diagnostic Commands

```bash
# Check all services
docker-compose ps

# View all logs
docker-compose logs

# Check Docker
docker info

# Check ports
netstat -an | grep LISTEN

# Test network
curl http://localhost:3000/health
curl http://localhost:8000/health
```

### Full Reset

```bash
# Nuclear option - start fresh
docker-compose down -v
rm -rf backend/node_modules frontend/node_modules
rm -rf backend/uploads/* frontend/dist
docker system prune -a

# Rebuild everything
cd frontend && npm install && npm run build && cd ..
cd backend && npm install && cd ..
docker-compose up --build
```

### Get Help

If issues persist:

1. Check logs: `docker-compose logs`
2. Check Docker is running: `docker ps`
3. Verify all files exist (check folder structure)
4. Try the manual development mode (no Docker)
5. Review the main documentation in `/docs`

### Common Success Checklist

- ✅ Docker Desktop is running
- ✅ Port 80 is available
- ✅ Frontend built successfully (`npm run build`)
- ✅ All containers are running (`docker-compose ps`)
- ✅ Health checks pass (curl endpoints)
- ✅ No errors in logs (`docker-compose logs`)
