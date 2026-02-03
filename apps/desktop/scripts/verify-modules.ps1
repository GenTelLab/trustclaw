# Verify node_modules integrity before packaging
# This script checks that all required modules and their dependencies are complete

param(
    [string]$Path = "packaged-openclaw"
)

$ErrorActionPreference = "Stop"
$nodeModulesPath = "$Path\node_modules"
$distPath = "$Path\dist"

Write-Host "Verifying module integrity in $Path..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Check that node_modules exists
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "ERROR: node_modules not found at $nodeModulesPath" -ForegroundColor Red
    exit 1
}

# Check that dist exists
if (-not (Test-Path $distPath)) {
    Write-Host "ERROR: dist not found at $distPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Checking critical packages..." -ForegroundColor Yellow

# Critical packages that MUST exist with package.json
$criticalPackages = @(
    "chalk",
    "commander", 
    "express",
    "ws",
    "ajv",
    "zod",
    "yaml",
    "jiti",
    "dotenv",
    "tslog",
    "@sinclair/typebox",
    "@mariozechner/pi-agent-core",
    "@mariozechner/pi-ai",
    "@mariozechner/pi-coding-agent",
    "@mariozechner/pi-tui",
    "@mariozechner/jiti"
)

foreach ($pkg in $criticalPackages) {
    $pkgPath = "$nodeModulesPath\$($pkg -replace '/', '\')"
    $pkgJsonPath = "$pkgPath\package.json"
    
    if (-not (Test-Path $pkgPath)) {
        $errors += "MISSING: $pkg (directory not found)"
    } elseif (-not (Test-Path $pkgJsonPath)) {
        $errors += "INCOMPLETE: $pkg (missing package.json)"
    } else {
        Write-Host "  OK: $pkg" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "[2/4] Checking internal dependencies..." -ForegroundColor Yellow

# Check that yaml/dist/doc exists (this was previously deleted by mistake)
$yamlDocPath = "$nodeModulesPath\yaml\dist\doc"
if (-not (Test-Path $yamlDocPath)) {
    $errors += "INCOMPLETE: yaml (missing dist/doc directory)"
} else {
    Write-Host "  OK: yaml/dist/doc" -ForegroundColor DarkGray
}

# Check @mariozechner/pi-coding-agent internal files
$piCodingAgentFiles = @(
    "dist\utils\changelog.js",
    "dist\core\extensions\loader.js",
    "dist\modes\interactive\interactive-mode.js"
)
foreach ($file in $piCodingAgentFiles) {
    $filePath = "$nodeModulesPath\@mariozechner\pi-coding-agent\$file"
    if (-not (Test-Path $filePath)) {
        $errors += "INCOMPLETE: @mariozechner/pi-coding-agent (missing $file)"
    } else {
        Write-Host "  OK: @mariozechner/pi-coding-agent/$file" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "[3/4] Checking native modules..." -ForegroundColor Yellow

# Native modules for Windows
$nativeModules = @(
    "sharp",
    "@img\sharp-win32-x64",
    "sqlite-vec",
    "sqlite-vec-windows-x64",
    "@lydell\node-pty",
    "@lydell\node-pty-win32-x64"
)

foreach ($mod in $nativeModules) {
    $modPath = "$nodeModulesPath\$mod"
    if (-not (Test-Path $modPath)) {
        $warnings += "MISSING NATIVE: $mod (may be optional)"
    } else {
        Write-Host "  OK: $mod" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "[4/4] Testing module resolution..." -ForegroundColor Yellow

# Create a test script to verify modules can be loaded
$testScript = @"
const path = require('path');
const fs = require('fs');

// Set NODE_PATH to the packaged node_modules
process.env.NODE_PATH = path.resolve('$($nodeModulesPath -replace '\\', '/')');
require('module').Module._initPaths();

const errors = [];

// Test critical ESM imports by checking their main entry points
const packagesToTest = [
    { name: 'chalk', entry: 'source/index.js' },
    { name: 'yaml', entry: 'dist/index.js' },
    { name: 'commander', entry: 'lib/command.js' },
    { name: 'ajv', entry: 'dist/ajv.js' },
    { name: 'zod', entry: 'lib/index.js' }
];

for (const pkg of packagesToTest) {
    const pkgPath = path.join('$($nodeModulesPath -replace '\\', '/')', pkg.name);
    const entryPath = path.join(pkgPath, pkg.entry);
    
    if (!fs.existsSync(pkgPath)) {
        errors.push('MISSING: ' + pkg.name);
    } else if (!fs.existsSync(entryPath)) {
        // Try package.json main field
        const pkgJsonPath = path.join(pkgPath, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            const mainEntry = pkgJson.main || pkgJson.module || 'index.js';
            const mainPath = path.join(pkgPath, mainEntry);
            if (!fs.existsSync(mainPath)) {
                errors.push('INCOMPLETE: ' + pkg.name + ' (entry point not found)');
            }
        } else {
            errors.push('INCOMPLETE: ' + pkg.name + ' (no package.json)');
        }
    }
}

if (errors.length > 0) {
    console.log('ERRORS:');
    errors.forEach(e => console.log('  ' + e));
    process.exit(1);
} else {
    console.log('  Module resolution test passed');
    process.exit(0);
}
"@

$testScriptPath = "$env:TEMP\verify-modules-test.js"
$testScript | Out-File -FilePath $testScriptPath -Encoding UTF8

try {
    $result = & node $testScriptPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        $errors += "Module resolution test failed: $result"
    } else {
        Write-Host $result -ForegroundColor DarkGray
    }
} catch {
    $errors += "Module resolution test error: $_"
} finally {
    Remove-Item $testScriptPath -ErrorAction SilentlyContinue
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "ERRORS ($($errors.Count)):" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warn in $warnings) {
        Write-Host "  - $warn" -ForegroundColor Yellow
    }
}

if ($errors.Count -eq 0) {
    Write-Host ""
    Write-Host "All checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "Verification FAILED! Fix the errors before packaging." -ForegroundColor Red
    exit 1
}
