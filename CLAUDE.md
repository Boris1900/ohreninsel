# TinnitusMediApp – Projektdokumentation

**Arbeitstitel:** TinnitusMediApp | **Produktname:** Ohreninsel
**Stand:** v0.8.3 (Splashscreen, neues Icon, iOS-Test bestanden – 03.06.2026)

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
Strategisches Endziel: **Lead Magnet** (App gegen E-Mail-Adresse) – noch nicht begonnen.

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

- **Lead Magnet** (strategisches Hauptziel): Landingpage + App gegen E-Mail-Adresse.
  Eigener Projektordner bereits angelegt: `C:\Users\Boris\Projekte\OhreninselLanding\`
  Dort weitermachen mit `/projekt-starten`.
- Optional: eigene Subdomain statt github.io; typischerer Berg-Sound (aktuell Vogel/Wald-Aufnahme).

## Erledigt (Meilensteine)

- **iOS-Test (Katharina) bestanden** (v0.8.3): Bedienpanel, Meditieren, Audio beim Sliden/Tippen, neues Icon, Splash – alles läuft auf iPhone. Der persistente AudioContext löst den iOS-Slide-Sound-Bug.
- App-Icon neu (Insel + Ohr-Sonne), iOS-randvoll ohne weißen Rand, Android randfüllend.
- Splashscreen passend zur dunklen App (rundes Icon + weicher Schein).

---

## Arbeitsregeln

- **Nie Dateien löschen** → nach `xold/` verschieben.
- **Nicht pushen ohne Boris-OK.**
- **Neue (visuelle) Features erst lokal testen** (Boris beurteilt visuell), dann APK, dann Release.
- **Version an 3 Stellen hochzählen** (app.js, sw.js, Release-Tag), immer mit Nachkommastelle.
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
