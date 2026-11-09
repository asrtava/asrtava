# ==============================================================================
# ASRTAVA PowerShell Database Migration Runner
# Executes all 36 relational migrations in strict numerical order on Windows
# ==============================================================================

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "asrtava_prod",
    [string]$DbUser = "asrtava_admin",
    [string]$DbPassword = $env:DB_PASSWORD
)

if (-not $DbPassword) {
    $DbPassword = "AsrtavaSecure2026!"
}

$env:PGPASSWORD = $DbPassword
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MigrationsDir = Join-Path (Split-Path -Parent $ScriptDir) "database\migrations"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "ASRTAVA Windows Database Migration Engine" -ForegroundColor Cyan
Write-Host "Target: ${DbUser}@${DbHost}:${DbPort}/${DbName}" -ForegroundColor DarkGray
Write-Host "Directory: ${MigrationsDir}" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan

# Ensure schema_migrations table exists
$InitSql = "CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, filename VARCHAR(255) NOT NULL UNIQUE, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"
& psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $InitSql

$MigrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
$Applied = 0
$Skipped = 0

foreach ($file in $MigrationFiles) {
    $filename = $file.Name
    $checkQuery = "SELECT COUNT(1) FROM schema_migrations WHERE filename = '$filename';"
    $result = (& psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -A -c $checkQuery).Trim()

    if ($result -eq "0") {
        Write-Host "Applying: $filename ..." -ForegroundColor Yellow
        & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $file.FullName -v ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Migration failed on $filename. Aborting sequence."
            exit 1
        }
        $recordSql = "INSERT INTO schema_migrations (filename) VALUES ('$filename');"
        & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $recordSql
        Write-Host "✓ $filename applied." -ForegroundColor Green
        $Applied++
    } else {
        $Skipped++
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Migration Finished: $Applied applied, $Skipped verified up-to-date." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

