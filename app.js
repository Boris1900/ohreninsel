// Version
const APP_VERSION = 'v0.9.36';
document.addEventListener('DOMContentLoaded', () => {
  const mv = document.getElementById('menu-version');
  if (mv) mv.textContent = APP_VERSION;

  // Feedback-Link: mailto mit Betreff + automatisch Gerät & Version,
  // damit Boris bei Rückmeldungen sofort den Kontext sieht.
  const fb = document.getElementById('feedback-btn');
  if (fb) {
    const ua = navigator.userAgent;
    const geraet = /iPhone/.test(ua) ? 'iPhone'
                 : /iPad/.test(ua)   ? 'iPad'
                 : /Android/.test(ua) ? 'Android'
                 : 'Computer/Sonstiges';
    const subject = `Feedback zur Ohreninsel (${APP_VERSION})`;
    const body = `\n\n\n— — —\nMein Gerät: ${geraet} · App-Version: ${APP_VERSION}`;
    fb.href = `mailto:post@tinnituspraxis-seedorf.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
});

// â”€â”€ Service Worker (nicht auf localhost â€“ sonst stört der Cache beim Entwickeln) â”€
const isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if ('serviceWorker' in navigator && !isLocalDev) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// â”€â”€ Capacitor: Statusleiste transparent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.addEventListener('load', () => {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    const { StatusBar } = window.Capacitor.Plugins;
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: 'DARK' });
  }
});

// Misst den aktuellen safe-area-inset-top und friert ihn als CSS-Variable
// --safe-top ein. Wird aufgerufen, SOLANGE die Statusleiste noch sichtbar ist
// (direkt vor StatusBar.hide). So bleibt das Header-Padding konstant und der
// obere Bereich springt beim Aus-/Einblenden der Leiste nicht mehr.
function freezeSafeAreaTop() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;'
    + 'padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  const top = getComputedStyle(probe).paddingTop;
  probe.remove();
  if (top && top !== '0px') {
    document.documentElement.style.setProperty('--safe-top', top);
  }
}

function hideStatusBar() {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    freezeSafeAreaTop();   // Wert sichern, solange die Leiste noch da ist
    window.Capacitor.Plugins.StatusBar.hide();
  }
}
function showStatusBar() {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    window.Capacitor.Plugins.StatusBar.show();
  }
}

// Wake Lock: haelt das Display an, solange eine Sitzung laeuft. Ohne ihn legt
// Android die App bei Display-Aus schlafen -> lange Timer (End-Gong, Einschlaf-
// Ausblenden) feuern nicht mehr. Muster aus der MeditationsApp. Der Lock geht
// bei Display-Aus/App-Wechsel verloren und wird per visibilitychange neu geholt.
let wakeLock = null;
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  }
}
async function releaseWakeLock() {
  if (wakeLock) { try { await wakeLock.release(); } catch (e) {} wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isRunning) requestWakeLock();
});

// â”€â”€ DOM-Refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const body       = document.body;
const startBtn   = document.getElementById('start-btn');
const statusW    = document.getElementById('status-word');
const slider     = document.getElementById('duration-slider');
const timerDisp  = document.getElementById('timer-display');
const sliderRow  = document.getElementById('slider-row');
const dimSlider  = document.getElementById('dim-slider');
const dimOverlay = document.getElementById('dim-overlay');
const bgEl       = document.getElementById('bg');

// â”€â”€ UI-State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Glow-Animation (JS-gesteuert, kein CSS-Keyframe) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Auto-Dim â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Audio-Konstanten â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CF_DUR           = 4;    // Crossfade am Loop-Punkt (Sekunden)
const FADE_IN          = 1;    // Einblenden beim normalen Start
const STOP_FADE_OUT    = 1.0;  // Ausblenden bei manuellem Stop (gleich wie FADE_IN)
const GONG_FADEIN      = 3;    // Ambient Fade-in nach Start-Gong
const MEDI_END_FADE    = 6;    // Meditieren: Ausblenden am Ende (Sekunden)

// â”€â”€ Audio-State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Hilfsfunktionen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getSelectedFile() {
  const tile = document.querySelector('.sound-tile.active');
  return tile ? (tile.dataset.file || '') : '';
}

function getSelectedGongFile() {
  const tile = document.querySelector('.gong-tile.active');
  return tile ? tile.dataset.file : null;
}


// â”€â”€ Datei laden, dekodieren + cachen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Crossfade-Scheduler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ EIN persistenter AudioContext (iOS-tauglich) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// iOS limitiert die Zahl der AudioContexts und bindet Audio an User-Gesten.
// Darum genau EINEN Context erstellen, bei Gesten aufwärmen und NIE schließen.
function ensureCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Bei jeder Berührung den Context aufwärmen (resume läuft so in der Geste)
document.addEventListener('pointerdown', () => { ensureCtx(); }, { passive: true });

// â”€â”€ Audio starten â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function startAudio(filePath, fadeInDur = FADE_IN) {
  const ctx = ensureCtx();
  if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (_) {} }

  // Neuer Track-Gain im bestehenden Context (kein neuer Context!)
  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  decodedBuffer = decodedCache.get(filePath);

  isAudioActive = true;
  nextSrcStart  = ctx.currentTime;

  const t = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setValueAtTime(0, t);
  masterGain.gain.linearRampToValueAtTime(1, t + fadeInDur);

  runScheduler();
}

// â”€â”€ Gong abspielen (eigener AudioContext â€“ schwingt nach Stop weiter aus) â”€â”€â”€â”€â”€
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

// â”€â”€ Meditieren-Countdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Audio stoppen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function stopAudio(withFade = true) {
  isAudioActive = false;
  clearTimeout(schedulerTimer);

  const ctx   = audioCtx;          // persistent â€“ NICHT schließen, NICHT auf null
  const gain  = masterGain;
  const nodes = activeNodes.splice(0);
  masterGain  = null;
  activeNodes = [];

  function cleanup() {
    nodes.forEach(({ source, gain: g }) => {
      try { source.stop(); } catch (_) {}
      try { g.disconnect(); } catch (_) {}
    });
    try { if (gain) gain.disconnect(); } catch (_) {}
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

// â”€â”€ App stoppen (UI + Audio) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  showStatusBar();
  releaseWakeLock();
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

// â”€â”€ Start / Stop Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€ Session starten (zentral für Hauptseite + Meditieren) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// mode: 'ambient' (endlos) | 'einschlafen' (Timer + Ausblenden) | 'meditieren' (Gong)
async function startSession({ mode, filePath, minutes, gongFile }) {
  clearTimeout(stopVisualTimer);
  body.classList.remove('stopping');

  const gongOn = mode === 'meditieren' && !!gongFile;

  // Benötigte Dateien vorab laden
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
  hideStatusBar();
  requestWakeLock();
  elemHidden = false;
  autoDimActive = false;
  removeAutoDim();
  statusW.textContent = 'Läuft';
  startGlow();

  // Audio starten (bei "Nur Gong" läuft kein Dauerklang)
  if (filePath) {
    const fadeIn = gongOn ? GONG_FADEIN : FADE_IN;
    await startAudio(filePath, fadeIn);
  }
  if (gongOn) playGong(gongFile);

  const dimDelay = mode === 'meditieren' ? 3000 : 1500;
  autoFade = setTimeout(() => {
    elemHidden = true;
    body.classList.add('idle');
    applyAutoDim();
  }, dimDelay);

  const totalMs   = minutes * 60 * 1000;
  const totalSecs = minutes * 60;

  if (mode === 'meditieren' && minutes > 0) {
    body.classList.add('medi-active', 'medi-mode');
    startCountdown(totalMs);
  }
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

      timerTimeout = setTimeout(() => { if (isRunning) doStop(false); }, totalMs);

    } else if (mode === 'meditieren') {
      if (gongOn) {
        // End-Gong: Gong schlägt an, parallel Ambient ausblenden
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
        if (totalMs > MEDI_END_FADE * 1000) {
          endFadeTimer = setTimeout(() => {
            if (!isRunning || !masterGain || !audioCtx) return;
            const now = audioCtx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0, now + MEDI_END_FADE);
          }, totalMs - MEDI_END_FADE * 1000);
        }
        timerTimeout = setTimeout(() => { if (isRunning) doStop(false); }, totalMs);
      }
    }
  }
}

// â”€â”€ Großer Play-Button: Hauptseite (Ambient / Einschlafen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isRunning) { doStop(true); return; }
  const filePath = getSelectedFile();
  const chipMin  = parseInt(document.querySelector('.chip.active')?.dataset.min || 0);
  const minutes  = chipMin > 0 ? parseInt(slider.value) : 0;
  const mode     = minutes > 0 ? 'einschlafen' : 'ambient';
  startSession({ mode, filePath, minutes, gongFile: null });
});

// â”€â”€ Tap auf Hintergrund = Bedienelemente ein-/ausblenden (Toggle) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Alle Sounds + Gongs laden + Splash ausblenden â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const minWait = new Promise(r => setTimeout(r, 2500));
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
  showMuteHintOnce();
  checkWhatsNew();
}
initApp();

// ── Stummschalter-Hinweis (iPhone, vom Homescreen gestartet) ──────────────
// iOS schaltet Web-Audio-Ausgabe (AudioContext) stumm, wenn der seitliche
// Stummschalter aktiv ist – anders als bei nativen Apps gibt es dafür in
// Safari/PWA keine Umgehung über die AudioSession-API.
function showMuteHintOnce() {
  const isIPhone = /iPhone/.test(navigator.userAgent);
  const isStandalone = navigator.standalone === true;
  if (!isIPhone || !isStandalone) return;
  if (localStorage.getItem('ohreninsel-mute-hint-shown')) return;

  const hint = document.createElement('div');
  hint.id = 'mute-hint';
  hint.innerHTML =
    '<p><strong>Kein Ton?</strong> Schalte den Stummschalter an der linken Seite deines iPhones aus.</p>' +
    '<p><strong>Tipp für die Nacht:</strong> Stell das iPhone in den Flugmodus oder den Nicht-stören-Modus. So unterbricht keine eingehende Nachricht deine Klangkulisse.</p>' +
    '<button type="button">Verstanden</button>';
  document.body.appendChild(hint);

  // Erst beim Bestätigen merken – sonst ginge der Hinweis verloren,
  // falls die App während der Einblendung geschlossen wird.
  hint.querySelector('button').addEventListener('click', () => {
    localStorage.setItem('ohreninsel-mute-hint-shown', '1');
    hint.classList.remove('show');
    setTimeout(() => hint.remove(), 600);
  });
  setTimeout(() => hint.classList.add('show'), 1200);
}

// ── „Was ist neu" nach einem Update ───────────────────────────────────────
// Zeigt einmalig nach einem Versionswechsel, was sich geändert hat.
// Frisch Installierte (leerer Speicher) werden NICHT mit einem Changelog
// begrüßt – sie sehen nichts, es wird nur die Version gemerkt.
const CHANGELOG = {
  'v0.9.33': ['Klang der Kulissen „Vögel" und „Berg" in höherer Qualität'],
};

function checkWhatsNew() {
  const seenKey = 'ohreninsel-seen-version';
  const seen = localStorage.getItem(seenKey);
  if (seen === APP_VERSION) return;

  // Nicht mit dem Stummschalter-Hinweis kollidieren: ist der gerade sichtbar,
  // stellen wir das Pop-up für diesen Start zurück (Version NICHT als gesehen
  // merken), damit es beim nächsten Öffnen nachgeholt wird – so überlappen sich
  // die beiden Kästchen nie.
  if (document.getElementById('mute-hint')) return;

  // Kennen wir den Nutzer schon? (hat bereits irgendeinen ohreninsel-Wert)
  let bekannt = false;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('ohreninsel-') && k !== seenKey) { bekannt = true; break; }
  }

  const punkte = CHANGELOG[APP_VERSION];
  localStorage.setItem(seenKey, APP_VERSION);   // ab jetzt gemerkt
  if (punkte && (seen !== null || bekannt)) {
    showWhatsNew(punkte);
  }
}

function showWhatsNew(punkte) {
  const card = document.createElement('div');
  card.id = 'whatsnew';
  card.innerHTML =
    '<p class="wn-title">Neu in dieser Version</p>' +
    '<ul>' + punkte.map(p => '<li>' + p + '</li>').join('') + '</ul>' +
    '<button type="button">Verstanden</button>';
  document.body.appendChild(card);
  card.querySelector('button').addEventListener('click', () => {
    card.classList.remove('show');
    setTimeout(() => card.remove(), 600);
  });
  setTimeout(() => card.classList.add('show'), 1200);
}

// â”€â”€ Sound-Kacheln (immer genau eine aktiv â€“ kein Abwählen mehr) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tippen verhält sich wie Swipen: Hintergrund wechselt und â€“ falls Audio läuft â€“
// wird per Crossfade auf den neuen Klang umgeblendet (switchToCarousel).
document.querySelectorAll('.sound-tile').forEach(tile => {
  tile.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tile.classList.contains('active')) return; // schon aktiv â†’ nichts tun
    const ci = carouselItems.findIndex(item => item.key === tile.dataset.sound);
    if (ci !== -1) switchToCarousel(ci, 0);
  });
});

// â”€â”€ Einschlaf-Timer-Chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  });
});

// â”€â”€ Gong-Klangschalen (im Meditieren-Panel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.querySelectorAll('.gong-tile').forEach(tile => {
  tile.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.gong-tile').forEach(t => t.classList.remove('active'));
    tile.classList.add('active');
  });
});

// â”€â”€ Dauer-Slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
slider.addEventListener('input', () => updateDisplay(parseInt(slider.value)));

function updateDisplay(min) {
  const h = Math.floor(min / 60), m = min % 60;
  timerDisp.textContent = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:00`
    : `${String(m).padStart(2, '0')}:00`;
}

// â”€â”€ Display abdunkeln â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
dimSlider.addEventListener('input', () => {
  const val = parseInt(dimSlider.value) / 100;
  if (!isRunning || autoDimActive) {
    dimOverlay.style.transition = 'opacity 0.3s ease';
    dimOverlay.style.opacity = val;
  }
});

// â”€â”€ Hintergrund-Slide-Transition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const bgSlideEl = document.getElementById('bg-slide');
let bgSliding       = false;
let bgSlidingTarget = null; // letzter Ziel-Hintergrund bei schnellen Wischfolgen

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
  // Schnelles zweites Wischen waehrend Animation laeuft:
  // Hintergrund sofort setzen, aber letztes Ziel merken –
  // damit der laufende Timeout am Ende den richtigen Hintergrund einrastet.
  if (bgSliding) {
    bgSlidingTarget = newCls;
    setBg(newCls);
    return;
  }
  bgSliding       = true;
  bgSlidingTarget = newCls;

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
    bgEl.style.transition = 'none';
    bgEl.style.transform  = '';
    setBg(bgSlidingTarget);           // letztes Ziel, nicht das urspruengliche
    bgEl.offsetHeight;
    bgEl.style.transition = '';
    bgSlideEl.style.transition = 'none';
    bgSlideEl.style.transform  = 'translateX(100%)';
    bgSliding       = false;
    bgSlidingTarget = null;
  }, 420);
}

