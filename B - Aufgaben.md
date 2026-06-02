# B – Aufgaben TinnitusMediApp

> Phasen, Aufgaben, Meilensteine und Detail-Specs.
> Für das Änderungsprotokoll (was wurde gemacht?) → `C - Protokoll.md`

---

## Aufgaben nach Phasen

---

### Phase 1 — Basis & Setup (START)

> Status: ⬜ Offen
> Ziel: Lauffähige leere TinnitusMediApp auf Basis der MediApp, lokal im Browser abrufbar.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| START-01 | MediApp-Dateien als Snapshot in `01-Basis/` kopieren | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | — | 🟢 | — | ✅ Erledigt |
| START-02 | `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.json` für TinnitusMediApp anlegen (Basis-Kopie, Name + Titel angepasst) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | Dateien löschen | ✅ Erledigt |
| START-03 | Lokaler Test: App öffnet sich im Browser, Timer läuft | ✅ | 🔴 | 💰🟢 ⏰🟢 💚🟢 | Boris: visuelles OK | 🟢 | — | ✅ Erledigt |
| START-04 | ⚙️ Code-Review Phase 1 | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: TinnitusMediApp startet lokal – Basis steht** | | | | | | | ✅ Erledigt |

---

### Phase 2 — Audio-System (AUDIO)

> Status: ⬜ Offen
> Ziel: 5 Field Recordings spielen nahtlos im Loop ab – mit und ohne Timer. Start per Fade-in.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| AUDIO-01 | 📄 Konzept: Gapless Loop mit Crossfade (Web Audio API) dokumentieren (→ Aufgabenbeschreibung) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ✅ Erledigt |
| AUDIO-02 | Prototyp: Crossfade-Loop mit einem Platzhalter-Audio testen | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟡 | Boris: Hörtest | 🟡 | Fallback auf HTML5-Loop | ✅ Erledigt |
| AUDIO-03 | 6 Field Recordings beschaffen (alle selbst aufgenommen) | ❌ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: Dateien liefern | 🟢 | — | ✅ Erledigt |
| AUDIO-04 | CCO-Quellen dokumentieren + Lizenzen in `02-Audio/` sichern | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | — | 🟢 | — | ⬜ Offen |
| AUDIO-05 | Audio-Auswahl UI: von jedem Hintergrund aus erreichbar; kein Sound = reiner Timer-Modus möglich (→ Aufgabenbeschreibung) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: visuelles OK | 🟢 | — | ✅ Erledigt |
| AUDIO-06 | Start-Verhalten: Tap auf Start → Sound faded ein (1s); Fade-out symmetrisch (1.5s); Glow-Animation weich | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: Hörtest | 🟡 | Nur Fade-in ohne Ton | ✅ Erledigt |
| AUDIO-07 | Timer-Entkopplung + Timer-Ausblendverhalten (Meditation vs. Einschlafen) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: Test + Entscheidung | 🟡 | Nur Timer-Modus | ⬜ Offen |
| AUDIO-08 | iOS-Test: Mute-Switch-Hinweis + Audio-Unlock auf iPhone | ⚠️ | 🔴 | 💰🟢 ⏰🟡 💚🟡 | Boris: iPhone-Test | 🟡 | Hinweis-Text | ⬜ Offen |
| AUDIO-09 | ⚙️ Code-Review Phase 2 | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: Alle 5 Sounds laufen nahtlos im Loop, mit + ohne Timer, Fade-in funktioniert** | | | | | | | ⬜ Offen |

---

### Phase 2b — Maxi-Loop [Feature-Erweiterung, nach Phase 2]

> Status: ⬜ Offen | Priorität: nach Phase 2 Basis
> Ziel: Optionaler Maxi-Loop-Modus, der alle 5 Files nahtlos nacheinander ineinander blendet.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| MAXI-01 | 📄 Konzept: Maxi-Loop – Übergang zwischen verschiedenen Files (→ Aufgabenbeschreibung) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ⬜ Offen |
| MAXI-02 | UI: Maxi-Loop als auswählbare Option neben den Einzel-Tracks | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | Boris: visuelles OK | 🟢 | — | ⬜ Offen |
| MAXI-03 | Reihenfolge + Crossfade-Übergänge zwischen allen 5 Files implementieren | ✅ | 🔴 | 💰🟢 ⏰🔴 💚🟡 | Boris: Hörtest | 🟡 | Maxi-Loop deaktivieren | ⬜ Offen |
| MAXI-04 | Hörtest: Klingt der Übergang Hafen → Wald → Meer nahtlos? | ✅ | 🔴 | 💰🟢 ⏰🟢 💚🟢 | Boris: Hörtest + Feedback | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: Maxi-Loop läuft nahtlos durch alle 5 Sounds** | | | | | | | ⬜ Offen |

