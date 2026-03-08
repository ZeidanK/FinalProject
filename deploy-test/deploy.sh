#!/bin/bash

echo "🚀 Building and deploying Invoice OCR Demo..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build and start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose down
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
echo "🔍 Checking service health..."

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend health check failed (Status: $BACKEND_STATUS)"
fi

# Check AI service
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$AI_STATUS" = "200" ]; then
    echo "✅ AI Service is running"
else
    echo "❌ AI Service health check failed (Status: $AI_STATUS)"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📱 Access the application at: http://localhost"
echo "🔧 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
