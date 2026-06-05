# TinnitusMediApp – Projektdokumentation

**Arbeitstitel:** TinnitusMediApp | **Produktname:** Ohreninsel
**Stand:** v0.9.1 (Sheet-Handle-Fix, Splash-FOUC, Encoding-Bugfix – 06.06.2026)

**PWA live:** https://boris1900.github.io/ohreninsel/ (GitHub Pages, master-Branch)
Für iPhone (Katharina): URL in Safari → Teilen → Zum Home-Bildschirm.

---

## Entscheidungs-Kompass (immer anwenden)

```
Wert = Impact ÷ Ressourcen (Geld + Zeit + Emotionen)
```
Riesen-Impact → rein in den Plan. Homöopathisch (<5%) → weglassen.
CEO-Brille: Was würde ein CEO denken, nicht ein Nerd?

---

## Was ist dieses Projekt?

Ambient-Sound-App für Tinnitus-Betroffene. Primär-Positionierung: Einschlafhilfe.
PWA + Android APK, basierend auf der MediApp (Augenblick v1.79).
Offline-fähig, werbefrei, kein Tracking – bewusster USP für Tinnitus-Betroffene.

**7 eigene Field Recordings:**
Wellen · Rauschen · Vögel im Wald · Bach · Regen & Gewitter · Straßencafé · Berg

Zielgruppe: Tinnitus-Betroffene (Patienten, Websitebesucher).
Strategisches Endziel: **Lead Magnet** (App gegen E-Mail-Adresse) – **Landingpage live** unter `ohreninsel.tinnituspraxis-seedorf.de` (seit 04.06.2026). Landingpage-Projekt: `C:\Users\Boris\Projekte\Landingspages\OhreninselLanding\`

---

## Bedienmodell (ab v0.8)

**Hauptseite (schnell, der 90%-Fall):**
- Sound-Kacheln: immer genau eine aktiv (kein Abwählen). Tippen ODER Wischen wechselt Klang + Hintergrund, bei laufendem Audio per Crossfade (`switchToCarousel`).
- Großer Play-Button startet den gewählten Klang.
- **Einschlaf-Timer** (Label + Chips Aus/20/40/60 + Slider bis 90): Ohne Timer läuft es endlos (einfach hören). Mit Timer blendet der Klang am Ende über das letzte Sechstel der Zeit aus. „Einschlafen" ist also kein eigener Modus, sondern nur der Timer.

**Meditieren (eigenes Panel, dezenter Einstieg unten):**
- Dauer: Chips 10/20/30 + Slider bis 90.
- Klang-Variante: „Nur Klang" / „Klang + Gong" / „Nur Gong" (`mediKlang`).
- Gong-Schale: Morgenstern/Mittagspause/Abendrot, wählbar außer bei „Nur Klang" (`#medi-sheet.no-gong`).
- Eigener Start-Button. Meditation endet **definiert**: kurzes 6-Sek-Ausblenden bzw. End-Gong, nicht das lange Einschlaf-Ausblenden.
- Start-Logik zentral in `startSession({mode, filePath, minutes, gongFile})`. mode: `ambient` | `einschlafen` | `meditieren`.

**Audio-Engine (iOS-tauglich, wichtig):**
- EIN persistenter AudioContext (`ensureCtx()`), nie geschlossen, bei jedem `pointerdown` aufgewärmt.
- Grund: iOS limitiert die Zahl der AudioContexts und bindet Audio an User-Gesten. Beim Sound-Wechsel nur den Track-Gain tauschen, NIE einen neuen Context. Das war der Fix für „kein Ton beim Sliden auf iPhone".

---

## Wisch-Karussell + Hintergründe

