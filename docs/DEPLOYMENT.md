# Deployment

## Overview

This document explains the deployment strategy for the AI-Powered Financial Reconciliation Platform, including infrastructure setup, Docker configuration, and deployment procedures.

---

## Deployment Architecture

### Infrastructure Components

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │  VPS Server    │
              │  (Hostinger)   │
              └────────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │         Docker Host          │
        │                              │
        │  ┌────────────────────┐     │
        │  │  Nginx Container   │     │
        │  │  Port: 80, 443     │     │
        │  └─────────┬──────────┘     │
        │            │                 │
        │  ┌─────────┴──────────┐     │
        │  │                     │     │
        │  ▼                     ▼     │
        │  ┌──────────┐  ┌──────────┐ │
        │  │ Frontend │  │ Backend  │ │
        │  │Container │  │Container │ │
        │  └──────────┘  └────┬─────┘ │
        │                     │        │
        │       ┌─────────────┴───┐   │
        │       │                 │   │
        │       ▼                 ▼   │
        │  ┌──────────┐  ┌──────────┐│
        │  │AI/OCR    │  │PostgreSQL││
        │  │Container │  │Container ││
        │  └──────────┘  └──────────┘│
        │                             │
        └─────────────────────────────┘
```

---

## Docker Setup

### Docker Compose Configuration

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: reconciliation_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - backend
      - frontend
    networks:
      - app-network
    restart: unless-stopped

  # Frontend (React)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: reconciliation_frontend
    volumes:
      - ./frontend/dist:/app/dist
    networks:
      - app-network
    restart: unless-stopped

  # Backend API (Node.js)
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: reconciliation_backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=database
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - AI_SERVICE_URL=http://ai-service:8000
    depends_on:
      - database
      - ai-service
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads

  # AI/OCR Service (Python)
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: reconciliation_ai
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads

  # PostgreSQL Database
  database:
    image: postgres:15-alpine
    container_name: reconciliation_db
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

---

## Dockerfiles

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (if custom config needed)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "index.js"]
```

### AI Service Dockerfile

Create `ai-service/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-heb \
    tesseract-ocr-ara \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    upstream backend {
        server backend:3000;
    }

    upstream ai_service {
        server ai-service:8000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Redirect HTTP to HTTPS (after SSL setup)
        # return 301 https://$server_name$request_uri;

        # Client max body size (for file uploads)
        client_max_body_size 20M;

        # API routes
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # AI service routes (internal only, not exposed publicly)
        location /ai/ {
            internal;
            proxy_pass http://ai_service/;
        }

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }

    # HTTPS server (uncomment after SSL setup)
    # server {
    #     listen 443 ssl http2;
    #     server_name yourdomain.com www.yourdomain.com;
    # 
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #     
    #     # ... same location blocks as above
    # }
}
```

---

## Environment Variables

### Create `.env` File

**IMPORTANT**: Never commit `.env` to Git! Add to `.gitignore`.

Create `.env` in project root:

```bash
# Database
DB_NAME=reconciliation_db
DB_USER=reconciliation_user
DB_PASSWORD=secure_password_here
DB_HOST=database
DB_PORT=5432

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# Application
NODE_ENV=production
PORT=3000

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# Email (for notifications - optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

### Environment Variable Management

**Development**: Use `.env` file (loaded by dotenv)

**Production**: 
- Set environment variables on VPS
- Or use Docker secrets
- Or use environment variables in docker-compose

---

## VPS Setup (Hostinger or Similar)

### 1. Initial VPS Setup

**SSH into VPS**:
```bash
ssh root@your-vps-ip
```

**Update system**:
```bash
apt update && apt upgrade -y
```

**Install Docker**:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

**Create deployment user** (optional but recommended):
```bash
adduser deployer
usermod -aG docker deployer
usermod -aG sudo deployer
```

### 2. Firewall Setup

```bash
# Install UFW (Uncomplicated Firewall)
apt install ufw

# Allow SSH (IMPORTANT: do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 3. Setup Project Directory

```bash
# Create project directory
mkdir -p /opt/reconciliation-app
cd /opt/reconciliation-app

# Create necessary subdirectories
mkdir -p uploads nginx/ssl database
```

---

## Deployment Process

### Initial Deployment

**1. Clone repository** (or upload files):
```bash
cd /opt/reconciliation-app
git clone https://github.com/yourusername/reconciliation-app.git .
```

**2. Create environment file**:
```bash
nano .env
# Add all environment variables
```