// â”€â”€ Hintergrund + Sonnen-Theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  // Gleichen Hintergrund auf <html> legen: das Wurzelelement wird auf iOS NICHT
  // am Viewport abgeschnitten und reicht bis zum physischen Bildschirmrand. So
  // wird die tote untere Zone (innerHeight < screen.height) mit demselben Bild
  // gefuellt -> kein blauer Streifen mehr in der iOS-PWA.
  document.documentElement.style.background = bgStyleMap[cls] || '#0b1a0b';
  document.querySelectorAll('.bg-swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.bg === cls));
  body.classList.remove('theme-meer','theme-berg','theme-blau','theme-nacht','theme-wald','theme-bach','theme-regen','theme-cafe');
  body.classList.toggle('theme-photo', photoBgs.has(cls));
  if (sunTheme[cls]) body.classList.add(sunTheme[cls]);
}

document.querySelectorAll('.bg-swatch').forEach(s =>
  s.addEventListener('click', () => setBg(s.dataset.bg)));

// â”€â”€ Menü â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Sheet-Handle: Tap oder Wischen nach unten schliesst das Menue
(function() {
  const handle = mSheet.querySelector('.sheet-handle');
  let dragY0 = null;

  handle.addEventListener('pointerdown', (e) => {
    dragY0 = e.clientY;
    handle.setPointerCapture(e.pointerId);
    mSheet.style.transition = 'none';
    mSheet.style.overflowY  = 'hidden'; // Scroll waehrend Drag unterbinden
  });

  handle.addEventListener('pointermove', (e) => {
    if (dragY0 === null) return;
    const dy = Math.max(0, e.clientY - dragY0);
    mSheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
  });

  handle.addEventListener('pointerup', (e) => {
    if (dragY0 === null) return;
    const dy = e.clientY - dragY0;
    dragY0 = null;
    mSheet.style.transition = '';
    mSheet.style.transform  = '';
    mSheet.style.overflowY  = '';       // Scroll wieder freigeben
    if (dy > 60 || Math.abs(dy) < 12) {
      mOver.classList.remove('open');
      mSheet.classList.remove('open');
    }
  });

  handle.addEventListener('pointercancel', () => {
    dragY0 = null;
    mSheet.style.transition = '';
    mSheet.style.transform  = '';
    mSheet.style.overflowY  = '';
  });
})();

