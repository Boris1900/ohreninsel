# TinnitusMediApp – Projektdokumentation

**Arbeitstitel:** TinnitusMediApp | **Produktname:** Ohreninsel
**Stand:** v0.7.3 (Karussell, Slide-Transition, Frosted Glass, Update-Button, PWA live – 02.06.2026)

**PWA live:** https://boris1900.github.io/ohreninsel/ (GitHub Pages, master-Branch)
Für iPhone (Katharina): URL in Safari → Teilen → Zum Home-Bildschirm.
Ablauf neuer Stand: Code ändern → Version hoch (app.js + sw.js) → commit → push (PWA aktualisiert sich) → APK bauen → Release. PWA und APK immer zusammen aktuell halten.

---

## Entscheidungs-Kompass (immer anwenden)

```
Wert = Impact ÷ Ressourcen (Geld + Zeit + Emotionen)
```
Riesen-Impact → rein in den Plan. Homöopathisch (<5%) → weglassen.
CEO-Brille: Was würde ein CEO denken, nicht ein Nerd?

---

## Was ist dieses Projekt?

Ambient-Sound-App für Tinnitus-Betroffene mit drei Kernnutzungen:
1. **Einschlafen** (Primär-Positionierung) – nahtloser Ambient-Sound, sanftes Ausblenden
2. **Meditieren** – Timer mit kurzem Ausklang am Ende
3. **Atmosphärischer Ambient** – einfach entspannen, kein Timer nötig

PWA + Android APK, basierend auf der MediApp (Augenblick v1.79).
Offline-fähig, Flugmodus, kein Tracking – bewusster USP für Tinnitus-Betroffene.

**6 eigene Field Recordings:**
Wellen Nordsee · Rauschen Nordsee · Vögel im Wald · Bachplätschern · Regen & Gewitter · Straßencafé

Zielgruppe: Tinnitus-Betroffene (Patienten von Boris, Websitebesucher)
Späteres Ziel: Lead Magnet (App gegen E-Mail-Adresse)

---

## Referenz-Projekt

**MediApp (Augenblick v1.79):** `C:\Users\Boris\Projekte\MeditationsApp\`

---

## Dateiübersicht

| Datei | Inhalt |
|---|---|
| `index.html` | Haupt-App |
| `app.js` | Gesamte App-Logik |
| `style.css` | Styling |
| `sw.js` | Service Worker (Cache: ohreninsel-v1.0) |
| `manifest.json` | PWA-Manifest |
| `capacitor.config.json` | Capacitor-Konfiguration |
| `build-android.ps1` | Build-Script (Root → www → APK) |
| `make-icon.js` | Icon-Generator (sharp) |
| `make-icons.js` | Android-Mipmap-Icons-Generator |
| `01-Basis/` | Alte Snapshot-Kopie (nicht mehr aktiv) |
| `02-Audio/` | Field Recordings, Audio-Konzept |
| `03-Design/` | Design-Referenzen |
| `xold/` | Veraltete Dateien (nie löschen) |

---

## Hintergrundbilder + Sound-Pairing

Automatisches Pairing: Sound antippen → Hintergrund wechselt.
Im Menü weiterhin manuell änderbar.

| Sound | Hintergrund-Datei | CSS-Klasse | Theme-Klasse |
|---|---|---|---|
| Vögel (Start-Preset) | `wald_0.1.jpg` | `bg-wald` | `theme-wald` |
| Wellen | `meer_0.2.jpg` | `bg-meer` | `theme-meer` |
| Rauschen | `nacht_meer_0.1.jpg` | `bg-nacht-meer` | `theme-nacht` |
| Bach | `bach_0.1.jpg` | `bg-bach` | `theme-bach` |
| Regen | `regen_0.1.jpg` | `bg-regen` | `theme-regen` |
| Café | `cafe_0.1.jpg` | `bg-cafe` | `theme-cafe` |
| Berg | `berglandschaft_0.1.jpg` | `bg-berg` | `theme-berg` |

Farb-Thema je Hintergrund (--sun / --sun-rim in style.css):
- Meer: Türkis · Nacht: Blau · Wald: Grün · Bach: Teal · Regen: Amber · Café: Orange · Berg: Gold

---

## Build-Workflow Android APK

```powershell
# 1. Dateien nach www/ kopieren + cap sync
.\build-android.ps1

# 2. APK bauen
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd android
.\gradlew assembleDebug

# 3. APK umbenennen
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk Ohreninsel-vX.X.apk

# 4. Release
gh release create vX.X Ohreninsel-vX.X.apk --title "Ohreninsel vX.X" --notes "..."
```

GitHub: `Boris1900/ohreninsel`
Download-URL: `https://github.com/Boris1900/ohreninsel/releases/tag/vX.X`