---

### Phase 3 — Hintergründe (HGRD)

> Status: ⬜ Offen
> Ziel: Alle Hintergründe in richtiger Reihenfolge, optisch abgenommen.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| HGRD-01 | Hintergrund-Reihenfolge anpassen: Farben → Berge → Meer → Buddha | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | — | 🟢 | Reihenfolge zurücksetzen | ⬜ Offen |
| HGRD-02 | Farb-Swatches anpassen (Praxis-Grün als erste/prominente Farbe) | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | Boris: visuelles OK | 🟢 | — | ⬜ Offen |
| HGRD-03 | Berge + Meer + Buddha: Animationen aus MediApp übernehmen und testen | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | Boris: visuelles OK | 🟡 | MediApp-Version | ⬜ Offen |
| HGRD-04 | Horizont-Regel prüfen (getBoundingClientRect auf iOS) | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | — | 🟢 | — | ⬜ Offen |
| HGRD-05 | ⚙️ Code-Review Phase 3 | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: Alle Hintergründe funktionieren, Reihenfolge korrekt** | | | | | | | ⬜ Offen |

---

### Phase 4 — Design (DSIGN)

> Status: ⬜ Offen
> Ziel: App sieht nach Tinnituspraxis-Seedorf aus – nicht nach MediApp.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| DSIGN-01 | Farbcodes der Praxiswebsite ermitteln und in CSS einbauen | ✅ | 🔴 | 💰🟢 ⏰🟢 💚🟢 | Boris: Praxis-Grün bestätigen | 🟢 | — | ✅ Erledigt (Mockup) |
| DSIGN-02 | Ohr-Symbol als App-Icon (SVG oder PNG, mehrere Größen) | ⚠️ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: Icon-Datei liefern oder freigeben | 🟢 | Platzhalter-Icon | ⬜ Offen |
| DSIGN-03 | Schriftzug modernisieren (Google Fonts oder System-Font) | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | Boris: visuelles OK | 🟢 | MediApp-Schrift | ✅ Erledigt (Inter, Mockup) |
| DSIGN-04 | App-Titel / Splash Screen für TinnitusMediApp / Klangbegleiter | ✅ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | Boris: Namens-Entscheidung | 🟢 | — | ✅ Erledigt (Ohreninsel) |
| DSIGN-05 | 👁️ Zielgruppen-Check: Wirkt es für Tinnitus-Betroffene ansprechend? | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟡 | Boris: Feedback | 🟢 | — | ✅ Erledigt (Mockup abgenommen) |
| DSIGN-07 | Design aus Mockup in echte index.html übertragen | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | — | 🟡 | Mockup als Fallback | ✅ Erledigt |
| DSIGN-06 | ⚙️ Code-Review Phase 4 | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: Design abgenommen – App sieht nach Praxis aus** | | | | | | | ⬜ Offen |

---

### Phase 5 — PWA & Deployment (PWA)

> Status: ⬜ Offen
> Ziel: App ist live unter einer Subdomain erreichbar, Android APK vorhanden.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| SPLASH-01 | Splash-Untertitel klären: Soll unter "Ohreninsel" ein Untertitel stehen? (z.B. "Klangbegleitung bei Tinnitus") → Katharina fragen | ❌ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | Boris + Katharina: Entscheidung | 🟢 | kein Untertitel | ⬜ Offen |
| PWA-01 | Subdomain festlegen (z.B. klang.tinnituspraxis-seedorf.de) | ❌ | 🟡 | 💰🟢 ⏰🟢 💚🟢 | Boris: Entscheidung | 🟢 | — | ⬜ Offen |
| PWA-02 | Service Worker + Manifest für neue App konfigurieren | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | — | 🟡 | MediApp-Config | ⬜ Offen |
| PWA-03 | Audio-Dateien in Service Worker cachen (Offline-Nutzung) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | — | 🟡 | Nur Online-Modus | ⬜ Offen |
| PWA-04 | Android APK bauen (Capacitor, debug) | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | Boris: Test auf OnePlus | 🟡 | PWA reicht erstmal | ⬜ Offen |
| PWA-05 | Deployment auf Subdomain (nach Boris-OK) | ⚠️ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: explizites OK | 🟡 | Rollback per Git | ⬜ Offen |
| PWA-06 | ⚙️ Code-Review Phase 5 | ✅ | 🟡 | 💰🟢 ⏰🟡 💚🟢 | — | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: App live und per Smartphone nutzbar** | | | | | | | ⬜ Offen |

