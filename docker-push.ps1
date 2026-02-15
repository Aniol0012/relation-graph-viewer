# docker-push.ps1
# Example: .\docker-push.ps1 -username aniol0012 -version v1.0.0

param(
    [Parameter(Mandatory=$true)]
    [string]$username,
    
    [Parameter(Mandatory=$false)]
    [string]$version = "latest"
)

Write-Host "Building and pushing Docker images..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: docker-compose.yml not found. Run this script from the project root." -ForegroundColor Red
    exit 1
}

# Backend
Write-Host "Building backend image..." -ForegroundColor Yellow
Set-Location backend
docker build -t ${username}/relation-graph-backend:latest -t ${username}/relation-graph-backend:${version} .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Backend build failed" -ForegroundColor Red
    exit $LASTEXITCODE 
}

Write-Host "Pushing backend to Docker Hub..." -ForegroundColor Yellow
docker push ${username}/relation-graph-backend:latest
docker push ${username}/relation-graph-backend:${version}
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Backend push failed" -ForegroundColor Red
    exit $LASTEXITCODE 
}
Write-Host "Backend pushed successfully" -ForegroundColor Green
Write-Host ""

# Frontend
Write-Host "Building frontend image..." -ForegroundColor Yellow
Set-Location ../frontend
docker build -t ${username}/relation-graph-frontend:latest -t ${username}/relation-graph-frontend:${version} .
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit $LASTEXITCODE 
}

Write-Host "Pushing frontend to Docker Hub..." -ForegroundColor Yellow
docker push ${username}/relation-graph-frontend:latest
docker push ${username}/relation-graph-frontend:${version}
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Frontend push failed" -ForegroundColor Red
    exit $LASTEXITCODE 
}
Write-Host "Frontend pushed successfully" -ForegroundColor Green
Write-Host ""

Set-Location ..

Write-Host "All images pushed successfully to Docker Hub!" -ForegroundColor Green
Write-Host ""
Write-Host "Images:" -ForegroundColor Cyan
Write-Host "  - ${username}/relation-graph-backend:${version}" -ForegroundColor White
Write-Host "  - ${username}/relation-graph-backend:latest" -ForegroundColor White
Write-Host "  - ${username}/relation-graph-frontend:${version}" -ForegroundColor White
Write-Host "  - ${username}/relation-graph-frontend:latest" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update docker-compose.prod.yml with your username" -ForegroundColor White
Write-Host "  2. Share docker-compose.prod.yml with your team" -ForegroundColor White
Write-Host "  3. Run: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor White