---

## Wisch-Karussell + Hintergründe

7 Hintergründe per Swipe (links/rechts) auf der Stage durchblätterbar:
Wellen → Rauschen → Vögel → Bach → Regen → Café → Berg (Reihenfolge in `carouselItems` in app.js).
- Wischen wechselt Sound + Hintergrund, bei laufendem Audio mit Crossfade.
- Slide-Transition: alter Hintergrund gleitet raus, neuer (`#bg-slide`) kommt rein (~380ms).
  Wichtig: beim Snap am Ende erst `transition:none` auf `#bg`, dann `setBg()`, dann reflow, dann Transition wieder an – sonst blitzt der alte Hintergrund kurz durch (war ein Bug, gefixt in v0.6.5).
- Swipe-Technik: Pointer Events + `touch-action: pan-y` auf `#stage` (CSS). Funktioniert auf Android WebView UND iOS Safari PWA. `pointerdown` ignoriert Starts im unteren Bedienbereich (`#lower`), sonst klaut der Swipe den Slider.
- Farben (Grün/Blau/Grau/Nacht/Schwarz) bewusst NICHT im Karussell – nur im Menü. Hinweistext im Menü: „Jeder Sound passt zu jedem Hintergrund."

## Start-Button (Glaskugel-Logik)

- Idle: Frosted Glass (`background: rgba(0,0,0,0.18)` + `backdrop-filter: blur(10px)`), farbiger Rand je Thema (`--sun-rim`).
- Wald + Bach: weißer Rand im Idle (Themenfarbe sonst zu ähnlich zum Bild), farbiger Rand erst beim Laufen.
- Beim Play: sanfter Übergang (1.4s) zu fast klarer Glaskugel (`background: transparent`, `blur(0px)`), nur Rand + Glow bleiben.
- Berg folgt denselben Regeln wie alle anderen (alte Berg-Sonderregeln entfernt in v0.7).

---

## ✅ Erledigtes (v0.6 – v0.7.3)

- Frosted-Glass-Button + sanfter Übergang zur klaren Glaskugel beim Play
- Button-Sichtbarkeit Wald/Bach/Café gefixt (weißer Rand idle)
- Wisch-Karussell mit Slide-Transition (Flash-Bug gefixt)
- Berg ins Karussell + eigener Sound (`Sounds/Berg_0.1.mp3`)
- localStorage: letzter Sound/Hintergrund wird gemerkt (`ohreninsel-carousel`)
- Versionsnummer aus Header raus, nur noch unten im Menü (mit Nachkommastelle!)
- Update-Button im Menü (GitHub-Check, APK-Link auf Android / Cache-Reload auf PWA)
- PWA live via GitHub Pages

---

## Offene Punkte

- **iOS-Test**: Katharina (Swipe, Frosted Glass, Audio, Update-Button auf Safari PWA)
- **Berg-Sound**: vorläufig Vogel/Wald-Aufnahme – evtl. später typischere Bergatmosphäre
- **Eigene Subdomain** statt github.io (z.B. ohreninsel.tinnituspraxis-seedorf.de) – optional
- **Lead Magnet** (Phase 6): App gegen E-Mail-Adresse – strategisches Hauptziel

---

## Session-Start-Regeln

1. Diese CLAUDE.md lesen
2. Kurze Zusammenfassung: Stand + nächste 1-2 To-dos
3. Dann loslegen

---

## Arbeitsregeln

- **Nie Dateien löschen** – nach `xold/` verschieben
- **Nicht pushen ohne Boris-OK**
- **Neue Features erst lokal testen**, dann APK, dann Release
- **Diktierfehler beachten:** Fachbegriffe, Domains, Dateinamen gegenchecken
- **Versionsnummer immer mit Nachkommastelle** im Menü (z.B. `v0.7.3`, nicht `v0.7`)
- **Version an 3 Stellen hochzählen:** `app.js` (APP_VERSION), `sw.js` (CACHE_NAME), Release-Tag
- **PWA + APK zusammen aktuell halten:** nach push aktualisiert sich die PWA automatisch (GitHub Pages), APK separat bauen + Release

---

## Technischer Kontext

- Basis: PWA via HTML/CSS/JS + Capacitor für Android APK
- Audio: Web Audio API (gapless loop mit Crossfade)
- Android: debug APK, OnePlus 5
- Testgeräte: OnePlus 5 Android (Boris), iPhone (Katharina)
- SDK: `C:\Users\Boris\AppData\Local\Android\Sdk`
- Java: `C:\Program Files\Android\Android Studio\jbr`
- Sprache: Deutsch