---

### Phase 6 — Lead Magnet (LEAD) [später]

> Status: ⬜ Offen | Priorität: nach Phase 5
> Ziel: App als E-Mail-Lead-Magnet funktioniert – Nutzer tragen sich ein, um die App zu nutzen.

| Nr | Aufgabe | Claude | Impact | Aufwand | Braucht | Risiko | Rollback | Status |
|---|---|---|---|---|---|---|---|---|
| LEAD-01 | E-Mail-Provider prüfen (Mailchimp, ActiveCampaign, Brevo?) | ❌ | 🔴 | 💰🟡 ⏰🟡 💚🟢 | Boris: Entscheidung | 🟢 | — | ⬜ Offen |
| LEAD-02 | Opt-in UI in App einbauen (sanft, kein Gate) | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟢 | Boris: Text-Freigabe | 🟢 | UI entfernen | ⬜ Offen |
| LEAD-03 | CTA-Text formulieren (warum E-Mail hinterlassen?) | ✅ | 🔴 | 💰🟢 ⏰🟢 💚🟢 | Boris: Freigabe | 🟢 | — | ⬜ Offen |
| LEAD-04 | Verbindung mit E-Mail-Provider einrichten | ⚠️ | 🔴 | 💰🟡 ⏰🟡 💚🟢 | Boris: Zugangsdaten | 🟡 | Nur statische Liste | ⬜ Offen |
| LEAD-05 | 👁️ Funnel-Check: Weg von erster Berührung bis E-Mail-Eintrag | ✅ | 🔴 | 💰🟢 ⏰🟡 💚🟡 | Boris: Feedback | 🟢 | — | ⬜ Offen |
| ◆ | **Meilenstein: E-Mail-Funnel aktiv – erste Eintragungen laufen** | | | | | | | ⬜ Offen |

---

## Aufgabenbeschreibungen

### AUDIO-01 — Gapless Loop mit Crossfade (Web Audio API)

**Was:** Ambient-Sounds müssen nahtlos im Loop abspielen – ohne hörbaren Knall oder Sprung am Loop-Punkt. Zusätzlich soll das Ende des Sounds sanft in den Beginn desselben Sounds überblenden (Crossfade).

**Warum Web Audio API statt einfachem HTML5-Audio?**
HTML5 `<audio loop>` hat eine kleine Lücke zwischen dem Ende und dem Neustart – hörbar als kurzer Knack oder Stille. Für Tinnitus-Betroffene ist das besonders störend. Die Web Audio API lädt den Sound als AudioBuffer und ermöglicht exaktes Scheduling – ohne Lücke.

**Crossfade-Technik (End-zu-Anfang):**
1. Sound als AudioBuffer laden
2. Kurz vor Ende (z.B. 3 Sekunden vorher) eine neue Wiedergabe des gleichen Buffers starten
3. GainNode: alte Instanz faded aus (1.0 → 0.0), neue faded ein (0.0 → 1.0)
4. Crossfade-Dauer: ca. 2–4 Sekunden (zu testen)
5. Alte Instanz nach Crossfade stoppen

**Umsetzungsschritte:**
1. Prototyp: eine HTML-Datei, ein Platzhalter-Audio (z.B. freier CCO-Sound)
2. AudioContext + AudioBuffer laden
3. Scheduling-Logik: `bufferDuration - crossfadeDuration` triggert neuen Start
4. GainNode-Ramp: `gainNode.gain.linearRampToValueAtTime()`
5. Test: Hörtest mit Boris – klingt es nahtlos?
6. Anpassung Crossfade-Dauer falls nötig

