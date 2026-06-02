# TinnitusMediApp – Projektdokumentation

**Arbeitstitel:** TinnitusMediApp | **Produktname:** Ohreninsel
**Stand:** v0.5.1 (Hintergründe, Icons, Glas-UI – 02.06.2026)

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

## ⚠️ Nächste Session: Play-Button-Sichtbarkeit

**Problem:** Play-Button ist zu wenig sichtbar (zu transparent).
**Ziel:** Glas-Look beibehalten, aber Button klar erkennbar als "drück mich".

**Aktueller Stand des Buttons:**
- Fläche: `background: transparent` (korrekt – Glaskugel-Look)
- Rand idle: `border: 1px solid var(--sun-rim)` (farbiger Rand je Thema)
- Rand running: `border-color: var(--sun-rim)` + `box-shadow: 0 0 22px rgba(var(--sun), 0.30)`
- Play-Symbol: weiße Balken/Dreieck via `.glyph .bar`

**Mögliche Fixes:**
1. Play-Symbol (Dreieck/Balken) heller/größer machen
2. Rand dicker machen (`border: 2px solid`)
3. Glow im Idle-Zustand ergänzen
4. Button-Größe leicht erhöhen

---

## ✅ Erledigtes (diese Session)

- APK-Build-Workflow eingerichtet (Capacitor, android/, local.properties)
- App-Icon: Inselbild mit Palme (`Icon_Insel_0.1.png` → `icon-1024.png`)
- Android mipmap-Icons generiert (`make-icons.js`)
- Blauer-Kreuz-Bug behoben (Launch Theme + WebView backgroundColor)
- Ohr-Icon auf Splashscreen + Header (`ohr3.png`)
- 5 neue Hintergründe eingebaut + Sound-Hintergrund-Pairing
- Glas-Look: Sound-Tiles transparent, #lower mit dunklem Verlauf
- Start-Button: transparent, farbiger Rand per Thema
- Timer-Anzeige über 60 Minuten gefixt (1:20:00 statt 20:00)
- Menü-Button safe-area-inset-top (nicht mehr in Statusleiste)
- Dim-Slider Preset auf 15%
- Versionsnummer im Header (`#app-version`)
- Start-Preset: Vögel + Wald

---

## Offene Punkte

- **Play-Button-Sichtbarkeit** (nächste Session – siehe oben)
- **iOS-Test**: Katharina
- **localStorage**: Letzten Sound + Hintergrund speichern
- **Berg-Button-Test**: Ausblenden nach Start noch nicht getestet
- **PWA deployment**: Subdomain noch festzulegen

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

---

## Technischer Kontext

- Basis: PWA via HTML/CSS/JS + Capacitor für Android APK
- Audio: Web Audio API (gapless loop mit Crossfade)
- Android: debug APK, OnePlus 5
- Testgeräte: OnePlus 5 Android (Boris), iPhone (Katharina)
- SDK: `C:\Users\Boris\AppData\Local\Android\Sdk`
- Java: `C:\Program Files\Android\Android Studio\jbr`
- Sprache: Deutsch
