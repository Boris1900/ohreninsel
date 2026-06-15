# G – Technische Referenz TinnitusMediApp (Ohreninsel)

> Detaillierte Implementierungsnotizen für Claude. Nur lesen wenn aktiv an diesen Teilen gearbeitet wird.
> Für Projektstatus und Aufgaben → B. Für Protokoll → C.

---

## Bedienmodell (ab v0.8)

**Hauptseite (90%-Fall):**
- Sound-Kacheln: immer genau eine aktiv. Tippen ODER Wischen wechselt Klang + Hintergrund, bei laufendem Audio per Crossfade (`switchToCarousel`).
- Großer Play-Button startet den gewählten Klang.
- Einschlaf-Timer (Label + Chips Aus/20/40/60 + Slider bis 90): Ohne Timer läuft es endlos. Mit Timer blendet der Klang über das letzte Sechstel aus.

**Meditieren (eigenes Panel, dezenter Einstieg unten):**
- Dauer: Chips 10/20/30 + Slider bis 90.
- Klang-Variante: „Nur Klang" / „Klang + Gong" / „Nur Gong" (`mediKlang`).
- Gong-Schale: Morgenstern/Mittagspause/Abendrot, wählbar außer bei „Nur Klang" (`#medi-sheet.no-gong`).
- Start-Logik zentral in `startSession({mode, filePath, minutes, gongFile})`. mode: `ambient` | `einschlafen` | `meditieren`.
- Meditation endet definiert: kurzes 6-Sek-Ausblenden bzw. End-Gong (nicht das lange Einschlaf-Ausblenden).

---

## Audio-Engine (iOS-tauglich — kritisch)

- EIN persistenter AudioContext (`ensureCtx()`), nie geschlossen, bei jedem `pointerdown` aufgewärmt.
- **Warum:** iOS limitiert die Zahl der AudioContexts und bindet Audio an User-Gesten. Beim Sound-Wechsel nur den Track-Gain tauschen, NIE einen neuen Context öffnen. Das war der Fix für „kein Ton beim Sliden auf iPhone".

---

## Wake Lock (Display-Aus / Timer-Einfrieren) — ab v0.9.30

Ohne Wake Lock legt Android die App bei Display-Aus schlafen (Doze). Folge: lange `setTimeout` (End-Gong der Meditation, Einschlaf-Ausblenden) feuern nicht. Kurze Timer (~20–30 s nach Display-Aus) überleben noch — daher trat der Bug erst bei langen Timern auf.

- `requestWakeLock()` bei Sitzungsstart (in `startSession`, nach `isRunning = true`), `releaseWakeLock()` in `doStop()`.
- Wake Lock geht bei Display-Aus/App-Wechsel verloren → `visibilitychange`-Handler holt ihn neu, wenn `!document.hidden && isRunning`.
- Display bleibt damit an, die App dunkelt selbst ab (Dim-Overlay) statt Androids Timeout → einheitliches Verhalten auf allen Geräten, Restzeit jederzeit antippbar.
- **Grenze:** aktiver Power-Button schaltet das Display hart aus → Wake Lock machtlos. Echte Lösung nur über Hintergrund-Audio (Capacitor-Plugin / Foreground-Service). Bisher nicht nötig.

---

## Wisch-Karussell + Hintergründe

7 Hintergründe per Swipe (links/rechts) auf der Stage: Wellen → Rauschen → Vögel → Bach → Regen → Café → Berg (`carouselItems` in app.js). Start-Preset: Vögel/Wald (per localStorage `ohreninsel-carousel` gemerkt).

- Slide-Transition: alter Hintergrund gleitet raus, neuer (`#bg-slide`) rein (~380ms). Beim Snap: `transition:none` auf `#bg`, dann `setBg()`, dann reflow, dann Transition wieder an — sonst blitzt der alte Hintergrund durch (Bug, gefixt v0.6.5).
- Swipe-Technik: Pointer Events + `touch-action: pan-y` auf `#stage`. `pointerdown` ignoriert Starts im `#lower`-Bereich, sonst klaut der Swipe den Slider.
- Farben (Grün/Blau/Grau/Nacht/Schwarz) bewusst NICHT im Karussell, nur im Menü.

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
- **Warum opacity statt blur-Transition:** backdrop-filter-blur-Werte animieren auf iOS/WebView nicht weich (springen), opacity ist überall butterweich.
- Wald + Bach: weißer Rand im Idle (Themenfarbe sonst zu ähnlich zum Bild).
- Play/Pause-Symbol: `will-change: opacity` + `translateZ(0)` gegen Compositing-Sprung beim Umschalten.

---

## iPhone-Ränder & Homescreen-Icon (GELÖST v0.9.29, iPhone-verifiziert)

Farbränder oben/unten am Displayrand der iOS-Standalone-PWA. Im Desktop-Browser NICHT reproduzierbar. Endgültig gelöst — die Bausteine für die nächste App:

**1. Streifen OBEN (Statusleisten-Zone):**
`viewport-fit=cover` im viewport-Meta. Ohne den Schalter lässt iOS die Statusleisten-Zone in der body-Farbe stehen. (`<meta name="viewport" content="...,viewport-fit=cover">`)

**2. Streifen UNTEN (die eigentliche Crux):**
Gemessen via Diagnose-Build: Auf der iOS-PWA ist `window.innerHeight` (762) ~50px KLEINER als `screen.height` (812). Diese untere tote Zone kann KEIN `position:fixed`-Element erreichen — iOS clippt fixed bei der innerHeight-Grenze (`getBoundingClientRect().bottom` meldet zwar größere Werte, real wird geclippt). Weder feste Höhen (`screen.height`) noch Überstand (`bottom:-100px`) helfen.
**Lösung:** Hintergrund ZUSÄTZLICH auf `<html>` legen — das Wurzelelement wird nicht geclippt. In `setBg()`: `document.documentElement.style.background = bgStyleMap[cls]`. Plus CSS `html { min-height: 100lvh; background-size:cover; background-position:center; }`. Das `<html>` reicht bis zum physischen Rand und füllt die tote Zone mit demselben Bild.

**3. Header-Sprung beim Play:**
`StatusBar.hide()` (Android, beim Start) lässt `env(safe-area-inset-top)` auf 0 fallen → Header schrumpft, der per `top:38%` in `#stage` zentrierte Play-Button springt hoch. **Lösung:** `freezeSafeAreaTop()` misst den Wert per Probe-Element und friert ihn als `--safe-top` ein, BEVOR `StatusBar.hide()` läuft; Header nutzt `calc(var(--safe-top, env(safe-area-inset-top,0px)) + 20px)`.

**4. Homescreen-Icon (schwarz mit hellem Kreis):**
iOS nimmt fürs Homescreen-Icon NUR `apple-touch-icon`, ignoriert Manifest-`.webp`. Ein zu großes PNG (1024px/1,9 MB) wird verworfen → iOS zeigt einen Splash-Schnappschuss. **Lösung:** dediziertes opakes `apple-touch-icon.png` in 180×180 + saubere 192/512-PNG im Manifest.

**Methode (wichtig für die nächste App):** Bei reproduzierbaren, gerätespezifischen UI-Bugs NICHT blind raten. Erst Diagnose-Build (Debug-Overlay mit `screen.height`/`innerHeight`/`visualViewport.height`/`getBoundingClientRect` + farbiger Rahmen ums verdächtige Element), messen, dann gezielt fixen. Spart Build/Test-Zyklen. Das `?debug`-Overlay in `index.html` ist dafür da (per localStorage `oi-debug` dauerhaft).
