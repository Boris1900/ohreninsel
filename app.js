// Version
const APP_VERSION = 'v0.7.2';
document.addEventListener('DOMContentLoaded', () => {
  const mv = document.getElementById('menu-version');
  if (mv) mv.textContent = APP_VERSION;
});

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ── Capacitor: Statusleiste transparent ──────────────────────────────────────
window.addEventListener('load', () => {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    const { StatusBar } = window.Capacitor.Plugins;
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: 'DARK' });
  }
});

// ── DOM-Refs ──────────────────────────────────────────────────────────────────
const body       = document.body;
const startBtn   = document.getElementById('start-btn');
const statusW    = document.getElementById('status-word');
const slider     = document.getElementById('duration-slider');
const timerDisp  = document.getElementById('timer-display');
const sliderRow  = document.getElementById('slider-row');
const dimSlider  = document.getElementById('dim-slider');
const dimOverlay = document.getElementById('dim-overlay');
const bgEl       = document.getElementById('bg');
const modeRow    = document.getElementById('mode-row');
const gongSection = document.getElementById('gong-section');
const gongSchalen = document.getElementById('gong-schalen');
const gongCheck  = document.getElementById('gong-check');

// ── UI-State ──────────────────────────────────────────────────────────────────
let isRunning       = false;
let elemHidden      = false;
let carouselIdx     = 2; // Startposition: Vögel (wird durch localStorage überschrieben)
let autoFade        = null;
let stopVisualTimer = null;
let glowRafId       = null;
let glowPhase       = 0;
let endFadeTimer    = null;   // für Einschlafen/Meditieren Fade-out
let countdownInterval = null; // für Meditieren-Timer-Anzeige
let mediActiveTimer = null;   // für verzögertes Einblenden von #lower nach Stop
let autoDimActive   = false;  // Auto-Dim läuft gerade

// ── Glow-Animation (JS-gesteuert, kein CSS-Keyframe) ─────────────────────────
function startGlow() {
  startBtn.style.setProperty('--glow-transition', '0ms');
  let lastTs = null;
  function tick(ts) {
    if (!isRunning) return;
    if (lastTs !== null) glowPhase += (ts - lastTs) / 4000;
    lastTs = ts;
    const t = glowPhase % 1;
    const opacity = 0.45 + 0.55 * (0.5 - 0.5 * Math.cos(t * 2 * Math.PI));
    startBtn.style.setProperty('--glow-opacity', opacity.toFixed(3));
    glowRafId = requestAnimationFrame(tick);
  }
  glowRafId = requestAnimationFrame(tick);
}

function stopGlow() {
  cancelAnimationFrame(glowRafId);
  glowRafId = null;
  startBtn.style.setProperty('--glow-transition', '1.5s ease');
  requestAnimationFrame(() => {
    startBtn.style.setProperty('--glow-opacity', '0');
  });
}

// ── Auto-Dim ──────────────────────────────────────────────────────────────────
function applyAutoDim() {
  autoDimActive = true;
  dimOverlay.style.transition = 'opacity 2s ease';
  dimOverlay.style.opacity = parseInt(dimSlider.value) / 100;
}

function removeAutoDim() {
  autoDimActive = false;
  dimOverlay.style.transition = 'opacity 0.4s ease';
  dimOverlay.style.opacity = '0';
}

// ── Audio-Konstanten ──────────────────────────────────────────────────────────
const CF_DUR           = 4;    // Crossfade am Loop-Punkt (Sekunden)
const FADE_IN          = 1;    // Einblenden beim normalen Start
const STOP_FADE_OUT    = 1.5;  // Ausblenden bei manuellem Stop
const GONG_FADEIN      = 3;    // Ambient Fade-in nach Start-Gong
const MEDI_END_FADE    = 6;    // Meditieren: Ausblenden am Ende (Sekunden)