**Fallback:** Wenn Web Audio API auf einem Gerät nicht funktioniert → HTML5 `<audio loop>` als Fallback (mit Hinweis).

---

### AUDIO-05 — Audio-Auswahl UI

**Was:** Der Nutzer kann aus den 5 Field Recordings einen auswählen. Oder er wählt keinen – dann läuft die App als reiner Meditations-Timer ohne Ton.

**Erreichbarkeit:** Die Audio-Auswahl ist von jedem Hintergrund aus zugänglich (wie das Menü in der MediApp). Kein separater Screen, kein Pflicht-Schritt.

**Verhalten:**
- Kein Sound gewählt = Timer-Modus wie gewohnt (kein Audio)
- Sound gewählt = beim Tap auf Start faded der Sound langsam ein
- Sound läuft im Loop bis manuell gestoppt oder Timer abläuft
- Audio läuft auch unabhängig vom Timer (Freiheit für den Nutzer)

**UI-Idee:** Kleines Symbol/Button im Hauptbildschirm (z.B. Noten-Symbol oder Wellen-Icon) öffnet die Sound-Auswahl. Ähnlich wie der Gong-Button in der MediApp, aber für Klänge.

---

### AUDIO-06 — Start-Verhalten und Start-Sound

**Was:** Wenn der Nutzer auf Start tippt, gibt es keinen Gong. Stattdessen:
1. Der gewählte Ambient-Sound faded sanft ein (0.0 → volle Lautstärke über ca. 2–3 Sekunden)
2. Optional: Ein kurzer, moderner Start-Ton – kein klassischer Messing-Gong

**Anforderung an den Start-Ton:**
- Modern, nicht klinisch
- Passt trotzdem zum Buddha-Hintergrund (also nicht komplett synthetisch)
- Sehr kurz (unter 2 Sekunden), nur als "Anker" beim Start
- Mögliche Kandidaten: Kristallklangschale (heller als Messing), leise Chime, sanfter Synthesizer-Ton, oder auch: gar kein Ton – nur der Fade-in des Ambient-Sounds

**Entscheidung noch offen** – Boris hört Varianten und entscheidet.

---

### MAXI-01 — Maxi-Loop Konzept

**Was:** Ein optionaler Modus, in dem nicht ein einzelnes File in sich selbst geloopt wird, sondern alle 5 Field Recordings nacheinander ineinander überblendet werden – endlos.

**Wie es klingt:** Meer → Crossfade → Wald → Crossfade → Hafen → Crossfade → Stadt → Crossfade → Vögel → Crossfade → Meer → ...

**Technische Umsetzung:**
1. Playlist aus allen 5 AudioBuffern
2. Vor Ende von Track N: Track N+1 vorbereiten und starten
3. Crossfade: N faded aus, N+1 faded ein (ca. 3–5 Sekunden Übergang)
4. Nach letztem Track: zurück zu Track 1 (endloser Zyklus)

**Crossfade-Dauer:** Länger als beim Solo-Loop (3–5 Sekunden), weil unterschiedliche Klangwelten ineinander gleiten – das braucht etwas mehr Zeit.

**Reihenfolge:** Erst testen, welche Kombination sich am angenehmsten anfühlt. Nicht jede Reihenfolge klingt gut (Hafen → Stadtlärm kann zu abrupt sein).

---

## Meilensteine (Übersicht)

```
◆ M1: TinnitusMediApp startet lokal – Basis steht                          ✅ Erledigt (31.05.2026)
│
◆ M2: Alle 5 Sounds laufen nahtlos im Loop, Fade-in funktioniert           ⬜ Offen
│
◆ M2b: Maxi-Loop läuft nahtlos durch alle 5 Sounds [nach M2]              ⬜ Offen
│
◆ M3: Alle Hintergründe funktionieren korrekt                              ⬜ Offen
│
◆ M4: Design abgenommen – App sieht nach Praxis aus                        ⬜ Offen
│
◆ M5: App live und per Smartphone nutzbar                                  ⬜ Offen
│
◆ M6: E-Mail-Funnel aktiv                                                  ⬜ Offen (später)
```
