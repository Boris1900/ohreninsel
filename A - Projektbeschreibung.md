# A – Projektbeschreibung TinnitusMediApp

**Version:** V01 | **Datum:** 31.05.2026

---

## Projekttitel

**Arbeitstitel:** TinnitusMediApp
**Möglicher Produktname:** Klangbegleiter (noch zu entscheiden)

---

## Kurzübersicht

Ambient-Sound-App für Menschen mit Tinnitus, die Stille schwer ertragen.
Die App spielt nahtlos loopende Field Recordings ab (Meeresrauschen, Vögel, Wald, Stadt, Hafen) – kombiniert mit den bewährten visuellen Hintergründen der MediApp. Timer optional.

---

## Für wen?

**Primäre Zielgruppe:** Tinnitus-Betroffene, die aktiv nach Linderung suchen.
Besucher der Tinnituspraxis-Seedorf-Website, Teilnehmer des Onlinekongresses, Patienten von Boris.

**Strategisches Ziel:** Lead Magnet – App (kostenlos) gegen E-Mail-Adresse.
Mittelfristig: Verbindung zu den Tinnitus Intensivtagen (August/September 2026).

---

## Beteiligte

| Person | Rolle |
|---|---|
| Boris Seedorf | Inhaber, Heilpraktiker, Entscheider, visuelles Feedback |
| Katharina Seedorff | Testgerät iPhone |
| Claude | Entwicklung, Dokumentation |

---

## Was unterscheidet diese App von der MediApp?

| Merkmal | MediApp (Augenblick) | TinnitusMediApp |
|---|---|---|
| Kern-Funktion | Meditations-Timer mit Gong | Ambient-Sound-Begleiter mit Timer |
| Audio | Einzel-Gong (Klangschalen) | Loopende Field Recordings |
| Audio-Modus | Einmalig beim Timer-Ende | Nahtlos im Loop, mit oder ohne Timer |
| Hintergrund-Reihenfolge | Buddha zuerst | Farben → Berge → Meer → Buddha |
| Design | Warm, meditativ | Modern, nüchtern, Praxis-Stil |
| Zielgruppe | Meditierende | Tinnitus-Betroffene |

---

## Format & Umfang

**Plattform:** PWA (Progressive Web App) für iPhone und Android-Browser
**Später:** Android APK (Play Store optional), iOS (App Store optional)
**Startumfang:** 5 Field Recordings (einige selbst aufgenommen, andere CCO)

**Geplante Field Recordings (Phase 1):**
1. Meeresrauschen
2. Vogelgezwitscher (Wald)
3. Stadtgeräusche / Kaffeehausatmosphäre
4. Wald (Wind, Blätter)
5. Hafen / Wassergeräusche

---

## Hintergründe (Reihenfolge)

1. Farbhintergründe (Schwarz, Dunkelgrau, Dunkelblau, Dunkelgrün, etc.)
2. Berge (Sonnenaufgang-Animation wie in MediApp)
3. Meer (Sonnenuntergang-Animation wie in MediApp)
4. Buddha (mit Flamme wie in MediApp)

---

## Design

- Angelehnt an Praxiswebsite tinnituspraxis-seedorf.de
- Ohr-Symbol als zentrales Icon
- **Praxis-Grün als Akzentfarbe:**
  - Primär: `#7ed957` (Hauptbuttons, aktive Elemente)
  - Dunkel: `#73bf53` (Hover, Varianten)
  - Hell: `#b2f795` (Highlights, sanfte Akzente)
- **Font: Inter** (modern, klar, kein iOS-Sprung-Problem)
- Modernerer Schriftzug (im Vergleich zur MediApp)
- Modern und warm – nicht klinisch kalt

---

## Technische Plattform

- HTML / CSS / JavaScript (wie MediApp)
- Web Audio API für gapless Loop mit Crossfade
- Capacitor für Android APK
- PWA mit Service Worker und Manifest
- Deployment: Subdomain tinnituspraxis-seedorf.de (noch festzulegen)

---

## Zeitrahmen

- Kein fixer Deadline
- Empfehlung: Erste lauffähige Version (Audio + Basis-UI) vor den Tinnitus Intensivtagen (Ende August 2026)
- Lead-Magnet-Integration sobald E-Mail-System bereitsteht

---

## Dateistruktur

```
C:\Users\Boris\Projekte\TinnitusMediApp\
├── CLAUDE.md
├── A - Projektbeschreibung.md           ← diese Datei
├── B - Aufgaben.md
├── C - Protokoll.md
├── F - Entscheidungen.md
├── 01-Basis/                            ← MediApp-Snapshot (Basis-Dateien)
├── 02-Audio/                            ← Field Recordings + Audio-Konzept
├── 03-Design/                           ← Icons, Farbcodes, Referenzen
├── 04-Deployment/                       ← Build-Scripts, PWA-Config
└── xold/
```

---

## Nächste Schritte

1. MediApp-Basis in `01-Basis/` kopieren (Snapshot 31.05.2026)
2. Web Audio API Crossfade-Konzept erarbeiten (Forschungsaufgabe)
3. Hintergrund-Reihenfolge im Code anpassen
4. 5 Field Recordings beschaffen (selbst aufgenommene + CCO-Quellen)