// ── Audio-State ───────────────────────────────────────────────────────────────
let audioCtx      = null;
let masterGain    = null;
let decodedBuffer = null;
let isAudioActive = false;
let activeNodes   = [];
let nextSrcStart  = 0;
let schedulerTimer = null;
let timerTimeout   = null;

const decodedCache = new Map();
const loadPromises = new Map();

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function getSelectedFile() {
  const tile = document.querySelector('.sound-tile.active');
  return tile ? (tile.dataset.file || '') : '';
}

function getSelectedGongFile() {
  const tile = document.querySelector('.gong-tile.active');
  return tile ? tile.dataset.file : null;
}

function getMode() {
  const chipMin = parseInt(document.querySelector('.chip.active')?.dataset.min || 0);
  if (chipMin === 0) return 'ambient';
  const activeMode = document.querySelector('.mode-chip.active');
  return activeMode?.dataset.mode || 'einschlafen';
}

// ── Modus-Sichtbarkeit aktualisieren ─────────────────────────────────────────
function updateModeVisibility() {
  const chipMin = parseInt(document.querySelector('.chip.active')?.dataset.min || 0);
  const hasTimer = chipMin > 0;
  const hasSound = !!getSelectedFile();
  const mediChip = document.querySelector('.mode-chip[data-mode="meditieren"]');

  if (!hasTimer) {
    modeRow.classList.add('collapsed');
    gongSection.classList.add('collapsed');
    return;
  }

  modeRow.classList.remove('collapsed');

  const currentMode = document.querySelector('.mode-chip.active')?.dataset.mode;
  // Gong-Sektion nur bei Meditieren
  gongSection.classList.toggle('collapsed', currentMode !== 'meditieren');
  body.classList.toggle('medi-selected', currentMode === 'meditieren');
}

// ── Datei laden, dekodieren + cachen ─────────────────────────────────────────
async function loadFile(filePath) {
  if (decodedCache.has(filePath)) return;
  if (loadPromises.has(filePath)) return loadPromises.get(filePath);

  const p = (async () => {
    const encoded = filePath.split('/').map(encodeURIComponent).join('/');
    const resp = await fetch(encoded);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = await resp.arrayBuffer();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ctx.decodeAudioData(raw);
    ctx.close();
    decodedCache.set(filePath, buf);
  })();

  loadPromises.set(filePath, p);
  return p;
}

// ── Crossfade-Scheduler ───────────────────────────────────────────────────────
function scheduleSource() {
  const t0  = nextSrcStart;
  const dur = decodedBuffer.duration;
  const cf  = CF_DUR;

  const source = audioCtx.createBufferSource();
  source.buffer = decodedBuffer;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(1, t0 + cf);
  gain.gain.setValueAtTime(1, t0 + dur - cf);
  gain.gain.linearRampToValueAtTime(0, t0 + dur);

  source.connect(gain);
  gain.connect(masterGain);
  source.start(t0);
  source.stop(t0 + dur + 0.1);

  activeNodes.push({ source, gain, endTime: t0 + dur });
  nextSrcStart = t0 + dur - cf;
}

function runScheduler() {
  if (!isAudioActive) return;
  while (nextSrcStart < audioCtx.currentTime + 2.0) {
    scheduleSource();
  }
  activeNodes = activeNodes.filter(({ gain, endTime }) => {
    if (endTime < audioCtx.currentTime - 1) {
      try { gain.disconnect(); } catch (_) {}
      return false;
    }
    return true;
  });
  schedulerTimer = setTimeout(runScheduler, 250);
}

// ── Audio starten ─────────────────────────────────────────────────────────────
async function startAudio(filePath, fadeInDur = FADE_IN) {
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  if (audioCtx.state === 'suspended') await audioCtx.resume();

  decodedBuffer = decodedCache.get(filePath);

  isAudioActive = true;
  nextSrcStart  = audioCtx.currentTime;

  const t = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(0, t);
  masterGain.gain.linearRampToValueAtTime(1, t + fadeInDur);

  runScheduler();
}

