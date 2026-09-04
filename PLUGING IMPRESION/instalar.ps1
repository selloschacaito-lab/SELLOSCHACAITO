# Habilitar PlayerDebugMode
Write-Host "Habilitando PlayerDebugMode para CEP..." -ForegroundColor Cyan
6..16 | ForEach-Object {
    $version = $_
    $regPath = "HKCU:\Software\Adobe\CSXS.$version"
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
    }
    Set-ItemProperty -Path $regPath -Name "PlayerDebugMode" -Value "1" -Force
}

# Copiar archivos a la carpeta de extensiones CEP
$appData = [System.Environment]::GetFolderPath('ApplicationData')
$targetDir = Join-Path $appData "Adobe\CEP\extensions\com.selloschacaito.impresion"

Write-Host "Instalando extension en: $targetDir" -ForegroundColor Cyan
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$sourceDir = $PSScriptRoot

Copy-Item -Path (Join-Path $sourceDir "CSXS") -Destination $targetDir -Recurse -Force
Copy-Item -Path (Join-Path $sourceDir "css") -Destination $targetDir -Recurse -Force
Copy-Item -Path (Join-Path $sourceDir "js") -Destination $targetDir -Recurse -Force
Copy-Item -Path (Join-Path $sourceDir "jsx") -Destination $targetDir -Recurse -Force
Copy-Item -Path (Join-Path $sourceDir "index.html") -Destination $targetDir -Force

Write-Host "`nExtension instalada con exito." -ForegroundColor Green
Get-ChildItem -Path $targetDir