// â”€â”€ Swipe-Navigation (Sound + Hintergrund wechseln) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// touch-action: pan-y auf #stage (CSS) gibt horizontale Gesten an JS ab â€“
// funktioniert auf Android WebView und iOS Safari PWA ohne preventDefault-Hack.

// Berg hat noch keinen Sound â€“ erscheint im Karussell, ändert nur den Hintergrund
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

// pointerdown merkt sich Start nur wenn im Stage-Bereich (nicht im #lower-Panel)
stageEl.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary) return;
  const lower = document.getElementById('lower');
  if (lower && e.clientY >= lower.getBoundingClientRect().top - 10) return;
  swipeStartX = e.clientX;
  swipeStartY = e.clientY;
  didSwipe = false;
});

// pointerup auf document-Ebene – verhindert haengengebliebenen State wenn
// der Finger auf Android ausserhalb von #stage losgelassen wird
document.addEventListener('pointerup', (e) => {
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

// pointercancel: Android-Gesten-System übernimmt → State bereinigen
document.addEventListener('pointercancel', (e) => {
  if (e.isPrimary) swipeStartX = null;
});

// â”€â”€ Update-Check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function checkForUpdate() {
  const btn    = document.getElementById('update-btn');
  const status = document.getElementById('update-status');
  btn.disabled = true;
  btn.textContent = '⏳ Prüfe...';
  try {
    const baseUrl = (window.Capacitor && window.Capacitor.isNativePlatform())
      ? 'https://boris1900.github.io/ohreninsel/'
      : '';
    const res   = await fetch(baseUrl + 'app.js?t=' + Date.now(), { cache: 'no-store' });
    const text  = await res.text();
    const match = text.match(/const APP_VERSION\s*=\s*'([^']+)'/);
    const latest = match ? match[1] : null;
    if (!latest) throw new Error('Version nicht lesbar');
    if (latest === APP_VERSION) {
      status.textContent = '✅ Du hast die aktuelle Version.';
    } else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      const apkUrl = `https://github.com/Boris1900/ohreninsel/releases/download/${latest}/Ohreninsel-${latest}.apk`;
      status.innerHTML = `🆕 Update verfügbar! <button onclick="window.open('${apkUrl}','_system')" style="margin-left:6px;padding:4px 10px;border-radius:8px;border:none;background:rgba(126,217,87,0.8);color:#000;font-size:11px;font-weight:600;cursor:pointer;">APK laden</button>`;
    } else {
      status.innerHTML = `🆕 Update verfügbar! <button onclick="applyUpdate()" style="margin-left:6px;padding:4px 10px;border-radius:8px;border:none;background:rgba(126,217,87,0.8);color:#000;font-size:11px;font-weight:600;cursor:pointer;">Jetzt laden</button>`;
    }
  } catch (e) {
    status.textContent = '⚠️ Prüfung fehlgeschlagen.';
  }
  btn.textContent = 'Auf Update prüfen';
  btn.disabled = false;
}

