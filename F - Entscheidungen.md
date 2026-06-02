# F – Entscheidungen TinnitusMediApp

> Dokumentation aller wesentlichen Entscheidungen. Neueste oben.

---

## Entscheidungs-Index

| Nr | Datum | Entscheidung |
|---|---|---|
| E-012 | 01.06.2026 | Primär-Positionierung: Einschlaf-App für Tinnitus (nicht Meditations-App) |
| E-011 | 01.06.2026 | Drei Use Cases: Einschlafen (primär), Meditieren, Atmosphäre/Ambient |
| E-010 | 01.06.2026 | Timer-Modi: "Einschlafen" (langsamer Fade letzte 5 Min) + "Meditieren" (kurzer Ausklang) |
| E-009 | 01.06.2026 | Sonnen-Gimmick: Start/Stop-Button als atmosphärische Sonne pro Hintergrund |
| E-008 | 01.06.2026 | Sound ↔ Hintergrund: smarte Voreinstellung statt Zwangskopplung (später) |
| E-007 | 31.05.2026 | Design: modern und warm, nicht klinisch kalt |
| E-006 | 31.05.2026 | App-Name noch offen – Arbeitstitel "Klangbegleiter" |
| E-005 | 31.05.2026 | Maxi-Loop als optionaler Modus (alle 5 Files nacheinander) |
| E-004 | 31.05.2026 | Start/Stop-Button: anderes Design, Gong-Audiooption bleibt |
| E-003 | 31.05.2026 | Timer ohne Audio nutzbar (vollständige Entkopplung) |
| E-002 | 31.05.2026 | Web Audio API für gapless Loop statt HTML5-Audio |
| E-001 | 31.05.2026 | MediApp (Augenblick v1.79) als Code-Basis |

---

## Entscheidungen (neueste oben)

### E-012 — 01.06.2026 — Primär-Positionierung: Einschlaf-App

**Entscheidung:** Die Ohreninsel wird primär als Einschlaf-App für Tinnitus-Betroffene positioniert. Meditation und atmosphärischer Ambient sind sekundäre Use Cases.

**Begründung:** Schlafprobleme sind das häufigste Begleitsymptom bei Tinnitus (50–70%). Das ist ein tägliches, dringendes Problem. Der Markt für tinnitusspezifische Schlaf-Apps ist wenig besetzt – im Gegensatz zu allgemeinen Schlaf- oder Meditations-Apps. "Endlich schlafen trotz Tinnitus" ist ein stärkerer emotionaler Aufhänger als "Meditieren trotz Tinnitus". Außerdem: tägliche Nutzung = mehr Engagement = mehr E-Mail-Adressen.

**USP:** Offline, Flugmodus, kein Tracking – passt zur sensibilisierten Tinnitus-Zielgruppe.

---

### E-011 — 01.06.2026 — Drei Use Cases

**Entscheidung:** Die App deckt drei Nutzungsszenarien ab:
1. **Einschlafen** (primär) – Sound + Timer, langsames Ausblenden am Ende
2. **Meditieren** – Sound + Timer, kurzer Ausklang; oder kein Sound (reiner Timer)
3. **Atmosphäre/Ambient** – Sound ohne Timer, einfach laufen lassen

Alle drei funktionieren über dieselbe UI – kein separater Modus-Schalter nötig.

---

### E-010 — 01.06.2026 — Timer-Modi: Einschlafen vs. Meditieren

**Entscheidung:** Zwei kleine Chips unterhalb des Timers – nur sichtbar wenn ein Timer aktiv ist:
- **Einschlafen** 🌙 → Sound blendet in den letzten ~5 Minuten sanft aus
- **Meditieren** 🧘 → Sound bleibt bis fast zum Ende, dann ~20 Sekunden Ausklang

**Begründung:** Einfach, klar, ohne Erklärungsbedarf. Kein Prozentsatz, keine technische Sprache. Standard: Einschlafen (als Primär-Use-Case).

**Status:** Noch nicht implementiert – nächste Session.

---

### E-009 — 01.06.2026 — Sonnen-Gimmick: Button als atmosphärische Sonne

