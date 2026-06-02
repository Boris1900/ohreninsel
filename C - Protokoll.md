# C – Protokoll TinnitusMediApp

> Änderungsprotokoll. Was wurde wann gemacht?
> Für Aufgaben und Planung → `B - Aufgaben.md`

---

## Log-Index (Schnellübersicht)

> Neueste oben, älteste unten.

| Log | Datum | Beschreibung |
|---|---|---|
| LOG-015 | 03.06.2026 | Timer-Feedback: Einschlafen zählt im kleinen Display runter, Meditieren-Dim-Delay auf 3s verlängert |
| LOG-014 | 03.06.2026 | Auto-Dim + Vereinheitlichung: Menü nach 1,5s weg, Dim automatisch, Toggle-Tap, Wellen-Preset, Gong nur Meditieren |
| LOG-013 | 03.06.2026 | Button-Sprung-Fix: #btn-area absolut positioniert. Kein Sprung mehr bei Einschlafen ↔ Meditieren |
| LOG-012 | 02.06.2026 | Button-Sprung-Problem dokumentiert. Fix-Versuch mit min-height unvollständig – Sprung nur verlagert |
| LOG-011 | 02.06.2026 | Berg-Theme: Button fast unsichtbar + blendet nach Start komplett aus. ⚠️ Noch nicht von Boris getestet |
| LOG-010 | 02.06.2026 | Session-Abschluss: Layout kompaktiert, Meditieren ohne Sound, Gong-Fix, Gong+Abdunkeln in einer Zeile |
| LOG-009 | 02.06.2026 | Gong-Fix: eigener AudioContext, schwingt nach Stop weiter aus |
| LOG-008 | 02.06.2026 | MEDI-TIMER teilweise gelöst + Klangschalen-Umbau. Offenes Problem: Meditieren-Modus nicht sichtbar/wählbar (Boris kann nicht bestätigen) |
| LOG-007 | 02.06.2026 | AUDIO-07 umgesetzt – 3 Modi, Gong-System, Countdown, Abdunkeln. Offenes Problem: Timer + untere Steuerleiste überlappen im Meditieren-Modus |
| LOG-006 | 01.06.2026 | App funktionsfähig – Design live, Audio-System, Splash, Ohr-Logo, Strategie-Entscheidungen |
| LOG-005 | 01.06.2026 | Design-Sprint – Mockup fertig, Layout, Button, Kacheln, Timer, Menü, Sonnen-Gimmick |
| LOG-004 | 01.06.2026 | Audio-Prototyp – Crossfade-Loop, Fade-Logik, Loop-Test, Testton-Generator |
| LOG-003 | 31.05.2026 | Design-Sprint – Konzept, Szenarien, Button, Farben, Hintergründe |
| LOG-002 | 31.05.2026 | Phase 1 START – Basis aus MediApp v1.79 übertragen, App läuft lokal |
| LOG-001 | 31.05.2026 | Projektstart – Ordner, Struktur, alle Basisdateien angelegt |

---

## Protokoll-Verlauf (neueste oben!)

### LOG-015 — 03.06.2026 — Timer-Feedback Einschlafen + Meditieren-Delay

**Einschlafen-Countdown:**
- `startSmallCountdown()` zählt `#timer-display` (kleines Zeitanzeige neben Slider) rückwärts
- Sichtbar für ~1,5s nach Start, dann mit `#lower` ausgeblendet
- Bei Stop: Reset auf Slider-Wert via `updateDisplay()`

**Meditieren Auto-Dim Delay:**
- `dimDelay` im Start-Handler: Meditieren = 3000ms, alle anderen = 1500ms
- Countdown unter Button bleibt damit 3s sichtbar bevor Dim-Overlay einsetzt

---

### LOG-014 — 03.06.2026 — Auto-Dim + Vereinheitlichung

**Umgesetzt:**

**Auto-Dim (neu, einheitlich):**
- Nach Play: `#lower` blendet nach 1500ms aus (alle Hintergründe gleich, kein Berg-Sonderfall)
- Nach 1500ms dimmt `#dim-overlay` automatisch auf Slider-Wert (Default 80%)
- `#dim-overlay` z-index auf 4 gesetzt – dimmt jetzt alles inkl. Button und Header
- Tap auf leeren Bereich: Toggle – un-dimmt sofort, nach 4s auto-dim wieder
- Nochmal Tap: sofort dunkel
- Stop: Dim sofort weg

