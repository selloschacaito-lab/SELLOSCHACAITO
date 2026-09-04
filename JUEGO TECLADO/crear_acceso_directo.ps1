$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path $DesktopPath "GRAVY PROTOCOL - Cyberpunk Typing.lnk"
$TargetPath = "C:\Users\User\Documents\JUEGO TECLADO\dist\GravyProtocol.exe"
$WorkingDir = "C:\Users\User\Documents\JUEGO TECLADO\dist"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $WorkingDir
$Shortcut.Description = "Juego de mecanografía táctil Cyberpunk e IA - GRAVY PROTOCOL"
$Shortcut.Save()

Write-Host "[OK] Acceso directo creado exitosamente en el Escritorio: $ShortcutPath"
