# stop.ps1
# Script per aturar l'aplicació
param(
    [Parameter(Mandatory=$false)]
    [switch]$DeleteData
)

Write-Host "Stopping Relation Graph Viewer..." -ForegroundColor Cyan
Write-Host ""

if ($DeleteData) {
    Write-Host "WARNING: This will delete all data!" -ForegroundColor Red
    $confirmation = Read-Host "Are you sure? Type 'yes' to confirm"
    if ($confirmation -ne 'yes') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    docker-compose down -v
    Write-Host "Application stopped and data deleted" -ForegroundColor Green
} else {
    docker-compose down
    Write-Host "Application stopped (data preserved)" -ForegroundColor Green
    Write-Host "To delete all data, run: .\stop.ps1 -DeleteData" -ForegroundColor Cyan
}