7 Hintergründe per Swipe (links/rechts) auf der Stage: Wellen → Rauschen → Vögel → Bach → Regen → Café → Berg (`carouselItems` in app.js). Start-Preset: Vögel/Wald (per localStorage `ohreninsel-carousel` gemerkt).
- Slide-Transition: alter Hintergrund gleitet raus, neuer (`#bg-slide`) rein (~380ms). Beim Snap am Ende erst `transition:none` auf `#bg`, dann `setBg()`, dann reflow, dann Transition wieder an – sonst blitzt der alte Hintergrund durch (Bug, gefixt v0.6.5).
- Swipe-Technik: Pointer Events + `touch-action: pan-y` auf `#stage`. Läuft auf Android WebView UND iOS Safari. `pointerdown` ignoriert Starts im `#lower`-Bereich, sonst klaut der Swipe den Slider.
- Farben (Grün/Blau/Grau/Nacht/Schwarz) bewusst NICHT im Karussell, nur im Menü.

**Sound-Hintergrund-Pairing:**

| Sound | Hintergrund | Theme |
|---|---|---|
| Vögel (Preset) | `wald_0.1.jpg` | Grün |
| Wellen | `meer_0.2.jpg` | Türkis |
| Rauschen | `nacht_meer_0.1.jpg` | Blau |
| Bach | `bach_0.1.jpg` | Teal |
| Regen | `regen_0.1.jpg` | Amber |
| Café | `cafe_0.1.jpg` | Orange |
| Berg | `berglandschaft_0.1.jpg` | Gold |

---

## Start-Button (Glaskugel-Logik)

- Glas-Effekt liegt auf `#start-btn::after`: konstanter `blur(10px)` + dunkles Fill. Idle opacity 1, Running opacity 0 (fadet 1.8s ease-in-out).
- **Grund für opacity statt blur-Transition:** backdrop-filter-blur-Werte animieren auf iOS/WebView nicht weich (springen), opacity ist überall butterweich.
- Wald + Bach: weißer Rand im Idle (Themenfarbe sonst zu ähnlich zum Bild).
- Play/Pause-Symbol: `will-change: opacity` + `translateZ(0)` gegen Compositing-Sprung beim Umschalten.

---

## Dateiübersicht

| Datei | Inhalt |
|---|---|
| `index.html` | Haupt-App |
| `app.js` | Gesamte App-Logik |
| `style.css` | Styling |
| `sw.js` | Service Worker (Cache-Name = Version, z.B. `ohreninsel-v0.8.1`) |
| `manifest.json` | PWA-Manifest |
| `build-android.ps1` | Build-Script (Root → www → APK) |
| `make-icon.js` / `make-icons.js` | Icon-Generatoren (sharp / Android-Mipmaps) |
| `02-Audio/` · `03-Design/` | Field Recordings · Design-Referenzen |
| `xold/` | Veraltete Dateien (nie löschen, hierhin verschieben) |

---

## Build & Release-Workflow

```powershell
# 1. Version hochziehen: app.js (APP_VERSION) + sw.js (CACHE_NAME) + Release-Tag
# 2. Push (PWA aktualisiert sich automatisch über GitHub Pages)
git add -A; git commit -m "..."; git push origin master
# 3. APK bauen
.\build-android.ps1
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd android; .\gradlew assembleDebug
# 4. APK umbenennen + Release
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk Ohreninsel-vX.Y.Z.apk
gh release create vX.Y.Z Ohreninsel-vX.Y.Z.apk --title "Ohreninsel vX.Y.Z" --notes "..."
```

GitHub: `Boris1900/ohreninsel` · **PWA + APK immer zusammen aktuell halten.**

---

## Offene Punkte

---