// ── Gong abspielen (eigener AudioContext – schwingt nach Stop weiter aus) ─────
function playGong(filePath) {
  const buf = decodedCache.get(filePath);
  if (!buf) return;

  // Eigener Kontext: unabhängig vom Ambient-Stop, räumt sich selbst auf
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();

  const gongGain = ctx.createGain();
  gongGain.gain.value = 0.6;
  gongGain.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = buf;
  source.connect(gongGain);
  source.start();

  source.onended = () => { try { ctx.close(); } catch (_) {} };
}

// ── Meditieren-Countdown ──────────────────────────────────────────────────────
function startCountdown(totalMs) {
  const el = document.getElementById('medi-timer');
  const startTime = Date.now();

  function tick() {
    const remaining = Math.max(0, totalMs - (Date.now() - startTime));
    const secs = Math.ceil(remaining / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    el.textContent = h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  tick();
  countdownInterval = setInterval(tick, 500);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = null;
}

// Kleiner Timer rechts unten (für Einschlafen-Modus)
function startSmallCountdown(totalMs) {
  const startTime = Date.now();
  function tick() {
    const remaining = Math.max(0, totalMs - (Date.now() - startTime));
    const secs = Math.ceil(remaining / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    timerDisp.textContent = h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  countdownInterval = setInterval(tick, 500);
}

// ── Audio stoppen ─────────────────────────────────────────────────────────────
function stopAudio(withFade = true) {
  isAudioActive = false;
  clearTimeout(schedulerTimer);

  const ctx   = audioCtx;
  const gain  = masterGain;
  const nodes = activeNodes.splice(0);
  audioCtx    = null;
  masterGain  = null;
  activeNodes = [];

  function cleanup() {
    nodes.forEach(({ source, gain: g }) => {
      try { source.stop(); } catch (_) {}
      try { g.disconnect(); } catch (_) {}
    });
    try { ctx.close(); } catch (_) {}
  }

  if (withFade && gain && ctx) {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + STOP_FADE_OUT);
    setTimeout(cleanup, STOP_FADE_OUT * 1000 + 200);
  } else {
    cleanup();
  }
}

// ── App stoppen (UI + Audio) ──────────────────────────────────────────────────
function doStop(withAudioFade = true) {
  isRunning = false;
  clearTimeout(autoFade);
  clearTimeout(timerTimeout);
  clearTimeout(stopVisualTimer);
  clearTimeout(endFadeTimer);
  clearTimeout(mediActiveTimer);
  stopCountdown();
  updateDisplay(parseInt(slider.value)); // kleinen Timer zurücksetzen
  const wasMedi = body.classList.contains('medi-active');
  body.classList.remove('idle', 'medi-mode');
  body.classList.add('stopping');
  elemHidden = false;
  statusW.textContent = 'Start';
  stopGlow();
  removeAutoDim();
  if (isAudioActive) stopAudio(withAudioFade);

  // Meditieren: erst Countdown ausblenden (600ms), dann #lower einblenden
  if (wasMedi) {
    mediActiveTimer = setTimeout(() => body.classList.remove('medi-active'), 600);
  } else {
    body.classList.remove('medi-active');
  }

  stopVisualTimer = setTimeout(() => {
    body.classList.remove('running', 'stopping');
  }, STOP_FADE_OUT * 1000 + 100);
}

// ── Start / Stop Button ───────────────────────────────────────────────────────
startBtn.addEventListener('click', async (e) => {
  e.stopPropagation();

  if (isRunning) {
    doStop(true);
    return;
  }

  clearTimeout(stopVisualTimer);
  body.classList.remove('stopping');

  const filePath = getSelectedFile();
  const mode     = getMode();
  const gongOn   = mode === 'meditieren' && gongCheck.checked;
  const gongFile = gongOn ? getSelectedGongFile() : null;

  // Alle benötigten Dateien vorab laden
  const loadQueue = [];
  if (filePath && !decodedCache.has(filePath)) loadQueue.push(filePath);
  if (gongFile && !decodedCache.has(gongFile)) loadQueue.push(gongFile);

  if (loadQueue.length > 0) {
    try {
      startBtn.disabled = true;
      statusW.textContent = 'Lädt…';
      await Promise.all(loadQueue.map(f => loadFile(f)));
      startBtn.disabled = false;
    } catch {
      statusW.textContent = 'Fehler';
      startBtn.disabled = false;
      return;
    }
  }

  isRunning = true;
  glowPhase = 0;
  startBtn.style.setProperty('--glow-opacity', '0');
  startBtn.style.setProperty('--glow-transition', '0ms');
  body.classList.add('running');
  body.classList.remove('idle');
  elemHidden = false;
  autoDimActive = false;
  removeAutoDim();
  statusW.textContent = 'Läuft';
  startGlow();

  // Audio starten
  if (filePath) {
    const fadeIn = (gongOn && gongFile) ? GONG_FADEIN : FADE_IN;
    await startAudio(filePath, fadeIn);
  }
  // Start-Gong
  if (gongOn && gongFile) playGong(gongFile);

  const dimDelay = mode === 'meditieren' ? 3000 : 1500;
  autoFade = setTimeout(() => {
    elemHidden = true;
    body.classList.add('idle');
    applyAutoDim();
  }, dimDelay);

  // Timer-Logik
  const chipMin   = parseInt(document.querySelector('.chip.active')?.dataset.min || 0);
  const minutes   = chipMin > 0 ? parseInt(slider.value) : 0;
  const totalMs  = minutes * 60 * 1000;
  const totalSecs = minutes * 60;

  // Meditieren-Modus: Countdown + #lower ausblenden
  if (mode === 'meditieren' && minutes > 0) {
    body.classList.add('medi-active');
    body.classList.add('medi-mode');
    startCountdown(totalMs);
  }
  // Einschlafen-Modus: kleinen Timer-Display runterzählen lassen
  if (mode === 'einschlafen' && minutes > 0) {
    startSmallCountdown(totalMs);
  }

  if (minutes > 0) {
    if (mode === 'einschlafen') {
      // Ausblenden über letztes Sechstel der Zeit, maximal 10 Minuten
      const fadeSecs    = Math.min(totalSecs / 6, 600);
      const fadeStartMs = (totalSecs - fadeSecs) * 1000;

      endFadeTimer = setTimeout(() => {
        if (!isRunning || !masterGain || !audioCtx) return;
        const now = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + fadeSecs);
      }, fadeStartMs);

      timerTimeout = setTimeout(() => {
        if (!isRunning) return;
        doStop(false);
      }, totalMs);

    } else {
      // Meditieren
      if (gongOn && gongFile) {
        // End-Gong: Gong schlägt an, parallel Ambient über MEDI_END_FADE Sekunden ausblenden
        timerTimeout = setTimeout(() => {
          if (!isRunning) return;
          playGong(gongFile);
          if (masterGain && audioCtx) {
            const now = audioCtx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0, now + MEDI_END_FADE);
          }
          setTimeout(() => { if (isRunning) doStop(false); }, MEDI_END_FADE * 1000 + 200);
        }, totalMs);
      } else {
        // Kein Gong: letzte MEDI_END_FADE Sekunden sanft ausblenden
        if (totalMs > MEDI_END_FADE * 1000) {
          endFadeTimer = setTimeout(() => {
            if (!isRunning || !masterGain || !audioCtx) return;
            const now = audioCtx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0, now + MEDI_END_FADE);
          }, totalMs - MEDI_END_FADE * 1000);
        }
        timerTimeout = setTimeout(() => {
          if (!isRunning) return;
          doStop(false);
        }, totalMs);
      }
    }
  }
});

