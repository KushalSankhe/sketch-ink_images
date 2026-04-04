# ============================================================
#  convert_to_webp.ps1
#  Run this INSIDE your image repo folder (sketch-ink_images)
#  It will:
#    1. Download & install cwebp (no manual install needed)
#    2. Create + switch to 'webp' branch
#    3. Convert every .jpg / .png to .webp
#    4. Delete the original .jpg / .png files
#    5. Commit and show a summary
#
#  HOW TO RUN:
#    1. Open PowerShell in your image repo folder
#    2. If needed, allow scripts:
#         Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
#    3. Run:
#         .\convert_to_webp.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# Config
$QUALITY      = 82
$CWEBP_DIR    = "$env:TEMP\cwebp"
$CWEBP_EXE    = "$CWEBP_DIR\cwebp.exe"
$LIBWEBP_URL  = "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0-windows-x64.zip"
$LIBWEBP_ZIP  = "$env:TEMP\libwebp.zip"

# Helpers
function Info   ($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Ok     ($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn   ($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Err    ($msg) { Write-Host "  [ERR] $msg" -ForegroundColor Red }
function Header ($msg) { Write-Host "" ; Write-Host $msg -ForegroundColor White }

# STEP 1 - Download cwebp
Header "[ 1/5 ] Checking cwebp..."

if (-Not (Test-Path $CWEBP_EXE)) {
    Info "cwebp not found. Downloading from Google..."
    Invoke-WebRequest -Uri $LIBWEBP_URL -OutFile $LIBWEBP_ZIP -UseBasicParsing
    Info "Extracting..."
    Expand-Archive -Path $LIBWEBP_ZIP -DestinationPath $CWEBP_DIR -Force

    $found = Get-ChildItem -Path $CWEBP_DIR -Recurse -Filter "cwebp.exe" | Select-Object -First 1
    if (-Not $found) {
        Err "cwebp.exe not found after extraction. Exiting."
        exit 1
    }
    if ($found.FullName -ne $CWEBP_EXE) {
        Copy-Item $found.FullName $CWEBP_EXE -Force
    }
    Ok "cwebp downloaded to $CWEBP_EXE"
} else {
    Ok "cwebp already present at $CWEBP_EXE"
}

# STEP 2 - Git branch
Header "[ 2/5 ] Setting up git branch..."

if (-Not (Test-Path ".git")) {
    Err "No .git folder found. Run this from inside your image repo!"
    exit 1
}

$currentBranch = git rev-parse --abbrev-ref HEAD
Info "Current branch: $currentBranch"

$branchExists = git branch --list "webp"
if ($branchExists) {
    Warn "Branch 'webp' already exists. Switching to it..."
    git checkout webp
} else {
    Info "Creating new branch 'webp'..."
    git checkout -b webp
    Ok "Branch 'webp' created and checked out"
}

# STEP 3 - Find all images
Header "[ 3/5 ] Scanning for images..."

$allImages = Get-ChildItem -Recurse -Include "*.jpg","*.jpeg","*.png" |
    Where-Object { $_.FullName -notlike "*\.git\*" }

$total = $allImages.Count
Info "Found $total images to convert"

if ($total -eq 0) {
    Warn "No images found. Are you in the right folder?"
    exit 0
}

# STEP 4 - Convert
Header "[ 4/5 ] Converting to WebP (quality=$QUALITY)..."

$converted  = 0
$failed     = 0
$savedBytes = 0

foreach ($img in $allImages) {
    $outPath = [System.IO.Path]::ChangeExtension($img.FullName, ".webp")

    $result = & $CWEBP_EXE -q $QUALITY -quiet "$($img.FullName)" -o "$outPath" 2>&1

    if ($LASTEXITCODE -eq 0 -and (Test-Path $outPath)) {
        $originalSize = $img.Length
        $newSize      = (Get-Item $outPath).Length
        $saved        = $originalSize - $newSize
        $savedBytes  += $saved
        $pct          = [math]::Round(($saved / $originalSize) * 100, 1)

        Remove-Item $img.FullName -Force

        $converted++
        $relPath = $img.FullName.Replace((Get-Location).Path + "\", "")
        Write-Host "  [DONE] $relPath (-$pct%)" -ForegroundColor DarkGreen
    } else {
        $failed++
        Warn "FAILED: $($img.Name)"
        if ($result) { Write-Host "         $result" -ForegroundColor DarkYellow }
    }
}

# STEP 5 - Git commit
Header "[ 5/5 ] Committing..."

git add -A

$savedMB    = [math]::Round($savedBytes / 1MB, 2)
$commitMsg  = "convert: $converted images jpg/png to webp, saved ${savedMB}MB"
git commit -m $commitMsg

# Summary
Header "==================== DONE ===================="
Ok "Converted  : $converted images"
if ($failed -gt 0) {
    Warn "Failed     : $failed images (check output above)"
}
Ok "Space saved: ${savedMB} MB"
Ok "Branch     : webp (committed locally)"

Write-Host ""
Write-Host "  Next - push to GitHub:" -ForegroundColor White
Write-Host "  git push origin webp" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Then in images.js change CDN_BASE from @main to @webp" -ForegroundColor White
Write-Host "  And update all .jpg to .webp in FOLDER_IMAGE_COUNTS" -ForegroundColor White
Write-Host ""