- **Splash-Screen Feintuning** (04.06.2026): Sofort blaues Vollbild, dann sanftes Fade-in mit App-Icon + Ladepunkten, dann weiches Überblenden in die App. Kein harter Schnitt.
- **Lead Magnet**: Landingpage + App gegen E-Mail-Adresse.
  Projektordner: `C:\Users\Boris\Projekte\OhreninselLanding\` (bereits angelegt)
- Optional: eigene Subdomain statt github.io
- Optional: typischerer Berg-Sound (aktuell Vogel/Wald-Aufnahme)

## Erledigt (Meilensteine)

- **v0.9.1** (06.06.2026): Sheet-Handle-CSS vereinfacht (padding/background-clip-Konflikt entfernt, `::before`-Trefferzone bleibt). Splash-FOUC-Schutz: `#splash`-Styles inline in `index.html`. Encoding-Mojibake in `checkForUpdate()`/`applyUpdate()` repariert (⏳ ✅ 🆕 ⚠️).
- **v0.9.0** (06.06.2026): Android-Startblitz: styles.xml `android:background=@null` → `android:windowBackground=@color/colorPrimary`. Swipe friert auf Android ein: `pointerup`/`pointercancel` auf `document`-Ebene (nicht nur `#stage`), außerdem `bgSlidingTarget` für korrekte Ziel-Bg bei schnellen Doppelwischen. Menü-Handle + Medi-Handle: Tap oder Wischen nach unten schließt das Sheet (Pointer-Capture, Drag-Tracking).
- **v0.8.9** (06.06.2026): Menü-Button jetzt 82% Weiß + box-shadow direkt auf den Strichen (drop-shadow am Container wirkt auf iOS zu schwach). iPhone-Streifen: `#app` auf `position: fixed; top:0; bottom:0` umgestellt – exakt wie Splash. `height:100dvh` war auf iOS PWA manchmal minimal kürzer als die physische Displayhöhe, daher der sichtbare Streifen. Wirkungsloses `body::after` aus v0.8.8 entfernt.
- **v0.8.8** (05.06.2026): Menü-Button vergrößert (22px/2px) + drop-shadow (zu schwach, in v0.8.9 korrigiert). iPhone-Streifen-Fix `body::after` (war hinter #app, wirkungslos – in v0.8.9 korrigiert).
- **v0.8.7** (04.06.2026): Weißer Statusbalken behoben (theme-color + backgroundColor auf #0a2535). Gilt für PWA + APK.
- **v0.8.6** (04.06.2026): Flash-Fix als eigenständige Version – grüner Zwischenbildschirm beim Start behoben.
- **v0.8.5** (04.06.2026): App-Hintergrund + Splash auf Landingpage-Blau (#0a2535), bg-nacht auf Nachtblau, body-bg vereinheitlicht.
- **iOS-Test (Katharina) bestanden** (v0.8.3): Bedienpanel, Meditieren, Audio beim Sliden/Tippen, neues Icon, Splash – alles läuft auf iPhone. Der persistente AudioContext löst den iOS-Slide-Sound-Bug.
- App-Icon neu (Insel + Ohr-Sonne), iOS-randvoll ohne weißen Rand, Android randfüllend.
- Splashscreen passend zur dunklen App (rundes Icon + weicher Schein).

---

## Arbeitsregeln

- **Nie Dateien löschen** → nach `xold/` verschieben.
- **Nicht pushen ohne Boris-OK.**
- **Neue (visuelle) Features erst lokal testen** (Boris beurteilt visuell), dann APK, dann Release.
- **Version an 4 Stellen hochzählen:** `app.js` (APP_VERSION) + `sw.js` (CACHE_NAME) + `android/app/build.gradle` (versionCode + versionName) + GitHub Release-Tag.
- **build.gradle nie mit PowerShell Set-Content schreiben** – das erzeugt BOM und bricht den Build. Stattdessen `[System.IO.File]::WriteAllText(..., $false)` oder Edit-Tool verwenden.
- **Diktierfehler beachten:** Fachbegriffe, Domains, Dateinamen gegenchecken.

---

## Technischer Kontext

- PWA via HTML/CSS/JS + Capacitor für Android APK. Audio: Web Audio API (gapless loop + Crossfade).
- Testgeräte: OnePlus 5 / Android 10 (Boris), iPhone (Katharina).
- SDK: `C:\Users\Boris\AppData\Local\Android\Sdk` · Java: `C:\Program Files\Android\Android Studio\jbr`
- Referenz-Projekt: MediApp `C:\Users\Boris\Projekte\MeditationsApp\`
- Sprache: Deutsch.

---

## Session-Start

1. Diese CLAUDE.md lesen.
2. Kurz: Stand + nächste 1–2 To-dos nennen.
3. Loslegen.