async function applyUpdate() {
  const status = document.getElementById('update-status');
  status.textContent = '⏳ Wird geladen...';
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  } catch (e) {}
  try {
    await Promise.all([
      fetch('index.html', { cache: 'reload' }),
      fetch('app.js',     { cache: 'reload' }),
      fetch('style.css',  { cache: 'reload' }),
    ]);
  } catch (e) {}
  window.location.href = window.location.pathname + '?v=' + Date.now();
}

// â”€â”€ Meditieren-Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mediEntry     = document.getElementById('medi-entry');
const mediOverlay   = document.getElementById('medi-overlay');
const mediSheet     = document.getElementById('medi-sheet');
const mediSlider    = document.getElementById('medi-duration-slider');
const mediTimerDisp = document.getElementById('medi-timer-display');
const mediStartBtn  = document.getElementById('medi-start-btn');
let mediKlang = 'klang-gong'; // 'klang' (nur Klang) | 'klang-gong' | 'gong' (nur Gong)

function updateMediDisplay(min) {
  const h = Math.floor(min / 60), m = min % 60;
  mediTimerDisp.textContent = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:00`
    : `${String(m).padStart(2, '0')}:00`;
}

function openMediPanel()  { mediOverlay.classList.add('open');    mediSheet.classList.add('open'); }
function closeMediPanel() { mediOverlay.classList.remove('open'); mediSheet.classList.remove('open'); }

mediEntry.addEventListener('click', (e) => { e.stopPropagation(); openMediPanel(); });
mediOverlay.addEventListener('click', closeMediPanel);

// Meditieren-Sheet-Handle: Tap oder Wischen nach unten schliesst das Panel
(function() {
  const handle = mediSheet.querySelector('.sheet-handle');
  let dragY0 = null;

  handle.addEventListener('pointerdown', (e) => {
    dragY0 = e.clientY;
    handle.setPointerCapture(e.pointerId);
    mediSheet.style.transition = 'none';
    mediSheet.style.overflowY  = 'hidden';
  });

  handle.addEventListener('pointermove', (e) => {
    if (dragY0 === null) return;
    const dy = Math.max(0, e.clientY - dragY0);
    mediSheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
  });

  handle.addEventListener('pointerup', (e) => {
    if (dragY0 === null) return;
    const dy = e.clientY - dragY0;
    dragY0 = null;
    mediSheet.style.transition = '';
    mediSheet.style.transform  = '';
    mediSheet.style.overflowY  = '';
    if (dy > 60 || Math.abs(dy) < 12) {
      closeMediPanel();
    }
  });

  handle.addEventListener('pointercancel', () => {
    dragY0 = null;
    mediSheet.style.transition = '';
    mediSheet.style.transform  = '';
    mediSheet.style.overflowY  = '';
  });
})();

// Dauer-Chips
document.querySelectorAll('.medi-chip').forEach(chip => {
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.medi-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const min = parseInt(chip.dataset.min);
    mediSlider.value = min;
    updateMediDisplay(min);
  });
});

// Dauer-Slider (Feintuning, hält die Chips synchron)
mediSlider.addEventListener('input', () => {
  const val = parseInt(mediSlider.value);
  updateMediDisplay(val);
  document.querySelectorAll('.medi-chip').forEach(c =>
    c.classList.toggle('active', parseInt(c.dataset.min) === val));
});

// Klang-Variante: Nur Klang / Klang + Gong / Nur Gong
document.querySelectorAll('.medi-toggle').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.medi-toggle').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mediKlang = btn.dataset.medi;
    // Gong-Schalen nur wählbar, wenn Gong dabei ist
    mediSheet.classList.toggle('no-gong', mediKlang === 'klang');
  });
});

// Meditation starten
mediStartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeMediPanel();
  const filePath = mediKlang === 'gong'  ? '' : getSelectedFile();
  const gongFile = mediKlang === 'klang' ? null : getSelectedGongFile();
  const minutes  = parseInt(mediSlider.value);
  startSession({ mode: 'meditieren', filePath, minutes, gongFile });
});

// Debug-Param VOR dem URL-Cleanup abgreifen
const _debugMode = new URLSearchParams(window.location.search).has('debug');
// URL nur bereinigen wenn KEIN ?debug drin – sonst sieht iOS beim "Zum Homescreen hinzufügen" die falsche URL
if (window.location.search && !_debugMode) {
  history.replaceState(null, '', window.location.pathname);
}

// ── Debug-Overlay (per ?debug aktivieren) ──────────────────────────────────
// Zeigt iOS-spezifische Messwerte live an – nur für Diagnose des Bodenstreifens.
// Katharina öffnet: https://boris1900.github.io/ohreninsel/?debug
// Dann fotografieren, danach gezielt fixen.
if (_debugMode) {
  // CSS-Trick: padding-bottom:env(safe-area-inset-bottom) auslesen
  const _probe = document.createElement('div');
  _probe.style.cssText = 'position:fixed;bottom:0;left:0;width:0;height:0;' +
    'padding-bottom:env(safe-area-inset-bottom);pointer-events:none;visibility:hidden;';
  document.body.appendChild(_probe);

  const _dbg = document.createElement('div');
  _dbg.style.cssText =
    'position:fixed;top:44px;right:8px;z-index:9999;' +
    'background:rgba(0,0,0,0.82);color:#7fed57;' +
    'font:11px/1.65 monospace;padding:8px 11px;border-radius:8px;' +
    'pointer-events:none;white-space:pre;';
  document.body.appendChild(_dbg);

  function _dbgUpdate() {
    const safeB = getComputedStyle(_probe).paddingBottom;
    const appR  = document.getElementById('app')?.getBoundingClientRect();
    const bgR   = document.getElementById('bg')?.getBoundingClientRect();
    _dbg.textContent =
      '── iOS Debug ──\n' +
      `screen.h:    ${screen.height}\n` +
      `innerH:      ${window.innerHeight}\n` +
      `vpH:         ${visualViewport ? Math.round(visualViewport.height) : 'n/a'}\n` +
      `safe-bot:    ${safeB}\n` +
      `#app h:      ${appR ? appR.height.toFixed(1) : 'n/a'}\n` +
      `#app.bottom: ${appR ? appR.bottom.toFixed(1) : 'n/a'}\n` +
      `#bg  h:      ${bgR  ? bgR.height.toFixed(1)  : 'n/a'}\n` +
      `#bg.bottom:  ${bgR  ? bgR.bottom.toFixed(1)  : 'n/a'}`;
    requestAnimationFrame(_dbgUpdate);
  }
  _dbgUpdate();
}

