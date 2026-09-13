# فشرده‌سازی PDF شماره‌های ماهنامه — کیفیت ebook (بدون افت محسوس)
# نیاز: Ghostscript نصب‌شده (gswin64c در Windows)
# Usage: .\scripts\compress-pdf.ps1 -InputFile ".\issue.pdf"

param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,
  [string]$OutputFile = "",
  [ValidateSet('ebook', 'printer', 'screen')]
  [string]$Quality = 'ebook'
)

if (-not (Test-Path $InputFile)) {
  Write-Error "Input file not found: $InputFile"
  exit 1
}

if (-not $OutputFile) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
  $dir = [System.IO.Path]::GetDirectoryName($InputFile)
  $OutputFile = Join-Path $dir "${base}-compressed.pdf"
}

$gs = Get-Command gswin64c -ErrorAction SilentlyContinue
if (-not $gs) {
  $gs = Get-Command gs -ErrorAction SilentlyContinue
}

if (-not $gs) {
  Write-Error "Ghostscript not found. Install from https://ghostscript.com/releases/gsdnld.html"
  exit 1
}

Write-Host "Compressing $InputFile -> $OutputFile (quality: $Quality)"

& $gs.Name -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/$Quality `
  -dNOPAUSE -dQUIET -dBATCH `
  -sOutputFile=$OutputFile $InputFile

if ($LASTEXITCODE -ne 0) {
  Write-Error "Compression failed"
  exit 1
}

$before = (Get-Item $InputFile).Length
$after = (Get-Item $OutputFile).Length
$saved = [math]::Round((1 - $after / $before) * 100, 1)

Write-Host "Done. $before bytes -> $after bytes (${saved}% smaller)"
