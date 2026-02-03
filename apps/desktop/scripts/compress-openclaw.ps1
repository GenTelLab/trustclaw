# Compress packaged-openclaw into a single archive for faster installation
# Usage: powershell -ExecutionPolicy Bypass -File compress-openclaw.ps1

param(
    [string]$SourcePath = "packaged-openclaw",
    [string]$OutputPath = "packaged-openclaw.7z"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Split-Path -Parent $scriptDir
$sourceFull = Join-Path $appDir $SourcePath
$outputFull = Join-Path $appDir $OutputPath

Write-Host "Compressing $SourcePath to $OutputPath..." -ForegroundColor Cyan

if (-not (Test-Path $sourceFull)) {
    Write-Host "ERROR: Source path not found: $sourceFull" -ForegroundColor Red
    exit 1
}

# Remove existing archive
if (Test-Path $outputFull) {
    Remove-Item $outputFull -Force
}

# Try to find 7-Zip
$sevenZipPaths = @(
    "C:\Program Files\7-Zip\7z.exe",
    "C:\Program Files (x86)\7-Zip\7z.exe",
    "$env:LOCALAPPDATA\Programs\7-Zip\7z.exe"
)

$sevenZip = $null
foreach ($path in $sevenZipPaths) {
    if (Test-Path $path) {
        $sevenZip = $path
        break
    }
}

if ($sevenZip) {
    Write-Host "Using 7-Zip: $sevenZip" -ForegroundColor Gray
    
    # Use 7-Zip with LZMA2 compression (fast decompression)
    # -mx=5: Normal compression (good balance of speed and size)
    # -mmt=on: Multi-threading
    & $sevenZip a -t7z -mx=5 -mmt=on $outputFull "$sourceFull\*" | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $archiveSize = [math]::Round((Get-Item $outputFull).Length / 1MB, 2)
        $sourceSize = [math]::Round((Get-ChildItem -Path $sourceFull -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        Write-Host "Compressed: $sourceSize MB -> $archiveSize MB" -ForegroundColor Green
    } else {
        Write-Host "ERROR: 7-Zip compression failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "7-Zip not found, using built-in compression (slower)..." -ForegroundColor Yellow
    
    # Fallback to PowerShell's built-in compression
    $zipPath = $outputFull -replace '\.7z$', '.zip'
    Compress-Archive -Path "$sourceFull\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force
    
    if (Test-Path $zipPath) {
        # Rename to .7z (it's actually a zip but we'll handle it)
        if ($zipPath -ne $outputFull) {
            Move-Item $zipPath $outputFull -Force
        }
        $archiveSize = [math]::Round((Get-Item $outputFull).Length / 1MB, 2)
        Write-Host "Compressed to: $archiveSize MB" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Compression failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Done!" -ForegroundColor Green