**Abdunkeln-Chaos bereinigt:**
- Abdunkeln-Toggle aus Gong-Sektion entfernt
- Gong-Sektion erscheint nur noch bei Meditieren (nicht mehr bei Einschlafen)
- `medi-dim-active` Klasse + zugehörige CSS-Regeln entfernt
- Dim-Slider im Hamburger-Menü bleibt als "wie dunkel" Regler (Default 80%)

**Wellen-Preset:**
- Wellen wird beim App-Start automatisch vorausgewählt (nach Splash)
- Macht Play sofort sinnvoll ohne manuelle Auswahl

**Notiz für später (vor Veröffentlichung):**
- Letzten Hintergrund per localStorage speichern, sodass er beim nächsten Start wiederhergestellt wird

**App-Version:** v0.3 (sw.js Cache: ohreninsel-v0.8)

---

### LOG-013 — 03.06.2026 — Button-Sprung-Fix

**Problem:** Start-Button sprang nach oben/unten beim Wechsel Einschlafen ↔ Meditieren, weil `#medi-timer` im normalen Flex-Flow von `#stage` Höhe bekam und `justify-content: center` den gesamten Block neu zentrierte.

**Fix (Option A):**
- `#start-btn` + `#status-word` + `#medi-timer` in neuen `<div id="btn-area">` gewrapped
- `#btn-area`: `position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%)`
- `#stage`: nur noch `flex: 1; position: relative;` – kein `justify-content`, kein `padding-bottom`
- `#medi-timer`: immer `min-height: 56px; margin-top: 20px` – keine konditionelle `body.medi-selected`-Regel mehr nötig

**Getestet im Browser:** Wellen + 20 Min → Meditieren → Einschlafen → zurück. Button springt nicht.

---

### LOG-008 — 02.06.2026 — MEDI-TIMER + Klangschalen-Umbau

**Umgesetzt:**

**MEDI-TIMER (teilweise):**
- Neue Body-Klasse `medi-active` steuert `#lower` im Meditieren-Modus
- Play: `#lower` blendet sofort aus (0.8s CSS-Transition), nur Button + Countdown sichtbar
- Stop: erst Countdown ausblenden (600ms Delay), dann `#lower` wieder einblenden
- Tap auf Display: nur Stage aufhellt (Abdunkel-Toggle), `#lower` bleibt weg
- Funktioniert im Browser-Test korrekt (Screenshot bestätigt)

**Klangschalen-Umbau (Gong-Sektion):**
- Morgenstern, Mittagspause, Abendrot jetzt immer sichtbar (kein Auf/Zuklappen mehr)
- Wenn Gong aus: Schalen blass (opacity 0.28, pointer-events: none)
- Wenn Gong an: Schalen aufgehellt, anklickbar
- Reihenfolge geändert: Morgenstern → Mittagspause → Abendrot
- Kein Verschieben des Layouts mehr beim Gong-Toggle
- Service Worker Cache auf v0.4 aktualisiert

**⚠️ Offenes Problem für nächste Session: Einschlafen/Meditieren-Chips nicht sichtbar**

Boris kann Meditieren-Modus in der echten App nicht auswählen – Chips scheinen nicht zu erscheinen.

**Diagnose-Hinweis:** Die Chips erscheinen NUR wenn gleichzeitig gilt:
- Timer-Chip > 0 ist aktiv (nicht "Aus")
- Eine Sound-Kachel ist aktiv (irgendein Sound ausgewählt)

Mögliche Ursache: Boris wählt Sound oder Timer, aber nicht beides. Oder es gibt einen Bug.

**Nächste Session:** Direkt live testen mit Boris – Sound auswählen, dann Timer, und prüfen ob Chips erscheinen. Falls nicht: Code debuggen.

---

### LOG-007 — 02.06.2026 — AUDIO-07: Modi, Gong, Countdown, Abdunkeln

**Umgesetzt:**

