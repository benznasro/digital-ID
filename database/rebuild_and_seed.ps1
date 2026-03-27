<# 
how to use:
1. Set environment variables for database connection (optional, defaults shown):
   - DB_HOST (default: localhost)
   - DB_PORT (default: 5432)
   - DB_NAME (default: digital_id)
   - DB_USER (default: postgres)
   - DB_PASSWORD (no default, must be set if your database requires authentication)

   //or set them inline when running the script


2. open PowerShell and navigate to the 'database' directory, then run:
    $env:Path += ";C:\Program Files\PostgreSQL\18\bin"
   .\rebuild_and_seed.ps1 
   or with inline env vars:
   .\rebuild_and_seed.ps1 -DbHost localhost -DbPort 5432 -DbName digital_id -DbUser postgres -DbPassword yourpassword
#>

param(
    [string]$DbHost = $env:DB_HOST,
    [int]$DbPort = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 5432 }),
    [string]$DbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { "digital_id" }),
    [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "postgres" }),
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$PythonExe = "python"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $DbHost) {
    $DbHost = "localhost"
}

$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlCmd) {
    throw "psql is not installed or not in PATH. Install PostgreSQL client tools first."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$initSql = Join-Path $PSScriptRoot "init_database.sql"
$seedScript = Join-Path $PSScriptRoot "python _scripts\populate_children.py"

if (-not (Test-Path $initSql)) {
    throw "Missing DDL file: $initSql"
}
if (-not (Test-Path $seedScript)) {
    throw "Missing seed script: $seedScript"
}

if ($DbPassword) {
    $env:PGPASSWORD = $DbPassword
}

Write-Host "[1/3] Resetting public schema in database '$DbName'..."
& $psqlCmd.Source -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

Write-Host "[2/3] Rebuilding schema from init_database.sql..."
& $psqlCmd.Source -h $DbHost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $initSql

Write-Host "[3/3] Running populate_children.py..."
$env:DB_HOST = $DbHost
$env:DB_PORT = [string]$DbPort
$env:DB_NAME = $DbName
$env:DB_USER = $DbUser
$env:DB_PASSWORD = $DbPassword

& $PythonExe $seedScript

Write-Host "Done: reset + rebuild + seed completed."
