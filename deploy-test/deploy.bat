@echo off
echo 🚀 Building and deploying Invoice OCR Demo...

REM Build frontend
echo 📦 Building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM Build and start Docker containers
echo 🐳 Starting Docker containers...
docker-compose down
docker-compose build
docker-compose up -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo 🎉 Deployment complete!
echo.
echo 📱 Access the application at: http://localhost
echo 🔧 View logs: docker-compose logs -f
echo 🛑 Stop services: docker-compose down
echo.
pause