**3 Timer-Modi implementiert (AUDIO-07):**
- Ambient: kein Timer, Sound läuft bis Stop
- Einschlafen (Default): Fade-out über letztes Sechstel der Gesamtzeit, max. 10 Min, kein Gong
- Meditieren: optionaler Gong (Start + Ende), Countdown sichtbar, Abdunkeln-Option

**Sound-Kacheln abwählbar:**
- Zweiter Tap auf aktive Kachel = abwählen
- Kleines ✕ oben rechts als Hinweis

**Gong-System:**
- Gong-Toggle + 3 Klangschalen (Abendrot, Mittagspause, Morgenstern)
- Gong-Lautstärke 60% (passend zu Ambient-Pegel)
- Start-Gong: Ambient faded 3s nach Gong ein
- End-Gong: parallel 6s Ambient-Fade

**Countdown im Meditieren-Modus:**
- Läuft rückwärts unterhalb des Start/Stop-Buttons
- Blendet bei Idle auf 12% ab

**Abdunkeln-Toggle (Meditieren):**
- Bei Idle: Stage + Header auf ~6% Opacity
- Tap hebt auf, nach 4s dimmt erneut

**Menü-Info:** 3 Modi erklärt (Ambient / Einschlafen / Meditieren)

**App-Version:** v0.3

---

**⚠️ Offenes Problem für nächste Session: Timer-Anzeige vs. untere Steuerleiste (MEDI-TIMER)**

Im Meditieren-Modus läuft der Countdown unter dem Button, aber wenn der Nutzer tippt, blendet sich die untere Steuerleiste (Kacheln, Chips, Gong-Sektion) wieder ein und überlagert den Countdown. Das wirkt überladen und ist nicht sauber gelöst.

**Was Boris will:**
- Nach Start: untere Steuerleiste blendet aus, dann erscheint Countdown sauber unter dem Button
- Beim Tippen: NUR Timer + Button sichtbar, NICHT die untere Steuerleiste
- Zweites Tippen: alles wieder weg (dimmt/blendet aus)

**Lösungsansätze (noch nicht entschieden, nächste Session):**
- Option A: Im Meditieren-Modus beim Tippen nur `#stage` aufhellen, `#lower` bleibt versteckt
- Option B: Zwei Tap-Zonen – Tap auf Stage zeigt nur Timer, Tap auf Lower zeigt untere Controls
- Option C: Im Meditieren-Modus `#lower` komplett ausblenden (pointer-events: none) sobald gelaufen, nie mehr einblenden bis Stop

Option A ist vermutlich am saubersten. Nächste Session direkt damit anfangen.

---

### LOG-006 — 01.06.2026 — App funktionsfähig

**Was umgesetzt wurde:**

**DSIGN-07 abgeschlossen:** Design aus Mockup in echte App übertragen
- `index.html`, `style.css`, `app.js` v0.2 komplett neu geschrieben
- Inter-Font, Phosphor Icons, alle Mockup-Elemente live
- Hintergrundwechsel, Menü-Sheet, Timer-Chips, Sound-Kacheln alle funktionsfähig

**Audio-System live (AUDIO-03, 05, 06):**
- 6 eigene Field Recordings eingebunden (Wellen, Rauschen, Vögel, Bach, Regen, Café)
- Crossfade-Loop aus Prototyp in echte App integriert
- Alle Sounds beim App-Start stumm vorgeladen + dekodiert (Map-Cache, kein "Lädt…" mehr)
- Fade-in 1s, Fade-out 1.5s, symmetrisch
- Schneller Start/Stop ohne Race-Condition (lokale Kontext-Kopien in stopAudio)
- Glow-Animation JS-gesteuert via requestAnimationFrame (kein CSS-Keyframe, löst Snap-Problem)
- Sanfter Stop: `body.stopping`-Klasse + rAF-Trick für zuverlässige Transition

**Splash Screen:**
- Erscheint sofort beim App-Start mit Ohr-Logo + "Ohreninsel" + 3 Ladepunkte
- Mindestdauer 3 Sekunden, wartet auf vollständiges Laden aller Sounds
- Faded sanft weg wenn bereit

**Ohr-Logo:**
- `ohr3.png` (freigestellt, Praxis-Grün, nur Ohr ohne Wellen)
- Im Header neben "Ohreninsel" – Unterkanten bündig, `align-items: flex-end`
- Im Splash zentriert, pulsierend