**Entscheidung:** Der Start/Stop-Button bleibt bei jedem Hintergrund am selben Ort, passt sich aber farblich und atmosphärisch dem jeweiligen Hintergrund an – wie eine Sonne in der Szenerie. Beim Meer eine warme rote Abendsonne, beim Berg ein helles Mittagslicht, bei den Farbhintergründen das Praxis-Grün.

**Technische Umsetzung (bereits im Mockup `03-Design/layout-mockup.html`):**
- Glow-Layer hinter dem Button animiert nur `opacity` (GPU-beschleunigt, kein Ruckeln)
- Farbe über CSS-Variable `--sun` (RGB) + `--sun-rim`, pro Hintergrund per `body.theme-*`-Klasse überschrieben
- Beim Hintergrundwechsel setzt JS die passende Theme-Klasse

**Begründung:** Schönes, ästhetisches Detail mit wenig Code. Stärkt die Atmosphäre und macht den zentralen Button zum stimmigen Teil der Szenerie statt zum aufgesetzten UI-Element.

---

### E-008 — 01.06.2026 — Sound ↔ Hintergrund: smarte Voreinstellung statt Zwang

**Entscheidung:** Sound-Auswahl und Hintergrund werden NICHT fest gekoppelt. Stattdessen schlägt die App beim Antippen eines Sounds den passenden Hintergrund als Default vor (z.B. Meeresrauschen → Meer-Bild), bleibt aber jederzeit frei änderbar. Umsetzung ERST nach der funktionierenden Basis-App.

**Begründung (kritisch abgewogen):**
- Häufigster Use Case ist Einschlafen – dabei will fast niemand ein helles Meeresbild, sondern Dunkelheit. Eine Zwangskopplung würde dem Einschläfer die Szenerie aufdrängen.
- Es skaliert schlecht: Es sollen tendenziell mehr Sounds werden (z.B. verschiedene Waldsounds). Jedes stimmige Hintergrundbild bedeutet Beschaffung, Lizenz, ästhetische Abstimmung, Sonnen-Animation anpassen. Bei vielen Sounds ein Asset-Berg. Abstrakte Farbhintergründe kosten dagegen fast nichts.
- Smarte Voreinstellung verbindet beides: Atmosphäre als Default, Freiheit als Prinzip.

**Auswirkung:** Sound und Hintergrund bleiben technisch getrennt. Kopplung nur als Default-Vorschlag. Eigene Aufgabe nach Phase 5 (Basis muss erst stehen). Bild-Beschaffung pro Sound bewusst nach hinten geschoben, um Verzetteln zu vermeiden.

---

### E-007 — 31.05.2026 — Design: modern und warm, nicht klinisch kalt

**Entscheidung:** Das Design soll modern wirken, aber nicht kalt oder klinisch. Wärme bleibt – nur der Stil ändert sich (weg von meditativ-golden, hin zu klar-modern mit Praxis-Grün).

**Konsequenz für Umsetzung:**
- Keine kalten Grau- oder Reinweiß-Töne als Hauptfarben
- Praxis-Grün als Akzent, kombiniert mit warmen Neutraltönen (Creme, Off-White, sanftes Dunkelgrau)
- Typografie: modern, klar – aber kein reines Sans-Serif-Klinikteil; etwas Charakter darf bleiben
- Button-Formen: weich gerundet statt eckig kalt

---

### E-006 — 31.05.2026 — App-Name: Kandidaten bewertet

**Entscheidung:** Noch offen – Entscheidung nach erstem Live-Test.

**Kandidaten (priorisiert):**
**Entschieden: Ohreninsel** ✅ (31.05.2026)

"Ohr" = direkte Tinnitus-Relevanz ohne klinisches Wort. "Insel" = Zuflucht, Ruhe. Warm, merkbar, gut für App Store.

Alle Dateien umbenannt: manifest.json, sw.js, capacitor.config.json, index.html, CLAUDE.md.

---

### E-005 — 31.05.2026 — Maxi-Loop als optionaler Modus

**Entscheidung:** Zusätzlich zum Solo-Loop (ein Sound wiederholt sich selbst) gibt es einen optionalen Maxi-Loop-Modus: alle 5 Field Recordings werden nahtlos nacheinander durchgeblendet.

