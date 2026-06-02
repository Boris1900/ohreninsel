# TinnitusMediApp – Projektdokumentation

**Arbeitstitel:** TinnitusMediApp | **Möglicher Produktname:** Ohreninsel
**Stand:** v0.3 (Modi, Gong-System, Countdown, Abdunkeln – 02.06.2026)

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

**6 eigene Field Recordings (selbst aufgenommen):**
Wellen Nordsee · Rauschen Nordsee · Vögel im Wald · Bachplätschern · Regen & Gewitter · Straßencafé

Zielgruppe: Tinnitus-Betroffene (Patienten von Boris, Websitebesucher)
Späteres Ziel: Lead Magnet (App gegen E-Mail-Adresse)

---

## Referenz-Projekt

**MediApp (Augenblick v1.79):** `C:\Users\Boris\Projekte\MeditationsApp\`
Relevante Dateien: `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.json`, `build-android.ps1`
Wichtig: Horizont-Regel (getBoundingClientRect, nie window.innerHeight), Audio-Menü-Logik

---

## Dateiübersicht

| Datei | Inhalt |
|---|---|
| `A - Projektbeschreibung.md` | Was, für wen, Ziel, Technik, Zeitrahmen |
| `B - Aufgaben.md` | Phasen, Aufgaben, Meilensteine |
| `C - Protokoll.md` | Log-Index + alle Logs |
| `F - Entscheidungen.md` | Warum was so entschieden wurde |
| `01-Basis/` | Kopie der MediApp-Basis (Snapshot) |
| `02-Audio/loop-prototyp.html` | Crossfade-Loop-Prototyp (Web Audio API, direkt im Browser öffnen) |
| `02-Audio/` | Field Recordings, Audio-Konzept, Lizenzen |
| `03-Design/layout-mockup.html` | Vollständiges Design-Mockup (interaktiv, direkt im Browser öffnen) |
| `03-Design/` | Design-Referenzen, Icons, Farbcodes |
| `04-Deployment/` | PWA-Konfiguration, Build-Scripts |
| `xold/` | Veraltete Dateien (nie löschen, hier parken) |

---

## Nächste Session: Offene Punkte

- **Sound-Hintergrund-Pairing** (Idee): Wellen → Meer, Vögel → Berg o.ä. – bei Sound-Wahl automatisch passenden Hintergrund vorschlagen/setzen
- **Vollbild-Test**: App als PWA installieren oder APK bauen – Boris hat bisher nur Browser-Ansicht mit Adressleiste gesehen
- **iOS-Test**: Katharina (AUDIO-08)
- **localStorage**: Letzten Hintergrund speichern (vor Veröffentlichung)

---

## ✅ Button-Sprung beim Moduswechsel – BEHOBEN (03.06.2026)

`#start-btn` + `#status-word` + `#medi-timer` in `#btn-area` gewrapped, absolut positioniert (`top: 38%`). `#stage` hat kein `justify-content` mehr. Getestet: kein Sprung bei Einschlafen ↔ Meditieren.

---

## ⚠️ Noch zu testen: Berg-Button – von Boris noch nicht getestet

**Was gebaut wurde (LOG-011, noch ungetestet):**
- Berg-Hintergrund: Button vor dem Start kaum sichtbar (kein milchiger Fleck über Bergspitze)
- Nach Start: Button blendet nach 1,5s komplett aus (opacity 0)
- Screen antippen: Button kommt dezent transparent zurück → Stop erkennbar
- Stop drücken: Session beendet

**Testen:**
1. Berg-Hintergrund auswählen
2. Timer + Modus wählen, Play drücken
3. Prüfen: blendet der Button sauber aus?
4. Screen antippen: kommt er zurück?
5. Stop drücken: funktioniert alles?

Falls etwas nicht stimmt → CSS in `style.css` (Bereich "Berg-Theme") und JS in `app.js` (fadeDelay) anpassen.

---

## Nächste Session: Play-Button auf Foto-Hintergründen

**Ziel:** Play-Button auf Berg + Meer (und ggf. allen Foto-Hintergründen) deutlich transparenter gestalten, damit die Landschaft sichtbar bleibt.

**Was Boris will:**
- Meer: bereits gut (halbtransparent) – als Referenz nehmen
- Berg: Bergspitze wird aktuell verdeckt → Button soll fast komplett durchsichtig sein, nur dezentes Play-Symbol sichtbar
- Laufend (running): Button auf Foto-Hintergründen fast unsichtbar ausblenden – Fokus liegt auf der Atmosphäre, nicht dem Interface
- Ggf. auf allen Foto-Hintergründen (Berg + Meer) einheitlich umsetzen

**Technischer Ansatz (Idee):**
- Neue CSS-Klassen `body.theme-meer` und `body.theme-berg` existieren bereits (für Sonnen-Farbe)
- Dort `#start-btn` mit stärker reduzierter `background` opacity stylen
- Für running-State: zusätzlich `opacity` des gesamten Buttons reduzieren wenn `theme-berg` oder `theme-meer` aktiv

**App-Version:** v0.3 (sw.js Cache: ohreninsel-v0.9)

---

## Session-Start-Regeln

1. `A - Projektbeschreibung.md` lesen
2. `B - Aufgaben.md` lesen (Phasen + offene Tasks)
3. `C - Protokoll.md` LOG-007 lesen (offenes MEDI-TIMER Problem)
4. Kurze Zusammenfassung geben: Stand, nächste 2-3 To-dos
5. Nach Context-Compact: alles nochmal lesen

---

## Arbeitsregeln

- **Nie Dateien löschen** – nach `xold/` verschieben
- **Versionierung:** V01 → V02, nie überschreiben. Alte Version → `xold/`
- **Alle Pfade aktuell halten:** Neue Dateiversion → CLAUDE.md sofort updaten
- **Nicht pushen ohne Boris-OK**
- **Neue Features erst lokal testen**, dann Feedback, dann Build/Deploy
- **Diktierfehler beachten:** Fachbegriffe, Domains, Dateinamen immer gegenchecken
- **Projektreview** nach jeweils 10 abgeschlossenen Aufgaben

---

## Technischer Kontext

- Basis: PWA via HTML/CSS/JS + Capacitor für Android APK
- Audio: Web Audio API (gapless loop mit Crossfade)
- Deployment: Subdomain unter tinnituspraxis-seedorf.de (noch festzulegen)
- Android: debug APK, gleicher Build-Workflow wie MediApp
- Testgeräte: OnePlus 5 Android (Boris), iPhone (Katharina)
- Sprache: Deutsch