// ── Tap auf Hintergrund = Bedienelemente ein-/ausblenden (Toggle) ────────────
document.getElementById('app').addEventListener('click', (e) => {
  if (didSwipe) { didSwipe = false; return; }
  if (!isRunning) return;
  if (e.target.closest('button, input, label')) return;
  clearTimeout(autoFade);
  elemHidden = !elemHidden;
  body.classList.toggle('idle', elemHidden);
  if (elemHidden) {
    applyAutoDim();
  } else {
    removeAutoDim();
    autoFade = setTimeout(() => {
      elemHidden = true;
      body.classList.add('idle');
      applyAutoDim();
    }, 4000);
  }
});

// ── Alle Sounds + Gongs laden + Splash ausblenden ────────────────────────────
async function preloadAllSounds() {
  const tiles = document.querySelectorAll('.sound-tile[data-file], .gong-tile[data-file]');
  const promises = [];
  tiles.forEach(tile => {
    const file = tile.dataset.file;
    if (file) promises.push(loadFile(file).catch(() => {}));
  });
  await Promise.all(promises);
}

async function initApp() {
  const splash  = document.getElementById('splash');
  const minWait = new Promise(r => setTimeout(r, 3000));
  await Promise.all([preloadAllSounds(), minWait]);
  // Letzten Stand aus localStorage wiederherstellen (Standard: Vögel/Wald)
  const saved = parseInt(localStorage.getItem('ohreninsel-carousel') ?? '2');
  carouselIdx = (saved >= 0 && saved < carouselItems.length) ? saved : 2;
  const startItem = carouselItems[carouselIdx];
  const startTile = document.querySelector(`.sound-tile[data-sound="${startItem.key}"]`);
  if (startTile) startTile.classList.add('active');
  setBg(startItem.bg);
  splash.classList.add('fade-out');
  setTimeout(() => splash.remove(), 1000);
}
initApp();

