# Clean unnecessary files from node_modules to reduce installer size and speed
# Usage: powershell -ExecutionPolicy Bypass -File clean-node-modules.ps1
# IMPORTANT: Only delete files that are DEFINITELY not needed for runtime!

param(
    [string]$Path = "packaged-openclaw\node_modules"
)

Write-Host "Cleaning node_modules in $Path..." -ForegroundColor Yellow

if (-not (Test-Path $Path)) {
    Write-Host "Path not found: $Path" -ForegroundColor Red
    exit 1
}

$beforeCount = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue).Count
$beforeSize = [math]::Round((Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "Before: $beforeCount files, $beforeSize MB" -ForegroundColor Cyan

# SAFE folders to delete (only at package root level, not inside dist/src/lib)
# These are typically documentation/test folders at the package root
$safeFoldersAtRoot = @("test", "tests", "__tests__", "spec", "specs", "__mocks__", 
                        "docs", "example", "examples", "demo", "benchmark", "benchmarks", 
                        ".github", ".circleci", "coverage", ".nyc_output", ".idea", ".vscode")

foreach ($folder in $safeFoldersAtRoot) {
    # Only delete if the folder is directly under a package (node_modules/pkg/folder)
    # NOT if it's inside dist, src, lib, etc.
    Get-ChildItem -Path $Path -Directory -Filter $folder -ErrorAction SilentlyContinue | ForEach-Object {
        $parent = Split-Path $_.Parent.FullName -Leaf
        # Only delete if parent is the package root (not dist, src, lib, etc.)
        if ($parent -notmatch '^(dist|src|lib|build|out|esm|cjs|module)$') {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# SAFE file patterns to delete
$safeFilePatterns = @(
    "*.d.ts",           # TypeScript definitions (not needed at runtime)
    "*.d.ts.map",       # Definition maps
    "*.d.mts",
    "*.d.cts",
    "*.js.map",         # Source maps (not needed at runtime)
    "*.ts.map",
    "*.map",            # All source maps
    "*.ts",             # TypeScript source files (compiled to .js)
    "*.tsx",            # TypeScript JSX files
    "*.mdx",            # MDX documentation
    "*.yml",            # YAML config files (not needed at runtime)
    "*.yaml",
    "*.ps1",            # PowerShell scripts
    "*.cmd",            # Windows batch scripts (not needed for node)
    "*.sh",             # Shell scripts
    "*.coffee",         # CoffeeScript source
    "*.scss",           # SCSS source
    "*.less",           # LESS source
    "*.bcmap"           # Source maps for PDF.js etc
)

foreach ($pattern in $safeFilePatterns) {
    Get-ChildItem -Path $Path -File -Recurse -Filter $pattern -ErrorAction SilentlyContinue |
        ForEach-Object {
            Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
        }
}

# Delete documentation files (but be careful with names that might be code)
$docPatterns = @("*.md", "*.markdown")
foreach ($pattern in $docPatterns) {
    Get-ChildItem -Path $Path -File -Recurse -Filter $pattern -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch "^package" } |
        ForEach-Object {
            Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
        }
}

# Delete config files that are definitely not needed at runtime
$configFiles = @(
    ".eslintrc*", ".prettierrc*", ".editorconfig", ".gitignore", ".npmignore",
    ".travis.yml", "tsconfig*.json", "jest.config*", "karma.conf*",
    ".babelrc*", "babel.config*", "rollup.config*", "webpack.config*", "vite.config*",
    "Makefile", "Gruntfile*", "Gulpfile*", "*.gyp", "*.gypi", "binding.gyp",
    ".npmrc", ".yarnrc", ".nvmrc", "yarn.lock", "pnpm-lock.yaml"
)
foreach ($pattern in $configFiles) {
    Get-ChildItem -Path $Path -File -Recurse -Filter $pattern -ErrorAction SilentlyContinue |
        ForEach-Object {
            Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
        }
}

# Delete empty directories
$passes = 0
do {
    $emptyDirs = @(Get-ChildItem -Path $Path -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { (Get-ChildItem -Path $_.FullName -Force -ErrorAction SilentlyContinue).Count -eq 0 })
    $emptyDirs | ForEach-Object { Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue }
    $passes++
} while ($emptyDirs.Count -gt 0 -and $passes -lt 10)

$afterCount = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue).Count
$afterSize = [math]::Round((Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "After:  $afterCount files, $afterSize MB" -ForegroundColor Green
Write-Host "Saved:  $($beforeCount - $afterCount) files, $([math]::Round($beforeSize - $afterSize, 2)) MB" -ForegroundColor Yellow
