# Build-Skript: Web-Dateien nach www/ kopieren + Capacitor sync
# Aufruf: .\build-android.ps1

$src = $PSScriptRoot
$www = "$src\www"

Write-Host "Kopiere Web-Dateien nach www/..." -ForegroundColor Cyan

Copy-Item "$src\index.html"                    $www -Force
Copy-Item "$src\style.css"                     $www -Force
Copy-Item "$src\app.js"                        $www -Force
Copy-Item "$src\sw.js"                         $www -Force
Copy-Item "$src\manifest.json"                 $www -Force
Copy-Item "$src\background.jpg"                $www -Force
Copy-Item "$src\background_laecheln_v0.4.jpg"  $www -Force
Copy-Item "$src\berglandschaft_0.1.jpg"        $www -Force
Copy-Item "$src\meer_0.2.jpg"                 $www -Force
Copy-Item "$src\gong.png"                      $www -Force
Copy-Item "$src\gong_ohne_halter.png"          $www -Force
Copy-Item "$src\Sounds\*"                      "$www\Sounds\" -Force

Write-Host "Starte Capacitor Sync..." -ForegroundColor Cyan
npx cap sync android

Write-Host ""
Write-Host "Fertig! Jetzt in Android Studio:" -ForegroundColor Green
Write-Host "  Shift+Shift -> 'Generate APKs' -> warten -> APK umbenennen" -ForegroundColor Green
