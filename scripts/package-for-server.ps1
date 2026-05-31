$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseDir = Join-Path $ProjectRoot "release"
$StageDir = Join-Path $ReleaseDir "personal-room"
$ZipPath = Join-Path $ReleaseDir "personal-room-deploy.zip"

$excludedTopLevel = @(
  ".git",
  ".next",
  "node_modules",
  "data",
  "backups",
  "release"
)

$excludedFiles = @(
  ".env",
  ".env.local",
  ".env.production"
)

if (Test-Path $StageDir) {
  Remove-Item -LiteralPath $StageDir -Recurse -Force
}

if (Test-Path $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

New-Item -ItemType Directory -Force -Path $StageDir | Out-Null

Get-ChildItem -LiteralPath $ProjectRoot -Force | ForEach-Object {
  if ($excludedTopLevel -contains $_.Name) {
    return
  }

  if ($excludedFiles -contains $_.Name) {
    return
  }

  Copy-Item -LiteralPath $_.FullName -Destination $StageDir -Recurse -Force
}

Get-ChildItem -LiteralPath $StageDir -Recurse -File |
  Where-Object { $_.Extension -in @(".sh", ".conf", ".service", ".sql") } |
  ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    $content = $content -replace "`r`n", "`n"
    $content = $content -replace "`r", "`n"
    [System.IO.File]::WriteAllText($_.FullName, $content, [System.Text.UTF8Encoding]::new($false))
  }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $StageDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($StageDir.Length).TrimStart("\", "/")
    $entryName = $relativePath.Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
  }
}
finally {
  $zip.Dispose()
}

Write-Host "Release package created:"
Write-Host $ZipPath
Write-Host ""
Write-Host "Upload it to the server, then run:"
Write-Host "  unzip -o personal-room-deploy.zip -d /home/ubuntu/apps/personal-room"
Write-Host "  cd /home/ubuntu/apps/personal-room"
Write-Host "  chmod +x deploy/*.sh"
Write-Host "  ./deploy/diagnose-502.sh"