**Sound-Kacheln:**
- Negatives Margin-Trick: Kacheln scrollen bis zum Bildschirmrand
- Rand-Kacheln an Scroll-Endpunkten vollständig sichtbar
- Mask-Fade signalisiert Scrollbarkeit

**Strategie-Session:**
- Drei Nutzungsfälle definiert: Einschlafen (primär), Meditieren, Atmosphäre/Ambient
- Marktanalyse: Einschlafen gewinnt (tägliches Problem, Nische wenig besetzt)
- Timer-Modi: "Einschlafen" vs "Meditieren"-Chips geplant – Umsetzung nächste Session

**Nächste Session:**
- Timer-Modi implementieren (AUDIO-07)
- Positionierungsfrage: Einschlafen vs. Meditation vs. Atmosphäre als Hauptbotschaft klären
- iOS-Test (Katharina)

---

### LOG-005 — 01.06.2026 — Design-Sprint

**Ergebnis:** Design-Mockup `03-Design/layout-mockup.html` – vollständig interaktiv, direkt im Browser öffnen.

**Was eingebaut ist:**
- Layout: Header, Stage (Button zentriert, fix), unterer Block absolut positioniert (klappt nicht weg beim Slider-Aufklappen)
- Start/Stop-Button: Glasmorphism, Play→Pause-Symbol via CSS, kein Text im Button
- Glow-Aura: animiert nur `opacity` (GPU, kein Ruckeln), atmet sanft 0.45→1.0
- Sonnen-Gimmick (E-009): Aura-Farbe je Hintergrund (Meer=orange, Berg=gold, Blau=hellblau, Rest=Grün)
- Sound-Kacheln: Phosphor Icons (ph-regular), 7 Kacheln, horizontal scrollbar
- Kacheln/Timer beim Spielen: nach 4s ausblenden, Tippen = Toggle ein/aus
- Timer-Chips: Aus/20/40/60 Min + Slider klappt sanft auf
- Menü-Sheet (☰): von unten, Hintergrund-Auswahl + Abdunkel-Slider
- Hintergründe: Grün, Blau, Grau, Nacht, Schwarz, Berg (Foto), Meer (Foto)
- Demo-Leiste oben zum schnellen Hintergrund-Wechsel

**Entscheidungen dieser Session:**
- E-008: Sound → Hintergrund als smarte Voreinstellung (nicht Zwang, später)
- E-009: Button als atmosphärische Sonne pro Hintergrund
- Kein separater Medi-Modus nötig: Meditation = Kein Ton + Timer (gleiche UI)
- Use Cases A/B/C alle über dieselbe UI abgedeckt

**Nächster Schritt:** Design aus Mockup in echte `index.html` übertragen (neue Session).

---

### LOG-004 — 01.06.2026 — Audio-Prototyp

**Erledigt (AUDIO-01 + AUDIO-02):**
- Konzept Gapless Loop mit Crossfade über Web Audio API umgesetzt
- Prototyp `02-Audio/loop-prototyp.html` gebaut – läuft direkt im Browser ohne Server
- Field Recording `sounds/Regen und Gewitter_0.1.mp3` (192 kbps, 44.1 kHz) als erste Testdatei

**Fade-Logik implementiert:**
- Jede Source hat eigenen Gain: Fade-in (4 s) am Anfang, Fade-out (4 s) am Ende
- Master-Gain steuert globales Ein-/Ausblenden
- Start: 3 s Fade-in über Master-Gain
- Timer-Ende: 5 s Fade-out, startet 5 s vor Ablauf
- Manueller Stop: 1,5 s Spotify-Fade über Master-Gain

**Hilfsfunktionen:**
- "Loop testen"-Button: springt direkt 3 s vor Crossfade-Punkt
- "Testton generieren"-Button: erzeugt 12-s-Ton mit Sekunden-Pings (eindeutig hörbar ob Loop klappt)
- FileReader statt fetch() – kein Server nötig

**Hörtest bestanden:** Crossfade klingt sauber.

**Nächstes:** Design-Phase (DSIGN) – Farben, Font, Button-Stil, Ohr-Icon.

---

### LOG-003 — 31.05.2026 — Design-Sprint

