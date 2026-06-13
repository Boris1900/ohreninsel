# Build-Skript: Web-Dateien nach www/ kopieren + Capacitor sync
# Aufruf: .\build-android.ps1

$src = $PSScriptRoot
$www = "$src\www"

# www/ anlegen falls nicht vorhanden
New-Item -ItemType Directory -Force -Path $www        | Out-Null
New-Item -ItemType Directory -Force -Path "$www\Sounds" | Out-Null
New-Item -ItemType Directory -Force -Path "$www\icons"  | Out-Null

Write-Host "Kopiere Web-Dateien nach www/..." -ForegroundColor Cyan

Copy-Item "$src\index.html"                    $www -Force
Copy-Item "$src\style.css"                     $www -Force
Copy-Item "$src\app.js"                        $www -Force
Copy-Item "$src\sw.js"                         $www -Force
Copy-Item "$src\manifest.json"                 $www -Force
Copy-Item "$src\icon-1024.png"                 $www -Force
Copy-Item "$src\icon-192.png"                  $www -Force
Copy-Item "$src\icon-512.png"                  $www -Force
Copy-Item "$src\apple-touch-icon.png"          $www -Force
Copy-Item "$src\ohr3.png"                      $www -Force
Copy-Item "$src\berglandschaft_0.1.jpg"        $www -Force
Copy-Item "$src\meer_0.2.jpg"                  $www -Force
Copy-Item "$src\nacht_meer_0.1.jpg"            $www -Force
Copy-Item "$src\wald_0.1.jpg"                  $www -Force
Copy-Item "$src\bach_0.1.jpg"                  $www -Force
Copy-Item "$src\regen_0.1.jpg"                 $www -Force
Copy-Item "$src\cafe_0.1.jpg"                  $www -Force
Copy-Item "$src\icons\*"                       "$www\icons\" -Force

# Nur mp3 aus Sounds/ – keine Unterordner kopieren
Get-ChildItem "$src\Sounds\*.mp3" | Copy-Item -Destination "$www\Sounds\" -Force

Write-Host "Starte Capacitor Sync..." -ForegroundColor Cyan
Set-Location $src
npx cap sync android

Write-Host ""
Write-Host "Fertig! Jetzt in Android Studio:" -ForegroundColor Green
Write-Host "  Shift+Shift -> 'Generate APKs' -> warten -> APK umbenennen" -ForegroundColor Green