// ── Sound-Kacheln (abwählbar per zweitem Tap) ─────────────────────────────────
document.querySelectorAll('.sound-tile').forEach(tile => {
  tile.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tile.classList.contains('active')) {
      tile.classList.remove('active');
    } else {
      document.querySelectorAll('.sound-tile').forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      const autoBg = soundBgMap[tile.dataset.sound];
      if (autoBg) setBg(autoBg);
      const ci = carouselItems.findIndex(item => item.key === tile.dataset.sound);
      if (ci !== -1) { carouselIdx = ci; localStorage.setItem('ohreninsel-carousel', ci); }
    }
    updateModeVisibility();
  });
});

// ── Timer-Chips ───────────────────────────────────────────────────────────────
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const min = parseInt(chip.dataset.min);
    if (min === 0) {
      sliderRow.classList.add('collapsed');
    } else {
      slider.value = min;
      updateDisplay(min);
      sliderRow.classList.remove('collapsed');
    }
    updateModeVisibility();
  });
});

// ── Modus-Chips ───────────────────────────────────────────────────────────────
document.querySelectorAll('.mode-chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    updateModeVisibility();
  });
});

// ── Gong-Checkbox ─────────────────────────────────────────────────────────────
gongCheck.addEventListener('change', () => {
  gongSection.classList.toggle('gong-active', gongCheck.checked);
});

// ── Gong-Klangschalen ─────────────────────────────────────────────────────────
document.querySelectorAll('.gong-tile').forEach(tile => {
  tile.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.gong-tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');
  });
});

// ── Dauer-Slider ──────────────────────────────────────────────────────────────
slider.addEventListener('input', () => updateDisplay(parseInt(slider.value)));

