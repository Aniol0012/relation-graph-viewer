# start.ps1
Write-Host "Starting Relation Graph Viewer..." -ForegroundColor Cyan

try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "ERROR: docker-compose.yml not found." -ForegroundColor Red
    Write-Host "Run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Application started." -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:8001" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Cyan
    Write-Host "  View logs:  docker-compose logs -f" -ForegroundColor White
    Write-Host "  Stop app:   docker-compose down" -ForegroundColor White
    Write-Host ""
    
    Start-Sleep -Seconds 3
    
    try {
        Start-Process "http://localhost:3000"
    } catch {
        Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Cyan
    }
} else {
    Write-Host ""3
    Write-Host "ERROR: Failed to start application" -ForegroundColor Red
    Write-Host "Check logs: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

