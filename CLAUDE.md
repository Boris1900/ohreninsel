# TinnitusMediApp – Projektdokumentation

**Produktname:** Ohreninsel | **Stand:** v0.9.30 (15.06.2026, Wake Lock gegen Timer-Einfrieren)

**PWA live:** https://boris1900.github.io/ohreninsel/ (GitHub Pages, master-Branch)
Für iPhone (Katharina): URL in Safari → Teilen → Zum Startbildschirm.

---

## Entscheidungs-Kompass

```
Wert = Impact ÷ Ressourcen (Geld + Zeit + Emotionen)
```
Riesen-Impact → rein in den Plan. Homöopathisch (<5%) → weglassen.

---

## Was ist dieses Projekt?

Ambient-Sound-App für Tinnitus-Betroffene. Primär: Einschlafhilfe.
PWA + Android APK. Offline-fähig, werbefrei, kein Tracking.
7 eigene Field Recordings: Wellen · Rauschen · Vögel · Bach · Regen · Café · Berg
Strategisches Ziel: **Lead Magnet** (App gegen E-Mail-Adresse).
Landingpage live: `ohreninsel.tinnituspraxis-seedorf.de`

---

## Dateiübersicht

| Datei / Ordner | Inhalt |
|---|---|
| `index.html` | Haupt-App |
| `app.js` | Gesamte App-Logik |
| `style.css` | Styling |
| `sw.js` | Service Worker (Cache-Name = Version) |
| `manifest.json` | PWA-Manifest |
| `build-android.ps1` | Build-Script (Root → www → APK) |
| `A - Projektbeschreibung.md` | Projektübersicht |
| `B - Aufgaben.md` | Aufgaben + Phasen + Meilensteine |
| `C - Protokoll.md` | Änderungsprotokoll |
| `F - Entscheidungen.md` | Entscheidungslog |
| `G - Technische Referenz.md` | Bedienmodell, Audio-Engine, Karussell, Button-Logik, iPhone-Bug |
| `02-Audio/` · `03-Design/` | Field Recordings · Design-Referenzen |
| `05-Für Videoaufnahme/` | Handy-Shortcuts für Bildschirmaufnahmen |
| `xold/` | Veraltete Dateien (nie löschen, hierhin verschieben) |

---

## Offene Punkte

- **Impressum/Datenschutz-URLs:** Links gehen auf `tinnituspraxis-seedorf.de/impressum` + `/datenschutz` — Wix-Pfade bestätigen.
- **Lead Magnet:** E-Mail-Provider-Entscheidung ausstehend (LEAD-01). **Nächster echter Hebel** Richtung Intensivtage/E-Mail-Liste — wichtiger als weitere Pixel-Politur.
- **Eigene Subdomain:** Optional, aktuell github.io (PWA-01).

**Erledigt (13.06., v0.9.17–v0.9.29, iPhone-verifiziert):** Bodenstreifen oben + unten weg, Statusleiste/Header blenden beim Start aus, Header-Sprung beim Play, Homescreen-Icon. iOS-PWA-Details in G.

---

## Build & Release-Workflow

```powershell
# Version an 4 Stellen hochzählen: app.js + sw.js + build.gradle (versionCode+versionName) + Git-Tag
git add -A; git commit -m "..."; git push origin master
.\build-android.ps1
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd android; .\gradlew assembleDebug
Rename-Item android\app\build\outputs\apk\debug\app-debug.apk Ohreninsel-vX.Y.Z.apk
gh release create vX.Y.Z Ohreninsel-vX.Y.Z.apk --title "Ohreninsel vX.Y.Z" --notes "..."
```

---

## Arbeitsregeln

- **Nie Dateien löschen** → nach `xold/` verschieben.
- **Nicht pushen ohne Boris-OK.**
- **Neue Features erst lokal testen**, dann APK, dann Release.
- **build-android.ps1 VOR Gradle** — sonst landen alte Web-Dateien im APK.
- **PWA-Push und APK immer zusammen** — nie einzeln.
- **build.gradle nie mit PowerShell Set-Content** — erzeugt BOM, bricht Build. → `[System.IO.File]::WriteAllText(...)` oder Edit-Tool.
- **Dateien immer als UTF-8 OHNE BOM schreiben:** `New-Object System.Text.UTF8Encoding($false)`. Sonst doppelt kodierte Umlaute (ä → `Ã¤`, sichtbar z.B. als „Läuft" mit Viereck). Bei PowerShell-Replace auf CRLF (`\r\n`) achten — Suchstrings mit `\n` matchen sonst nicht.
- **Diktierfehler beachten:** Fachbegriffe, Domains, Dateinamen gegenchecken.

---

## Technischer Kontext

PWA via HTML/CSS/JS + Capacitor für Android APK. Audio: Web Audio API (gapless loop + Crossfade).
Testgeräte: OnePlus 5 / Android 10 (Boris), iPhone (Katharina).
SDK: `C:\Users\Boris\AppData\Local\Android\Sdk` · Java: `C:\Program Files\Android\Android Studio\jbr`
GitHub: `Boris1900/ohreninsel`

---

## Session-Start

1. Diese CLAUDE.md lesen.
2. Kurz: Stand + nächste 1–2 To-dos nennen.
3. Loslegen.