function updateDisplay(min) {
  const h = Math.floor(min / 60), m = min % 60;
  timerDisp.textContent = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:00`
    : `${String(m).padStart(2, '0')}:00`;
}

// ── Display abdunkeln ─────────────────────────────────────────────────────────
dimSlider.addEventListener('input', () => {
  const val = parseInt(dimSlider.value) / 100;
  if (!isRunning || autoDimActive) {
    dimOverlay.style.transition = 'opacity 0.3s ease';
    dimOverlay.style.opacity = val;
  }
});

// ── Hintergrund-Slide-Transition ──────────────────────────────────────────────
const bgSlideEl = document.getElementById('bg-slide');
let bgSliding = false;

const bgStyleMap = {
  'bg-meer':       "url('meer_0.2.jpg') center/cover no-repeat",
  'bg-berg':       "url('berglandschaft_0.1.jpg') center/cover no-repeat",
  'bg-nacht-meer': "url('nacht_meer_0.1.jpg') center/cover no-repeat",
  'bg-wald':       "url('wald_0.1.jpg') center/cover no-repeat",
  'bg-bach':       "url('bach_0.1.jpg') center/cover no-repeat",
  'bg-regen':      "url('regen_0.1.jpg') center/cover no-repeat",
  'bg-cafe':       "url('cafe_0.1.jpg') center/cover no-repeat",
  'bg-blau':       '#080e18',
  'bg-grau':       '#141414',
  'bg-nacht':      '#0d3510',
  'bg-schwarz':    '#000',
  '':              '#0b1a0b',
};

function slideBg(newCls, direction) {
  if (bgSliding) { setBg(newCls); return; }
  bgSliding = true;

  const enterFrom = direction < 0 ? '100%' : '-100%';
  const exitTo    = direction < 0 ? '-100%' : '100%';

  bgSlideEl.style.background  = bgStyleMap[newCls] || '#0b1a0b';
  bgSlideEl.style.transition  = 'none';
  bgSlideEl.style.transform   = `translateX(${enterFrom})`;
  bgEl.style.transition       = 'none';
  bgEl.style.transform        = 'translateX(0)';

  bgSlideEl.offsetHeight; // reflow

  const ease = 'cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.38s';
  bgSlideEl.style.transition = `transform ${ease}`;
  bgEl.style.transition      = `transform ${ease}`;
  bgSlideEl.style.transform  = 'translateX(0)';
  bgEl.style.transform       = `translateX(${exitTo})`;

  setTimeout(() => {
    bgEl.style.transition = 'none';   // kein background-Übergang beim Snap
    bgEl.style.transform  = '';       // zurück auf Position 0 (unsichtbar hinter bg-slide)
    setBg(newCls);                    // Klasse wechseln – sofort, kein Flash
    bgEl.offsetHeight;                // reflow erzwingen
    bgEl.style.transition = '';       // normale CSS-Transition wiederherstellen
    bgSlideEl.style.transition = 'none';
    bgSlideEl.style.transform  = 'translateX(100%)';
    bgSliding = false;
  }, 420);
}

// ── Hintergrund + Sonnen-Theme ────────────────────────────────────────────────
const sunTheme = {
  'bg-meer':      'theme-meer',
  'bg-berg':      'theme-berg',
  'bg-blau':      'theme-blau',
  'bg-nacht':     'theme-nacht',
  'bg-nacht-meer':'theme-nacht',
  'bg-wald':      'theme-wald',
  'bg-bach':      'theme-bach',
  'bg-regen':     'theme-regen',
  'bg-cafe':      'theme-cafe',
};

const photoBgs = new Set(['bg-meer','bg-berg','bg-nacht-meer','bg-wald','bg-bach','bg-regen','bg-cafe']);

const soundBgMap = {
  wellen:   'bg-meer',
  rauschen: 'bg-nacht-meer',
  voegel:   'bg-wald',
  bach:     'bg-bach',
  regen:    'bg-regen',
  cafe:     'bg-cafe',
  berg:     'bg-berg',
};

function setBg(cls) {
  bgEl.className = cls;
  document.querySelectorAll('.bg-swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.bg === cls));
  body.classList.remove('theme-meer','theme-berg','theme-blau','theme-nacht','theme-wald','theme-bach','theme-regen','theme-cafe');
  body.classList.toggle('theme-photo', photoBgs.has(cls));
  if (sunTheme[cls]) body.classList.add(sunTheme[cls]);
}

document.querySelectorAll('.bg-swatch').forEach(s =>
  s.addEventListener('click', () => setBg(s.dataset.bg)));

// ── Menü ──────────────────────────────────────────────────────────────────────
const menuBtn = document.getElementById('menu-btn');
const mOver   = document.getElementById('menu-overlay');
const mSheet  = document.getElementById('menu-sheet');

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  mOver.classList.add('open');
  mSheet.classList.add('open');
});

mOver.addEventListener('click', () => {
  mOver.classList.remove('open');
  mSheet.classList.remove('open');
});

// ── Swipe-Navigation (Sound + Hintergrund wechseln) ──────────────────────────
// touch-action: pan-y auf #stage (CSS) gibt horizontale Gesten an JS ab –
// funktioniert auf Android WebView und iOS Safari PWA ohne preventDefault-Hack.

// Berg hat noch keinen Sound – erscheint im Karussell, ändert nur den Hintergrund
const carouselItems = [
  { key: 'wellen',   bg: 'bg-meer' },
  { key: 'rauschen', bg: 'bg-nacht-meer' },
  { key: 'voegel',   bg: 'bg-wald' },
  { key: 'bach',     bg: 'bg-bach' },
  { key: 'regen',    bg: 'bg-regen' },
  { key: 'cafe',     bg: 'bg-cafe' },
  { key: 'berg',     bg: 'bg-berg' },
];

let swipeStartX = null;
let swipeStartY = null;
let didSwipe    = false;

async function switchAudio(newFilePath) {
  stopAudio(true);
  if (!decodedCache.has(newFilePath)) await loadFile(newFilePath);
  if (!isRunning) return;
  await startAudio(newFilePath, STOP_FADE_OUT);
}

function switchToSound(soundKey, direction = 0) {
  const tile = document.querySelector(`.sound-tile[data-sound="${soundKey}"]`);
  if (!tile) return;
  document.querySelectorAll('.sound-tile').forEach(t => t.classList.remove('active'));
  tile.classList.add('active');
  const bg = soundBgMap[soundKey];
  if (bg) {
    if (direction !== 0) slideBg(bg, direction);
    else setBg(bg);
  }
  updateModeVisibility();
  if (isRunning && isAudioActive) {
    const newFile = tile.dataset.file;
    if (newFile) switchAudio(newFile);
  }
}

function switchToCarousel(idx, direction = 0) {
  const item = carouselItems[idx];
  carouselIdx = idx;
  localStorage.setItem('ohreninsel-carousel', idx);
  const tile = document.querySelector(`.sound-tile[data-sound="${item.key}"]`);
  if (tile) {
    switchToSound(item.key, direction);
  } else {
    // Berg: nur Hintergrund wechseln, aktiven Sound-Tile behalten
    if (direction !== 0) slideBg(item.bg, direction);
    else setBg(item.bg);
  }
}

const stageEl = document.getElementById('stage');

stageEl.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary) return;
  const lower = document.getElementById('lower');
  if (lower && e.clientY >= lower.getBoundingClientRect().top - 10) return;
  swipeStartX = e.clientX;
  swipeStartY = e.clientY;
  didSwipe = false;
});

stageEl.addEventListener('pointerup', (e) => {
  if (!e.isPrimary || swipeStartX === null) return;
  const dx = e.clientX - swipeStartX;
  const dy = e.clientY - swipeStartY;
  swipeStartX = null;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
  didSwipe = true;
  const direction = dx < 0 ? -1 : 1;
  const next = dx < 0
    ? (carouselIdx + 1) % carouselItems.length
    : (carouselIdx - 1 + carouselItems.length) % carouselItems.length;
  switchToCarousel(next, direction);
});

stageEl.addEventListener('pointercancel', () => { swipeStartX = null; });