**Konzept finalisiert:**
- 3 Nutzungsszenarien definiert: A (Sofort-Entlastung), B (Einschlafhilfe), C (Meditation)
- Szenario B als häufigster Use Case identifiziert: Einschlaftimer ohne Gong, sanftes Ausblenden
- USP dokumentiert: Offline-nutzbar (Flugmodus), keine Strahlung, keine Stream-Abhängigkeit

**App-Name entschieden:** Ohreninsel ✅
- Alle Dateien umbenannt (manifest, sw.js, capacitor, index.html, CLAUDE.md)

**Hintergründe:**
- Praxis-Grün `#7ed957` als erste Farbkachel eingebaut
- Grasgrün entfernt (redundant zu Praxis-Grün)
- Labels gekürzt: Dunkel, Grau, Blau, Nacht, Gelb (kein Zeilenumbruch mehr)
- Labels auf `width: 100%` gesetzt → sauber zentriert unter jeder Kachel
- Reihenfolge: Grün → Schwarz → Dunkel → Grau → Blau → Nacht → Gelb → Erwachen → Abendrot → Buddha

**Start/Stop-Button neu gestaltet:**
- Gong-Bild entfernt, kein Swing-Animation mehr
- Neuer Kreis-Button: Glasmorphism (rgba weiß, backdrop-filter blur)
- Im laufenden Zustand (body.running): grüner Schimmer + zwei sanfte Wellenringe
- Tap-Welle (.welle): Gold → Praxis-Grün umgestellt

**Noch offen (nächste Session):**
- Timer-Bereich sitzt zu weit unten (zu viel Leerraum unter Button) → Layout anpassen
- Inter-Font einbauen (Merriweather ersetzen)
- Menü-Hintergrund: aktuell MediApp-Braun → Praxis-Dunkelgrün (#0d3510)
- Menüstruktur Phase 2: Ambient-Sound von Hauptscreen erreichbar machen
- Einschlaf-Modus (Szenario B) implementieren

---

### LOG-002 — 31.05.2026 — Phase 1 START abgeschlossen

**Erledigt (START-01 + START-02):**
- MediApp v1.79 Kernddateien als Snapshot nach `01-Basis/` gesichert
- Neue App-Dateien im Projektroot angelegt:
  - `index.html` – umbenannt auf Klangbegleiter, Hintergrund-Reihenfolge angepasst (Farben → Berge → Meer → Buddha), Ambient-Klang-Sektion als Platzhalter, TODO-Kommentar für neuen Start/Stop-Button
  - `app.js` – Version auf v0.1 gesetzt, Basis von MediApp v1.79
  - `style.css` – direkte Kopie (Design-Anpassungen kommen in Phase 4)
  - `sw.js` – Cache-Name auf `klangbegleiter-v0.1` geändert
  - `manifest.json` – Name auf Klangbegleiter, App-ID neu
  - `capacitor.config.json` – appId `de.tinnituspraxis.klangbegleiter`
- Sounds, Icons, Bilder kopiert
- Lokaler Server läuft auf http://localhost:3457
- Design-Entscheidungen (E-004 bis E-007) dokumentiert

**Noch offen aus Phase 1:**
- START-03: Boris testet visuell im Browser und gibt OK

---

### LOG-001 — 31.05.2026 — Projektstart

- Projektordner angelegt: `C:\Users\Boris\Projekte\TinnitusMediApp\`
- Unterordner angelegt: `01-Basis/`, `02-Audio/`, `03-Design/`, `04-Deployment/`, `xold/`
- CLAUDE.md erstellt (Session-Start-Regeln, Referenz-Projekt, Arbeitsregeln)
- A - Projektbeschreibung V01 erstellt
- B - Aufgaben erstellt (6 Phasen: START, AUDIO, HGRD, DSIGN, PWA, LEAD)
- C - Protokoll erstellt (diese Datei)
- F - Entscheidungen erstellt
- Referenz-Projekt dokumentiert: MediApp (Augenblick) v1.79 in `C:\Users\Boris\Projekte\MeditationsApp\`
- Audio-Konzept (Gapless Crossfade) als Aufgabenbeschreibung in B dokumentiert
- Projektstatus: Phase 1 (START) als nächstes