**Begründung:** Boris' Idee aus dem Briefing. Für längere Nutzung sinnvoll (verhindert dass ein einziger Sound auf Dauer monoton wirkt). Wird nach der Basis-Audio-Phase (Phase 2) umgesetzt.

**Auswirkung:** Eigene Phase 2b im Aufgabenplan. Etwas mehr Implementierungsaufwand, aber großes Differenzierungsmerkmal.

---

### E-004 — 31.05.2026 — Start/Stop-Button: anderes Design, Gong-Audiooption bleibt

**Entscheidung:** Der Start/Stop-Button bekommt ein moderneres visuelles Design (nicht der große goldene Gong-Kreis der MediApp). Die Gong-Audio-Optionen bleiben jedoch erhalten: 3 Klangschalen (Morgenstern, Mittagspause, Abendrot) + Option für eigenen Upload.

**Begründung:** Das Design soll frischer wirken. Aber die Klangschalen-Sounds sind bewährt, beliebt und passen zum Buddha-Hintergrund. Kein Grund, sie zu entfernen – nur das visuelle Drumherum wird moderner.

**Was sich ändert:** Button-Form und -Stil, nicht die Audio-Logik dahinter.
**Was bleibt:** Audio-Menü mit 3 Klangschalen + Upload-Funktion für eigene MP3.

---

### E-003 — 31.05.2026 — Timer ohne Audio vollständig nutzbar

**Entscheidung:** Timer und Audio sind vollständig entkoppelt. Wer keinen Sound auswählt, bekommt einen normalen Meditations-Timer (wie die MediApp). Wer einen Sound wählt, kann ihn mit oder ohne Timer nutzen.

**Begründung:** Nicht jeder Nutzer will immer Hintergrundgeräusche. Die Flexibilität macht die App breiter einsetzbar.

**Auswirkung:** Zwei separate Modi in der Logik: reiner Timer-Modus + Audio-Modus. Kein Zwang.

---

### E-003 — 31.05.2026 — Kein Audio-Mixing in Phase 1

**Entscheidung:** In Phase 1 können Nutzer nur einen Sound gleichzeitig auswählen. Kein gleichzeitiges Mischen mehrerer Sounds (z.B. Meer + Vögel).

**Begründung:** Mixing erhöht die Komplexität erheblich (UI, Lautstärke-Balance, Crossfade-Logik für mehrere Tracks). Erstmal beweisen, dass ein einzelner nahtloser Loop gut funktioniert. Mixing kann als Feature-Erweiterung später hinzu.

**Auswirkung:** Einfacheres Audio-System, schnellere erste Version. Nutzer können einen Track wählen.

---

### E-002 — 31.05.2026 — Web Audio API für gapless Loop

**Entscheidung:** Audio wird über die Web Audio API abgespielt, nicht über einfaches HTML5 `<audio>`.

**Begründung:** HTML5 `<audio loop>` produziert eine hörbare Lücke beim Loop-Punkt. Für Tinnitus-Betroffene ist genau diese Lücke besonders störend – sie reißt aus der Entspannung. Die Web Audio API erlaubt exaktes Scheduling und Crossfade-Überblendung (Ende → Anfang), sodass der Sound wirklich nahtlos wirkt.

**Auswirkung:** Mehr Implementierungsaufwand, aber deutlich bessere Nutzererfahrung. Fallback auf HTML5-Loop bleibt als Option für nicht-unterstützte Geräte.

---

### E-001 — 31.05.2026 — MediApp als Code-Basis

**Entscheidung:** Die TinnitusMediApp wird als Fork der MediApp (Augenblick) v1.79 entwickelt.

**Begründung:** Die MediApp hat bereits alle wesentlichen Bausteine: PWA-Struktur, Capacitor-Android-Build, Hintergrund-Animationen (Berge, Meer, Buddha), iOS-kompatibles Audio-Handling, Timer-Logik. Neuanfang wäre reine Verschwendung.

**Auswirkung:** Snapshot der MediApp-Basisdateien in `01-Basis/` als Referenz. Neue Dateien (index.html, app.js etc.) werden im Projektroot der TinnitusMediApp angelegt und angepasst.
