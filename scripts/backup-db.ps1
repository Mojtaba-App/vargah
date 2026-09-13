# پشتیبان‌گیری روزانه PostgreSQL — نگهداری ۳۰ نسخه
# Usage: .\scripts\backup-db.ps1

param(
  [string]$DbName = $(if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "db_vargah" }),
  [string]$DbUser = $(if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
  [string]$DbHost = $(if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }),
  [string]$DbPort = $(if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }),
  [int]$RetentionDays = 30
)

$BackupDir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupFile = Join-Path $BackupDir "${DbName}_${Timestamp}.sql"

Write-Host "Backing up $DbName to $BackupFile ..."

$env:PGPASSWORD = $env:POSTGRES_PASSWORD
& pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $BackupFile

if ($LASTEXITCODE -ne 0) {
  Write-Error "Backup failed"
  exit 1
}

$Compressed = "$BackupFile.gz"
if (Get-Command gzip -ErrorAction SilentlyContinue) {
  & gzip -f $BackupFile
  $BackupFile = $Compressed
}

Write-Host "Backup complete: $BackupFile"

Get-ChildItem $BackupDir -Filter "${DbName}_*" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
  Remove-Item -Force

Write-Host "Old backups older than $RetentionDays days removed."
