
# ============================================================
# Product Roadmap - Manual Deployment Script
# Usage: .\deploy.ps1
# Pushes latest code to Bitbucket and GitHub
# ============================================================

param(
    [string]$CommitMessage = ""
)

$BB_REPO = "product-roadmap-bb"
$GH_REPO = "carelonrx-roadmap"
$BB_PATH = "C:\Users\al51227\CascadeProjects\$BB_REPO"
$GH_PATH = "C:\Users\al51227\CascadeProjects\$GH_REPO"
$BB_REMOTE = "https://bitbucket.elevancehealth.com/scm/iscp/product-roadmap.git"
$GH_REMOTE = "https://github.com/gdbansal/carelonrx-roadmap.git"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Product Roadmap Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Commit message ----
if (-not $CommitMessage) {
    $CommitMessage = Read-Host "Enter commit message"
    if (-not $CommitMessage) { $CommitMessage = "chore: manual deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
}

# ---- Bitbucket credentials ----
Write-Host ""
Write-Host "--- Bitbucket Credentials ---" -ForegroundColor Yellow
$bbUser = Read-Host "Bitbucket username (default: AL51227)"
if (-not $bbUser) { $bbUser = "AL51227" }
$bbPatRaw = Read-Host "Bitbucket PAT" -AsSecureString
$bbPat = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($bbPatRaw))
$bbPatEncoded = [Uri]::EscapeDataString($bbPat)

# ---- GitHub credentials ----
Write-Host ""
Write-Host "--- GitHub Credentials ---" -ForegroundColor Yellow
$ghUser = Read-Host "GitHub username (default: subramanyamkwsrk)"
if (-not $ghUser) { $ghUser = "subramanyamkwsrk" }
$ghPatRaw = Read-Host "GitHub PAT" -AsSecureString
$ghPat = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ghPatRaw))

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 1: Sync frontend files BB -> GH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Sync all frontend html/js/css from BB to GH
$syncItems = @("frontend", "backend", "package.json", "package-lock.json")
foreach ($item in $syncItems) {
    $src = "$BB_PATH\$item"
    $dst = "$GH_PATH\$item"
    if (Test-Path $src) {
        Copy-Item $src $dst -Recurse -Force
        Write-Host "  Synced: $item" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 2: Commit Bitbucket (master)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

git -C $BB_PATH add -A
$bbStatus = git -C $BB_PATH status --porcelain
if ($bbStatus) {
    git -C $BB_PATH commit -m $CommitMessage
    Write-Host "  Committed to Bitbucket local" -ForegroundColor Green
} else {
    Write-Host "  Nothing new to commit on Bitbucket" -ForegroundColor Yellow
}

Write-Host "  Pushing to Bitbucket..." -ForegroundColor Cyan
$bbUrl = "https://${bbUser}:${bbPatEncoded}@bitbucket.elevancehealth.com/scm/iscp/product-roadmap.git"
$bbResult = git -C $BB_PATH push $bbUrl master 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Bitbucket push SUCCESS" -ForegroundColor Green
} else {
    Write-Host "  Bitbucket push FAILED: $bbResult" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 3: Commit GitHub (main)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

git -C $GH_PATH add -A
$ghStatus = git -C $GH_PATH status --porcelain
if ($ghStatus) {
    git -C $GH_PATH commit -m $CommitMessage
    Write-Host "  Committed to GitHub local" -ForegroundColor Green
} else {
    Write-Host "  Nothing new to commit on GitHub" -ForegroundColor Yellow
}

Write-Host "  Pushing to GitHub..." -ForegroundColor Cyan
$ghUrl = "https://${ghUser}:${ghPat}@github.com/gdbansal/carelonrx-roadmap.git"
$ghResult = git -C $GH_PATH push $ghUrl main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  GitHub push SUCCESS" -ForegroundColor Green
} else {
    Write-Host "  GitHub push FAILED: $ghResult" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Commit : $CommitMessage"
Write-Host "  BB HEAD: $(git -C $BB_PATH rev-parse --short HEAD)"
Write-Host "  GH HEAD: $(git -C $GH_PATH rev-parse --short HEAD)"
Write-Host ""
Write-Host "  NEXT: Pull latest on server and restart Node:" -ForegroundColor Yellow
Write-Host "    ssh user@10.188.102.44" -ForegroundColor White
Write-Host "    cd /path/to/app && git pull && pm2 restart all" -ForegroundColor White
Write-Host ""
