# PowerShell script to update API URL in all frontend files
# Usage: .\update-api-url.ps1 "https://your-backend-url.onrender.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewApiUrl
)

$frontendPath = ".\frontend"
$files = @("login.html", "dashboard.html", "intake.html", "roadmap.html", "admin.html")

Write-Host "Updating API URL to: $NewApiUrl" -ForegroundColor Green
Write-Host ""

foreach ($file in $files) {
    $filePath = Join-Path $frontendPath $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $filePath -Raw
        
        # Replace localhost URL with new URL
        $content = $content -replace "http://localhost:5000", $NewApiUrl
        
        # Save the file
        Set-Content $filePath $content -NoNewline
        
        Write-Host "  ✓ Updated successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "All files updated! Don't forget to commit and push changes." -ForegroundColor Cyan
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Update API URL for production'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
