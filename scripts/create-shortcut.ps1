$desktopPaths = @(
  [Environment]::GetFolderPath('Desktop'),
  'C:\Users\LENOVO\Desktop'
) | Select-Object -Unique

$startMenuPath = [Environment]::GetFolderPath('Programs')
$targetExe = 'C:\jarvis-an\release\win-unpacked\AKANSHA.exe'
$iconPath = 'C:\jarvis-an\build\icon.ico'

$wscript = New-Object -ComObject WScript.Shell

foreach ($dPath in $desktopPaths) {
  if (Test-Path $dPath) {
    $desktopShortcutPath = Join-Path $dPath 'AKANSHA.lnk'
    $shortcut = $wscript.CreateShortcut($desktopShortcutPath)
    $shortcut.TargetPath = $targetExe
    $shortcut.WorkingDirectory = 'C:\jarvis-an\release\win-unpacked'
    $shortcut.IconLocation = "$iconPath,0"
    $shortcut.Description = 'AKANSHA - Windows AI Operating Layer & Voice Assistant'
    $shortcut.Save()
    Write-Output "Created Desktop Shortcut at: $desktopShortcutPath"
  }
}

# 2. Start Menu Shortcut
$startMenuShortcutPath = Join-Path $startMenuPath 'AKANSHA.lnk'
$smShortcut = $wscript.CreateShortcut($startMenuShortcutPath)
$smShortcut.TargetPath = $targetExe
$smShortcut.WorkingDirectory = 'C:\jarvis-an\release\win-unpacked'
$smShortcut.IconLocation = "$iconPath,0"
$smShortcut.Description = 'AKANSHA - Windows AI Operating Layer & Voice Assistant'
$smShortcut.Save()
Write-Output "Created Start Menu Shortcut at: $startMenuShortcutPath"