**3. Build and start containers**:
```bash
docker-compose build
docker-compose up -d
```

**4. Check container status**:
```bash
docker-compose ps
docker-compose logs -f
```

**5. Initialize database**:
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data (if needed)
docker-compose exec backend npm run seed
```

**6. Verify deployment**:
```bash
curl http://localhost/health
curl http://localhost/api/v1/health
```

---

### Updating Deployment

**1. Pull latest changes**:
```bash
cd /opt/reconciliation-app
git pull origin main
```

**2. Rebuild and restart containers**:
```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Or rebuild all
docker-compose down
docker-compose build
docker-compose up -d
```

**3. Run database migrations** (if any):
```bash
docker-compose exec backend npm run migrate
```

**4. Check logs**:
```bash
docker-compose logs -f backend
```

---

## SSL/HTTPS Setup (Let's Encrypt)

### Using Certbot

**1. Install Certbot**:
```bash
apt install certbot python3-certbot-nginx -y
```

**2. Obtain SSL certificate**:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**3. Auto-renewal**:
```bash
# Test renewal
certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
# Verify with:
systemctl status certbot.timer
```

**4. Update nginx config** to use SSL (see commented HTTPS block in nginx.conf above)

**5. Restart nginx**:
```bash
docker-compose restart nginx
```

---

## Database Backups

### Automated Backup Script

Create `/opt/reconciliation-app/scripts/backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/backups"
DB_CONTAINER="reconciliation_db"
DB_NAME="reconciliation_db"
DB_USER="reconciliation_user"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Make executable**:
```bash
chmod +x /opt/reconciliation-app/scripts/backup.sh
```

**Setup cron job** (daily at 2 AM):
```bash
crontab -e

# Add line:
0 2 * * * /opt/reconciliation-app/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Manual Backup

```bash
# Backup
docker exec reconciliation_db pg_dump -U reconciliation_user reconciliation_db > backup.sql

# Restore
docker exec -i reconciliation_db psql -U reconciliation_user reconciliation_db < backup.sql
```

---

## Monitoring & Logging

### View Container Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Container Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df
```

### Health Checks

Setup health check endpoints:

**Backend** (`/api/v1/health`):
```javascript
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
```

**Database check**:
```javascript
app.get('/api/v1/health/db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker ps -a

# Restart container
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

### Database connection errors

```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Connect to database directly
docker exec -it reconciliation_db psql -U reconciliation_user reconciliation_db

# Check environment variables
docker-compose exec backend env | grep DB_
```

### Out of disk space

```bash
# Check disk usage
df -h

# Remove unused Docker resources
docker system prune -a

# Remove old images
docker image prune -a
```

### High memory usage

```bash
# Check resource usage
docker stats

# Restart containers
docker-compose restart

# Limit container resources in docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Database backups automated
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Docker logs configured
- [ ] Health check endpoints working
- [ ] Nginx rate limiting enabled
- [ ] File upload size limits set
- [ ] Error monitoring configured
- [ ] Database migrations tested
- [ ] Reverse proxy configured correctly
- [ ] Static files served efficiently
- [ ] CORS configured properly
- [ ] Secrets not in Git repository
- [ ] Domain DNS configured

---

## Scaling Considerations

### Horizontal Scaling (Future)

**Load Balancer**:
```yaml
# Add multiple backend containers
services:
  backend-1:
    build: ./server
    ...
  backend-2:
    build: ./server
    ...
  nginx:
    # Configure upstream with multiple backends
```

**Database Read Replicas**:
- Use PostgreSQL streaming replication
- Direct read queries to replicas
- Write queries to primary

**Separate AI Service**:
- Run AI service on separate server with GPU
- Use message queue for OCR jobs

---

## Security Best Practices

1. **Never expose database port** publicly
2. **Use strong passwords** for all services
3. **Keep Docker images updated**
4. **Enable firewall** with minimal open ports
5. **Use HTTPS** for all traffic
6. **Rotate JWT secrets** periodically
7. **Implement rate limiting**
8. **Regular security updates**
9. **Monitor failed login attempts**
10. **Backup encryption keys** securely

---

## Quick Commands Reference

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend npm run migrate

# Database backup
docker exec reconciliation_db pg_dump -U reconciliation_user reconciliation_db > backup.sql

# Remove all stopped containers
docker-compose down --remove-orphans

# Check resource usage
docker stats
```

---

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- Nginx Configuration: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
