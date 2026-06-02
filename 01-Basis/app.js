// Version
const APP_VERSION = 'v1.79';

// Statusleiste in nativer App transparent machen (Inhalt geht darunter durch)
window.addEventListener('load', () => {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    const { StatusBar } = window.Capacitor.Plugins;
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: 'DARK' });
  }
});

// Geräteerkennung
function isIOS() {
  return (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) &&
    !window.MSStream;
}

// Audio
let audioCtx = null;
let customAudioBuffer = null;
let rawAudioBuffer = null; // rohes ArrayBuffer – überlebt AudioContext-Neustarts

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    customAudioBuffer = null; // Buffer war an alten Context gebunden
  }
  return audioCtx;
}

async function playGong() {
  if (!rawAudioBuffer) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    try { await ctx.resume(); } catch (e) {}
  }
  if (!customAudioBuffer) {
    try {
      customAudioBuffer = await ctx.decodeAudioData(rawAudioBuffer.slice(0));
    } catch (e) {
      // Context beim Dekodieren gestorben – einmal neu versuchen
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      customAudioBuffer = null;
      try {
        customAudioBuffer = await audioCtx.decodeAudioData(rawAudioBuffer.slice(0));
      } catch (e2) {
        console.error('Dekodierung fehlgeschlagen:', e2);
        return;
      }
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = customAudioBuffer;
  source.connect(ctx.destination);
  source.start(ctx.currentTime);
}

// Timer-State
let durationMinutes = 40;
let remainingSeconds = 0;
let timerInterval = null;
let isRunning = false;

// Zwischen-Gong State
let zgongEnabled   = false;
let zgongMinutes   = 20;
let zgongRemaining = 0;
let zgongFired     = false;

// Dimm-State
let dimOpacity = 0;
let isDimmed = false;
let autoDimTimeout = null;

// Timer-Text-Dimm-State (alle Hintergründe, steuerbar per Checkbox)
let timerDimTimeout = null;
let timerDimEnabled = false;

// Berg-Modus: Gong kurz einblenden bei Tap
let bergRevealTimeout = null;
const bergTapLayer = document.getElementById('berg-tap-layer');

// Wake Lock
let wakeLock = null;
let wakeLockExtendTimer = null;

// DOM
const gongEl      = document.getElementById('gong');
const gongLabel   = document.getElementById('gong-label');
const timerText   = document.getElementById('timer-text');
const slider      = document.getElementById('duration-slider');
const minusBtn    = document.getElementById('minus-btn');
const plusBtn     = document.getElementById('plus-btn');
const overlay     = document.getElementById('overlay');
const audioMenu   = document.getElementById('audio-menu');
const navAudio    = document.getElementById('nav-audio');
const closeMenu   = document.getElementById('close-menu');
const fileInput   = document.getElementById('audio-file-input');
const currentName = document.getElementById('current-audio-name');
const klangBtns   = document.querySelectorAll('.klang-btn');
const dimSlider   = document.getElementById('dim-slider');
const dimLevelLabel = document.getElementById('dim-level-label');
const flickerCheckbox   = document.getElementById('flicker-checkbox');
const timerDimCheckbox  = document.getElementById('timer-dim-checkbox');
const flameFlicker    = document.getElementById('flame-flicker');
const bgSmile     = document.getElementById('bg-smile');
const buddhaAura  = document.getElementById('buddha-aura');
const appBgEl     = document.getElementById('app-bg');
const welleEl     = document.getElementById('w0');

// Zwischen-Gong DOM
const zgongCheckbox      = document.getElementById('zgong-checkbox');
const zgongSliderSection = document.getElementById('zgong-slider-section');
const zgongSliderEl      = document.getElementById('zgong-slider');
const zgongMaxLabel      = document.getElementById('zgong-max-label');
const zgongValueLabel    = document.getElementById('zgong-value-label');
const zgongDisplay       = document.getElementById('zgong-display');
const zgongTimeEl        = document.getElementById('zgong-time');

// Timer-Anzeige: jede Ziffer in fixen Span, verhindert iOS-Ruckeln
function renderTimer(timeStr) {
  timerText.innerHTML = timeStr.split('').map(ch =>
    `<span class="${ch === ':' ? 'colon' : 'digit'}">${ch}</span>`
  ).join('');
}

function renderZgongTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeStr = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  zgongTimeEl.innerHTML = timeStr.split('').map(ch =>
    `<span class="${ch === ':' ? 'colon' : 'digit'}">${ch}</span>`
  ).join('');
}

// Slider
function updateSliderProgress() {
  const val = parseInt(slider.value);
  const pct = ((val - 1) / (90 - 1)) * 100;
  slider.style.setProperty('--progress', pct + '%');
}

function updateDuration(val) {
  durationMinutes = val;
  slider.value = val;
  renderTimer(formatTime(val * 60));
  updateSliderProgress();
  localStorage.setItem('medi_dauer', val);
  updateZgongSliderRange();
}

function updateZgongSliderRange() {
  const max = Math.max(1, durationMinutes - 1);
  zgongSliderEl.max = max;
  zgongMaxLabel.textContent = max + ' Min';
  if (zgongMinutes > max) {
    zgongMinutes = max;
    zgongSliderEl.value = max;
    zgongValueLabel.textContent = 'nach ' + zgongMinutes + ' Minuten';
    localStorage.setItem('medi_zgong_minuten', zgongMinutes);
  }
  updateZgongSliderProgress();
}

function updateZgongSliderProgress() {
  const max = parseInt(zgongSliderEl.max);
  const val = parseInt(zgongSliderEl.value);
  const pct = max > 1 ? ((val - 1) / (max - 1)) * 100 : 0;
  zgongSliderEl.style.setProperty('--progress', pct + '%');
}

slider.addEventListener('input', () => {
  if (!isRunning) updateDuration(parseInt(slider.value));
});

minusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!isRunning && durationMinutes > 1) updateDuration(durationMinutes - 1);
});
plusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!isRunning && durationMinutes < 90) updateDuration(durationMinutes + 1);
});

// Timer
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function startTimer() {
  if (wakeLockExtendTimer) { clearTimeout(wakeLockExtendTimer); wakeLockExtendTimer = null; }
  remainingSeconds = durationMinutes * 60;
  isRunning = true;
  gongLabel.textContent = 'STOP';
  document.body.classList.add('running');
  slider.disabled = true;
  minusBtn.disabled = true;
  plusBtn.disabled = true;
  requestWakeLock();
  scheduleAutoDim();
  scheduleBuddhaSmile();
  triggerBuddhaSmileOnce();
  if (currentBg === 'berg') {
    updateBergScene(0);
    bergTapLayer.style.display = 'block';
    gongContainer.style.transition = 'opacity 2s ease';
    gongContainer.style.opacity = '0';
    gongContainer.style.zIndex = '1';
    startBergStars();
  }
  if (currentBg === 'meer') {
    updateMeerScene(0);
    bergTapLayer.style.display = 'block';
    gongContainer.style.transition = 'opacity 2s ease';
    gongContainer.style.opacity = '0';
    gongContainer.style.zIndex = '1';
  }
  if (timerDimEnabled) {
    brightenTimerText();
    scheduleTimerDim();
  }

  // Zwischen-Gong initialisieren
  zgongFired = false;
  if (zgongEnabled && zgongMinutes < durationMinutes) {
    zgongRemaining = zgongMinutes * 60;
    renderZgongTimer(zgongRemaining);
    zgongDisplay.classList.remove('hidden');
  } else {
    zgongRemaining = 0;
    zgongDisplay.classList.add('hidden');
  }

  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer(formatTime(remainingSeconds));
    if (currentBg === 'berg') {
      const total = durationMinutes * 60;
      updateBergScene(total > 0 ? 1 - (remainingSeconds / total) : 1);
    }
    if (currentBg === 'meer') {
      const total = durationMinutes * 60;
      updateMeerScene(total > 0 ? 1 - (remainingSeconds / total) : 1);
    }

    if (zgongEnabled && !zgongFired && zgongRemaining > 0) {
      zgongRemaining--;
      renderZgongTimer(zgongRemaining);
      if (zgongRemaining === 0) {
        zgongFired = true;
        zgongDisplay.classList.add('hidden');
        playGong();
        if (currentBg === 'buddha') swingGongZwischen();
        else if (currentBg !== 'berg' && currentBg !== 'meer') fireWave();
      }
    }

    if (remainingSeconds <= 0) finishTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  clearTimeout(autoDimTimeout);
  clearTimeout(timerDimTimeout);
  timerInterval = null;
  autoDimTimeout = null;
  timerDimTimeout = null;
  brightenTimerText();
  isRunning = false;
  gongLabel.textContent = 'START';
  document.body.classList.remove('running');
  slider.disabled = false;
  minusBtn.disabled = false;
  plusBtn.disabled = false;
  releaseWakeLock();
  brighten();
  stopBergStars();
  stopBuddhaSmile();
  triggerBuddhaSmileOnce();
  updateDuration(durationMinutes);
  if (currentBg === 'berg' || currentBg === 'meer') {
    clearTimeout(bergRevealTimeout);
    bergRevealTimeout = null;
    bergTapLayer.style.display = 'none';
    gongContainer.style.transition = 'opacity 1.5s ease';
    gongContainer.style.opacity = '';
    gongContainer.style.zIndex = '';
  }
  // Meer: Szene NICHT zurücksetzen – sie bleibt dunkel bis zum nächsten Start

  // Zwischen-Gong zurücksetzen
  zgongFired = false;
  zgongRemaining = 0;
  zgongDisplay.classList.add('hidden');
}

function finishTimer() {
  stopTimer();
  playGong();
  if (currentBg === 'buddha') swingGong(); else fireWave();
  // Nachklang: Screen noch 5 Minuten anlassen nach Ende der Meditation
  requestWakeLock();
  wakeLockExtendTimer = setTimeout(releaseWakeLock, 5 * 60 * 1000);
}

// Scheibenmitte + Durchmesser des gong_ohne_halter.png in Screen-Pixeln
function discGeometry() {
  const r     = gongEl.getBoundingClientRect();
  const scale = Math.min(r.width / IMG_W_GONG, r.height / IMG_H_GONG);
  const rendW = IMG_W_GONG * scale;
  const rendH = IMG_H_GONG * scale;
  const offX  = (r.width  - rendW) / 2;
  const offY  = (r.height - rendH) / 2;
  return {
    x:    r.left + offX + rendW * 0.5,
    y:    r.top  + offY + rendH * DISC_Y_PCT,
    size: rendH * DISC_R_PCT * 2
  };
}

function fireWave() {
  const g = discGeometry();
  welleEl.style.left   = g.x + 'px';
  welleEl.style.top    = g.y + 'px';
  welleEl.style.width  = g.size + 'px';
  welleEl.style.height = g.size + 'px';
  welleEl.classList.remove('aktiv');
  void welleEl.offsetWidth;
  welleEl.classList.add('aktiv');
}

// Gong-Animation (Haupttimer-Ende)
function swingGong() {
  if (gongEl.classList.contains('swinging')) return;
  gongEl.classList.add('swinging');
  gongEl.addEventListener('animationend', () => {
    gongEl.classList.remove('swinging');
  }, { once: true });
}

// Gong-Animation beim Zwischen-Gong: schwingt durch das Dimm-Overlay hindurch, blendet dann weich aus
const gongContainer = document.getElementById('gong-container');
function swingGongZwischen() {
  if (gongEl.classList.contains('swinging')) return;
  gongContainer.style.transition = 'none';
  gongContainer.style.opacity = '1';
  gongContainer.style.zIndex = '55';
  gongEl.classList.add('swinging');
  gongEl.addEventListener('animationend', () => {
    gongEl.classList.remove('swinging');
    // Zwei rAF-Durchläufe: erster lässt Browser opacity:1 committen,
    // zweiter startet erst dann die Überblendung
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gongContainer.style.transition = 'opacity 2.5s ease';
        gongContainer.style.opacity = '0';
        setTimeout(() => {
          gongContainer.style.zIndex = '';
          gongContainer.style.opacity = '';
          gongContainer.style.transition = '';
        }, 2700);
      });
    });
  }, { once: true });
}

// Buddha-Lächeln + Aura
let buddhaSmileTimer = null;
let buddhaSmileBusy  = false;

function triggerBuddhaSmile() {
  if (buddhaSmileBusy || !isRunning || currentBg !== 'buddha') return;
  buddhaSmileBusy = true;

  bgSmile.style.opacity    = '1';
  buddhaAura.style.opacity = '1';

  // 5 Sek. sichtbar, dann ausblenden
  setTimeout(() => {
    bgSmile.style.opacity    = '0';
    buddhaAura.style.opacity = '0';
  }, 6500);

  setTimeout(() => {
    buddhaSmileBusy = false;
  }, 8000);
}

function triggerBuddhaSmileOnce() {
  if (currentBg !== 'buddha') return;
  bgSmile.style.transition    = 'none';
  buddhaAura.style.transition = 'none';
  bgSmile.style.opacity    = '0';
  buddhaAura.style.opacity = '0';
  void bgSmile.offsetHeight; // erzwingt Reflow
  bgSmile.style.transition    = '';
  buddhaAura.style.transition = '';
  bgSmile.style.opacity    = '1';
  buddhaAura.style.opacity = '1';
  setTimeout(() => {
    bgSmile.style.opacity    = '0';
    buddhaAura.style.opacity = '0';
  }, 6500);
}

function scheduleBuddhaSmile() {
  clearTimeout(buddhaSmileTimer);
  if (!isRunning) return;
  const delay = 30000 + Math.random() * 15000; // 30–45 Sek. (TEST)
  buddhaSmileTimer = setTimeout(() => {
    triggerBuddhaSmile();
    scheduleBuddhaSmile();
  }, delay);
}

function stopBuddhaSmile() {
  clearTimeout(buddhaSmileTimer);
  buddhaSmileTimer = null;
  buddhaSmileBusy  = false;
  bgSmile.style.opacity    = '0';
  buddhaAura.style.opacity = '0';
}

// Timer-Text dimmen/aufhellen (Berg + Meer) – über #timer-row Container
function dimTimerText() {
  timerRow.style.transition = 'opacity 1.5s ease';
  timerRow.style.opacity = '0.3';
}

function brightenTimerText() {
  timerRow.style.transition = 'opacity 1s ease';
  timerRow.style.opacity = '1';
}

function scheduleTimerDim(delayMs = 3000) {
  clearTimeout(timerDimTimeout);
  if (!timerDimEnabled) return;
  timerDimTimeout = setTimeout(() => {
    if (isRunning && timerDimEnabled) dimTimerText();
  }, delayMs);
}

// Dimm-Logik
function dim() {
  // Abdunkelung gilt für alle Hintergründe – Ausnahme nur Berg (startet bewusst dunkel)
  if (dimOpacity === 0 || currentBg === 'berg') return;
  overlay.style.transitionDuration = '3s';
  overlay.style.opacity = dimOpacity;
  overlay.style.pointerEvents = 'auto';
  isDimmed = true;
}

function brighten() {
  overlay.style.transitionDuration = '1s';
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  isDimmed = false;
}

function scheduleAutoDim(delayMs = 3000) {
  clearTimeout(autoDimTimeout);
  if (dimOpacity > 0 && isRunning) {
    autoDimTimeout = setTimeout(() => {
      if (isRunning) dim();
    }, delayMs);
  }
}

// Overlay: Tap während abgedunkelt → nur aufhellen, bleibt hell bis zum nächsten Tipp
overlay.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isRunning && isDimmed) {
    brighten();
    if (timerDimEnabled) { clearTimeout(timerDimTimeout); brightenTimerText(); scheduleTimerDim(2500); }
  }
});

// Gong antippen
let gongLocked = false;
gongEl.addEventListener('click', (e) => {
  e.stopPropagation();
  if (gongLocked) return;
  gongLocked = true;
  setTimeout(() => { gongLocked = false; }, 1000);

  if (!isRunning) {
    playGong();
    if (currentBg === 'buddha') swingGong(); else fireWave();
    setTimeout(() => startTimer(), 500);
  } else {
    // Nur erreichbar wenn NICHT abgedunkelt – Overlay fängt Klick ab wenn dimmed
    stopTimer();
    playGong();
    if (currentBg === 'buddha') swingGong(); else fireWave();
  }
});

// Berg-Tap-Layer: Tap → Gong erscheint kurz, verschwindet nach 2,5 Sek. automatisch
bergTapLayer.addEventListener('click', (e) => {
  e.stopPropagation();
  clearTimeout(bergRevealTimeout);
  clearTimeout(timerDimTimeout);
  gongContainer.style.transition = 'opacity 1s ease';
  gongContainer.style.opacity = '0.7';
  gongContainer.style.zIndex = '3';
  brightenTimerText();
  bergRevealTimeout = setTimeout(() => {
    if (isRunning && (currentBg === 'berg' || currentBg === 'meer')) {
      gongContainer.style.transition = 'opacity 1.5s ease';
      gongContainer.style.opacity = '0';
      gongContainer.style.zIndex = '1';
      if (timerDimEnabled) dimTimerText();
    }
  }, 2500);
});

// Tap auf Display (nicht Gong, nicht Nav) während Timer hell läuft → abdunkeln + Timer aufhellen
document.addEventListener('click', (e) => {
  if (!isRunning || isDimmed) return;
  if (e.target.closest('#gong')) return;
  if (e.target.closest('#bottom-nav')) return;
  if (e.target.closest('#audio-menu')) return;
  clearTimeout(autoDimTimeout);
  dim();
  // Timer kurz aufhellen (gilt für alle Hintergründe außer berg/meer die eigenen Tap-Layer haben)
  if (timerDimEnabled && currentBg !== 'berg' && currentBg !== 'meer') {
    clearTimeout(timerDimTimeout);
    brightenTimerText();
    scheduleTimerDim(2500);
  }
});

// Wake Lock
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  }
}
async function releaseWakeLock() {
  if (wakeLock) { await wakeLock.release(); wakeLock = null; }
}

// Navigation: Menü öffnen/schließen
navAudio.addEventListener('click', () => {
  audioMenu.classList.remove('hidden');
});
closeMenu.addEventListener('click', () => {
  audioMenu.classList.add('hidden');
});

// Eigene MP3 laden
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  rawAudioBuffer = await file.arrayBuffer();
  customAudioBuffer = null; // wird beim nächsten Abspielen frisch dekodiert
  currentName.textContent = 'Aktuell: ' + file.name;
  klangBtns.forEach(b => b.classList.remove('selected'));
});

klangBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    const file = btn.dataset.file;
    const label = btn.dataset.label;
    try {
      const response = await fetch(encodeURI(file));
      if (!response.ok) throw new Error('Datei nicht gefunden');
      rawAudioBuffer = await response.arrayBuffer();
      customAudioBuffer = null; // wird beim nächsten Abspielen frisch dekodiert
      currentName.textContent = 'Aktuell: ' + label;
      klangBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      localStorage.setItem('medi_klang_file', file);
      localStorage.setItem('medi_klang_label', label);
    } catch (e) {
      console.error(label + ' konnte nicht geladen werden:', e);
    }
  });
});

// Abdunkelung einstellen
function updateDimLabel() {
  const v = Math.round(dimOpacity * 100);
  if (v === 0)       dimLevelLabel.textContent = 'Keine Abdunkelung';
  else if (v <= 20)  dimLevelLabel.textContent = 'Sehr leicht';
  else if (v <= 45)  dimLevelLabel.textContent = 'Leicht';
  else if (v <= 65)  dimLevelLabel.textContent = 'Mittel';
  else if (v <= 80)  dimLevelLabel.textContent = 'Stark';
  else               dimLevelLabel.textContent = 'Sehr stark';
}

function updateDimSliderProgress() {
  dimSlider.style.setProperty('--progress', dimSlider.value + '%');
}

dimSlider.addEventListener('input', () => {
  dimOpacity = dimSlider.value / 100;
  updateDimLabel();
  updateDimSliderProgress();
  localStorage.setItem('medi_abdunkelung', dimSlider.value);
});

// Flammen-Schein einstellen (Wert 0–100)
function updateFlameGlow(val) {
  const v = val / 100;
  const a1 = Math.min(1.0, v * 1.5).toFixed(3);
  const a2 = Math.min(1.0, v * 0.85).toFixed(3);
  const size = Math.round(180 + v * 220);
  document.documentElement.style.setProperty('--flame-a1', a1);
  document.documentElement.style.setProperty('--flame-a2', a2);
  document.documentElement.style.setProperty('--flame-size', size + 'px');
}

// Lebendige Flamme ein/aus
function setFlicker(enabled) {
  flameFlicker.classList.toggle('hidden', !enabled);
  flickerCheckbox.checked = enabled;
  updateFlameGlow(enabled ? 30 : 0);
  localStorage.setItem('medi_flackern', enabled ? '1' : '0');
}

flickerCheckbox.addEventListener('change', () => setFlicker(flickerCheckbox.checked));

// Hintergrundfarbe
const BG_OPTIONS = {
  'buddha':      null,
  'berg':        'berg',
  'meer':        'meer',
  'schwarz':     '#000000',
  'sehr-dunkel': '#111111',
  'dunkelgrau':  '#222222',
  'dunkelblau':  '#0a1828',
  'dunkelgruen': '#0d3510',
  'grasgruen':   '#246e1c',
  'warmes-gelb': '#c8a400',
};

let currentBg = 'buddha';

// Berg-Sonnenaufgang
let bergStarsCreated = false;

function createBergStars() {
  if (bergStarsCreated) return;
  const container = document.getElementById('berg-stars');
  if (!container) return;
  for (let i = 0; i < 75; i++) {
    const s = document.createElement('span');
    s.className = 'berg-star';
    const size = (Math.random() * 2 + 1).toFixed(1);
    s.style.width  = size + 'px';
    s.style.height = size + 'px';
    s.style.left   = (Math.random() * 100).toFixed(1) + '%';
    const topPct = Math.random() * 30;
    s.style.top    = topPct.toFixed(1) + '%';
    const brightnessScale = 1 - (topPct / 30) * 0.85;
    s.style.opacity = ((Math.random() * 0.55 + 0.25) * brightnessScale).toFixed(2);
  container.appendChild(s);
  }
  bergStarsCreated = true;
}

function updateBergScene(progress) {
  const overlay = document.getElementById('berg-overlay');
  const stars   = document.getElementById('berg-stars');
  if (!overlay || !stars) return;
  // Overlay: 0.90 (Nacht) → 0.08 (goldene Stunde)
  overlay.style.opacity = (0.90 - progress * 0.82).toFixed(3);
  // Sterne: sichtbar bis 35%, dann Ausblenden bis 65%
  let so = 1;
  if (progress > 0.35) so = Math.max(0, 1 - (progress - 0.35) / 0.30);
  stars.style.opacity = so.toFixed(3);
}

function showBergScene(show) {
  const overlay = document.getElementById('berg-overlay');
  const stars   = document.getElementById('berg-stars');
  if (!overlay || !stars) return;
  if (show) {
    createBergStars();
    overlay.style.display = 'block';
    stars.style.display   = 'block';
    updateBergScene(0);
  } else {
    overlay.style.display = 'none';
    stars.style.display   = 'none';
  }
}

// ── Berg: Sternschnuppen ──────────────────────────────────────────────────────
let bergStarTimer  = null;
let bergStarActive = false;

function fireBergStar() {
  if (bergStarActive) return;
  const starsEl = document.getElementById('berg-stars');
  if (!starsEl) return;
  const starsOpacity = parseFloat(starsEl.style.opacity) || 0;
  if (starsOpacity < 0.2) return;
  // In der Dämmerungsphase (0.2–0.5) zufällig auslassen
  if (starsOpacity < 0.5 && Math.random() > starsOpacity * 1.5) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const angleDeg = 25 + Math.random() * 20;
  const angleRad = angleDeg * Math.PI / 180;
  const ux = -Math.cos(angleRad);
  const uy =  Math.sin(angleRad);
  const peakX  = vw * (0.2 + Math.random() * 0.6);
  const peakY  = vh * (0.04 + Math.random() * 0.22);
  const preLen  = vw * (0.18 + Math.random() * 0.10);
  const postLen = vw * (0.15 + Math.random() * 0.10);
  const startTx = -ux * preLen;
  const startTy = -uy * preLen;
  const endTx   =  ux * postLen;
  const endTy   =  uy * postLen;
  const tailLen  = 50 + Math.random() * 35;
  const duration = 1200 + Math.random() * 600;
  const maxOp    = Math.min(0.85, starsOpacity * 0.85);

  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;left:${peakX}px;top:${peakY}px;width:0;height:0;pointer-events:none;z-index:1;`;
  const streak = document.createElement('div');
  streak.style.cssText = `position:absolute;left:-${tailLen/2}px;top:-1px;width:${tailLen}px;height:1.5px;background:linear-gradient(to right,rgba(210,225,255,0.75),rgba(200,218,255,0.35),rgba(190,210,255,0));border-radius:2px;transform:rotate(-${angleDeg}deg);transform-origin:center center;filter:drop-shadow(0 0 2px rgba(200,220,255,0.4));`;
  wrap.appendChild(streak);
  document.body.appendChild(wrap);
  bergStarActive = true;

  wrap.animate([
    { transform: `translate(${startTx}px,${startTy}px)`, opacity: 0 },
    { transform: `translate(${startTx*0.3}px,${startTy*0.3}px)`, opacity: maxOp * 0.9, offset: 0.35 },
    { transform: `translate(0px,0px)`, opacity: maxOp, offset: 0.5 },
    { transform: `translate(${endTx*0.6}px,${endTy*0.6}px)`, opacity: maxOp * 0.25, offset: 0.75 },
    { transform: `translate(${endTx}px,${endTy}px)`, opacity: 0 }
  ], { duration, easing: 'linear', fill: 'forwards' })
  .onfinish = () => { wrap.remove(); bergStarActive = false; };
}

function startBergStars() {
  stopBergStars();
  bergStarTimer = setTimeout(function fire() {
    if (!isRunning || currentBg !== 'berg') return;
    fireBergStar();
    const starsOpacity = parseFloat((document.getElementById('berg-stars') || {}).style?.opacity) || 0;
    if (starsOpacity > 0.05) {
      bergStarTimer = setTimeout(fire, 60000 + Math.random() * 240000);
    }
  }, 8000 + Math.random() * 4000);
}

function stopBergStars() {
  clearTimeout(bergStarTimer);
  bergStarTimer  = null;
  bergStarActive = false;
}

// Meer-Sonnenuntergang
const meerOverlay    = document.getElementById('meer-overlay');
const meerSunWrap    = document.getElementById('meer-sun-wrap');
const meerAura       = document.getElementById('meer-aura');
const meerSun        = document.getElementById('meer-sun');
const meerReflection  = document.getElementById('meer-sun-reflection');
const meerWaterColor  = document.getElementById('meer-water-color');

// Bildmaße + Horizontposition IM BILD (Anteil von oben). Daraus wird die
// Bildschirm-Position exakt berechnet – egal wie "cover" das Bild beschneidet.
const MEER_IMG_W        = 948;
const MEER_IMG_H        = 1659;
const MEER_HORIZON_FRAC = 0.58;  // Horizontlinie bei 58% der Bildhöhe
const MEER_SUN_SIZE     = 300;   // gesamtes Sonnen-Element inkl. Glühen
const MEER_DISC_PCT     = 0.24;  // Anteil des Gradients, der den hellen Ball ausmacht

// Rechnet die Horizontlinie in Bildschirm-Pixel um (berücksichtigt background-size: cover).
// WICHTIG: Höhe wird direkt aus der gerenderten #app-bg-Box GEMESSEN, nicht aus
// window.innerHeight/screen.height geraten. So sitzt der Horizont auf jedem Gerät
// (Android, iPhone, Safari, PWA) exakt richtig – am echten iPhone verifiziert.
function meerHorizonPx() {
  const rect = appBgEl.getBoundingClientRect();
  const vw = rect.width  || window.innerWidth;
  const vh = rect.height || window.innerHeight;
  const scale = Math.max(vw / MEER_IMG_W, vh / MEER_IMG_H); // cover: größerer Faktor
  const renderedH = MEER_IMG_H * scale;
  const offsetTop = (renderedH - vh) / 2; // oben abgeschnittener Teil
  return rect.top + (MEER_HORIZON_FRAC * renderedH - offsetTop);
}

function showMeerScene(show) {
  if (show) {
    meerOverlay.style.display    = 'block';
    meerSunWrap.style.display    = 'block';
    meerReflection.style.display = 'block';
    meerWaterColor.style.display = 'block';
    updateMeerScene(0);
  } else {
    meerOverlay.style.display    = 'none';
    meerSunWrap.style.display    = 'none';
    meerReflection.style.display = 'none';
    meerWaterColor.style.display = 'none';
  }
}

function updateMeerScene(progress) {
  const H = meerHorizonPx();             // Horizont in px von oben (cover-korrekt)
  meerSunWrap.style.height = H + 'px';   // Unterkante = Horizont, clippt Sonne+Aura

  const discR = MEER_SUN_SIZE * MEER_DISC_PCT; // sichtbarer Ball-Radius

  // Sonnen-Mittelpunkt relativ zur Horizontlinie: progress 0 → knapp über Horizont, sinkt mit progress
  const centerFromHorizon = 6 - progress * discR; // +6px über Horizont am Start

  // Farbe wird beim Sinken röter (Grün-/Blau-Anteil sinkt)
  const core = `rgba(255,255,${Math.round(220 - 120 * progress)},1)`;
  const mid1 = `rgba(255,${Math.round(215 - 90 * progress)},${Math.round(90 - 90 * progress)},1)`;
  const mid2 = `rgba(255,${Math.round(120 - 60 * progress)},0,0.95)`;
  const edge = `rgba(${Math.round(220 - 30 * progress)},40,0,0.45)`;

  // Sonne
  meerSun.style.bottom = (centerFromHorizon - MEER_SUN_SIZE / 2) + 'px';
  meerSun.style.background =
    `radial-gradient(circle, ${core} 0%, ${mid1} 8%, ${mid2} ${Math.round(MEER_DISC_PCT*100)}%, ${edge} 40%, rgba(180,30,0,0.15) 55%, transparent 72%)`;

  // Aura: großer Lichthof um die Sonne, wächst und intensiviert sich beim Untergang
  const auraSize  = 420 + 620 * progress;           // 420px → über 1000px
  const auraAlpha = (0.30 + 0.45 * progress).toFixed(2);
  meerAura.style.width      = auraSize + 'px';
  meerAura.style.height     = auraSize + 'px';
  meerAura.style.bottom     = (centerFromHorizon - auraSize / 2) + 'px';
  meerAura.style.background =
    `radial-gradient(circle, rgba(255,${Math.round(140 - 60*progress)},20,${auraAlpha}) 0%, ` +
    `rgba(255,${Math.round(90 - 50*progress)},0,${(auraAlpha*0.5).toFixed(2)}) 35%, ` +
    `rgba(200,40,0,${(auraAlpha*0.2).toFixed(2)}) 60%, transparent 80%)`;

  // Lichtstreifen auf dem Wasser, direkt unter dem Horizont, verblasst beim Sinken
  const reflAlpha = Math.max(0, 0.6 - progress * 0.6).toFixed(2);
  meerReflection.style.left    = '50%';
  meerReflection.style.top     = H + 'px';
  meerReflection.style.height  = Math.round(60 + 40 * (1 - progress)) + 'px';
  meerReflection.style.opacity = reflAlpha;
  meerReflection.style.background =
    'linear-gradient(to bottom, rgba(255,110,0,0.75), rgba(255,60,0,0.25), transparent)';

  // Overlay dunkelt zum Ende ab
  meerOverlay.style.opacity = (progress * 0.85).toFixed(3);

  // Wasserfarbe: warm orange → dunkelrot (3-Punkte-Verlauf, oberes Drittel bleibt am Ende sichtbar rot)
  const waterHeight = Math.max(0, window.innerHeight - H);
  meerWaterColor.style.top    = H + 'px';
  meerWaterColor.style.height = waterHeight + 'px';
  // Oben (Horizont): bleibt auch am Ende warm-dunkelrot sichtbar
  const r1 = Math.round(200 -  40 * progress);  // 200 → 160
  const g1 = Math.round(70  -  70 * progress);  // 70  →   0
  const a1 = Math.min(0.78, progress * 0.85).toFixed(2);
  // Mitte (~33%): Übergang
  const rM = Math.round(130 -  80 * progress);  // 130 →  50
  const aM = Math.min(0.55, progress * 0.65).toFixed(2);
  // Unten: dunkel
  const r2 = Math.round(80  -  50 * progress);  //  80 →  30
  const a2 = Math.min(0.35, progress * 0.42).toFixed(2);
  meerWaterColor.style.background =
    `linear-gradient(to bottom, rgba(${r1},${g1},0,${a1}) 0%, rgba(${rM},0,0,${aM}) 33%, rgba(${r2},0,0,${a2}) 100%)`;
}

function setBg(key) {
  currentBg = key;
  const color = BG_OPTIONS[key];
  const isBuddha  = color === null;
  const isBerg    = color === 'berg';
  const isMeer    = color === 'meer';

  if (isBuddha) {
    appBgEl.style.background = '';
    gongEl.classList.remove('farbmodus');
    showBergScene(false);
    showMeerScene(false);
    stopBergStars();
  } else if (isBerg) {
    appBgEl.style.background = 'url("berglandschaft_0.1.jpg") center center / cover no-repeat #000d18';
    gongEl.classList.add('farbmodus');
    showBergScene(true);
    showMeerScene(false);
    if (flickerCheckbox.checked) setFlicker(false);
  } else if (isMeer) {
    appBgEl.style.background = 'url("meer_0.2.jpg") center center / cover no-repeat #1a0a00';
    gongEl.classList.add('farbmodus');
    showBergScene(false);
    showMeerScene(true);
    stopBergStars();
    if (flickerCheckbox.checked) setFlicker(false);
  } else {
    appBgEl.style.background = color;
    gongEl.classList.add('farbmodus');
    showBergScene(false);
    showMeerScene(false);
    if (flickerCheckbox.checked) setFlicker(false);
  }
  // Lebendige Flamme nur bei Buddha sichtbar (Block erscheint/verschwindet)
  const flickerSection = document.getElementById('flicker-section');
  flickerSection.style.display = isBuddha ? '' : 'none';
  // Display-Abdunkelung gilt jetzt übergeordnet für alle – kein Ausgrauen mehr
  document.querySelectorAll('.bg-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.bg === key);
  });
  localStorage.setItem('medi_hintergrund', key);
}

document.querySelectorAll('.bg-swatch').forEach(btn => {
  btn.addEventListener('click', () => setBg(btn.dataset.bg));
});

// Zwischen-Gong Menü
zgongCheckbox.addEventListener('change', () => {
  zgongEnabled = zgongCheckbox.checked;
  zgongSliderSection.classList.toggle('hidden', !zgongEnabled);
  localStorage.setItem('medi_zgong_enabled', zgongEnabled ? '1' : '0');
});

zgongSliderEl.addEventListener('input', () => {
  zgongMinutes = parseInt(zgongSliderEl.value);
  zgongValueLabel.textContent = 'nach ' + zgongMinutes + ' Minuten';
  updateZgongSliderProgress();
  localStorage.setItem('medi_zgong_minuten', zgongMinutes);
});

// Layout-Berechnung
const timerArea = document.getElementById('timer-area');
const timerRow  = document.getElementById('timer-row');

const IMG_W = 852, IMG_H = 1846;
const BUDDHA_PCT  = 0.54;   // Buddha-Kopfkrone bei 54% der Bildhöhe
const FLAME_X_PCT = 0.8449; // Flammen-Fuß X
const FLAME_Y_PCT = 0.7378; // Flammen-Fuß Y
const AURA_X_PCT  = 0.28;   // Aura-Mitte X (Buddha-Kopf)
const AURA_Y_PCT  = 0.59;   // Aura-Mitte Y
const AURA_SIZE_PCT = 0.46; // Aura-Durchmesser als % der Bildbreite
const GONG_ASPECT = 312 / 360;
const IMG_W_GONG = 1024, IMG_H_GONG = 1536;
const DISC_Y_PCT = 0.537;
const DISC_R_PCT = 0.292;
const MIN_TIMER_ZONE = 115; // px Mindestplatz für Timer + Slider

// Auf iOS nutzt fixBgHeight() screen.height – Positionierung muss dasselbe tun
function bgViewH() {
  return isIOS() ? window.screen.height : window.innerHeight;
}

function getBuddhaScreenY() {
  const h = bgViewH();
  const scale = Math.max(window.innerWidth / IMG_W, h / IMG_H);
  const offsetY = (IMG_H * scale - h) / 2;
  return Math.round(IMG_H * BUDDHA_PCT * scale - offsetY);
}

function positionFlame() {
  const h = bgViewH();
  const scale = Math.max(window.innerWidth / IMG_W, h / IMG_H);
  const offsetX = (IMG_W * scale - window.innerWidth) / 2;
  const offsetY = (IMG_H * scale - h) / 2;
  const flameX = Math.round(IMG_W * FLAME_X_PCT * scale - offsetX);
  const flameY = Math.round(IMG_H * FLAME_Y_PCT * scale - offsetY);
  document.documentElement.style.setProperty('--flame-x', flameX + 'px');
  document.documentElement.style.setProperty('--flame-y', flameY + 'px');
}

function fixBgHeight() {
  const h = window.screen.height + 'px';
  const bg = document.getElementById('app-bg');
  if (bg) bg.style.height = h;
  if (bgSmile) bgSmile.style.height = h;
}

function positionAura() {
  const h = bgViewH();
  const scale   = Math.max(window.innerWidth / IMG_W, h / IMG_H);
  const offsetX = (IMG_W * scale - window.innerWidth) / 2;
  // X: Buddha-Mitte horizontal
  const auraX  = Math.round(IMG_W * AURA_X_PCT * scale - offsetX);
  // Y: relativ zur echten Buddha-Krone auf dem Bildschirm + Kopfzentrum
  const buddhaY    = getBuddhaScreenY();
  const headOffset = Math.round(IMG_H * 0.05 * scale);
  const auraY      = buddhaY + headOffset;
  // Größe: 22% der gerenderten Bildbreite
  const auraSize = Math.round(IMG_W * AURA_SIZE_PCT * scale);
  document.documentElement.style.setProperty('--aura-x',    auraX    + 'px');
  document.documentElement.style.setProperty('--aura-y',    auraY    + 'px');
  document.documentElement.style.setProperty('--aura-size', auraSize + 'px');
}

function forceRepaint() {
  const bg = document.getElementById('app-bg');
  if (!bg) return;
  bg.style.opacity = '0.999';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bg.style.opacity = '';
  }));
}

function initLayout() {
  fixBgHeight();
  const buddhaY = getBuddhaScreenY();
  const gongH = Math.min(360, buddhaY - MIN_TIMER_ZONE);
  const gongW = Math.round(gongH * GONG_ASPECT);
  document.documentElement.style.setProperty('--gong-height', gongH + 'px');
  document.documentElement.style.setProperty('--gong-width', gongW + 'px');
  positionFlame();
  positionAura();
  requestAnimationFrame(positionTimerArea);
}

function positionTimerArea() {
  const gongBottom = gongEl.getBoundingClientRect().bottom;
  const buddhaY = getBuddhaScreenY();
  timerArea.style.top = gongBottom + 'px';
  timerArea.style.height = (buddhaY - gongBottom) + 'px';
}

window.addEventListener('load', initLayout);
window.addEventListener('resize', initLayout);

// Overlay präventiv schwarz – via visibilitychange UND blur (power-button)
let overlayWasPreventive = false;

function setOverlayBlack() {
  if (!isRunning) {
    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'none';
    overlayWasPreventive = true;
  }
}

function fadeOverlayOut() {
  if (overlayWasPreventive) {
    overlayWasPreventive = false;
    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 1.5s ease';
      overlay.style.opacity = '0';
    });
  }
}

// Screen-Off via visibilitychange
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    setOverlayBlack();
  } else {
    fadeOverlayOut();
    fixBgHeight();
    initLayout();
    requestWakeLock();
  }
});

// Screen-Off via window blur (fängt Power-Button zuverlässiger ab)
window.addEventListener('blur', setOverlayBlack);
window.addEventListener('focus', fadeOverlayOut);

// Viewport-Resize (Statusbar erscheint/verschwindet): Repaint wenn Viewport wächst
if (window.visualViewport) {
  let lastVpHeight = window.visualViewport.height;
  window.visualViewport.addEventListener('resize', () => {
    const vh = window.visualViewport.height;
    if (vh > lastVpHeight) forceRepaint();
    lastVpHeight = vh;
  });
}

// Init
const savedDauer = parseInt(localStorage.getItem('medi_dauer'));
updateDuration((savedDauer >= 1 && savedDauer <= 90) ? savedDauer : 30);

const savedDim = localStorage.getItem('medi_abdunkelung');
const dimVal = savedDim !== null ? parseInt(savedDim) : 0;
dimOpacity = dimVal / 100;
dimSlider.value = dimVal;
updateDimLabel();
updateDimSliderProgress();

const savedFlackern = localStorage.getItem('medi_flackern');
setFlicker(savedFlackern === '1'); // Default: aus

// Timeranzeige abdunkeln laden
const savedTimerDim = localStorage.getItem('medi_timer_dim');
timerDimEnabled = savedTimerDim === '1';
timerDimCheckbox.checked = timerDimEnabled;

timerDimCheckbox.addEventListener('change', () => {
  timerDimEnabled = timerDimCheckbox.checked;
  localStorage.setItem('medi_timer_dim', timerDimEnabled ? '1' : '0');
  // Wenn gerade am laufen und nun deaktiviert: Timer sofort auf volle Helligkeit
  if (!timerDimEnabled && isRunning) { clearTimeout(timerDimTimeout); brightenTimerText(); }
});

const savedBg = localStorage.getItem('medi_hintergrund') || 'buddha';
setBg(savedBg);

// Zwischen-Gong wiederherstellen
const savedZgongEnabled = localStorage.getItem('medi_zgong_enabled');
zgongEnabled = savedZgongEnabled === '1';
zgongCheckbox.checked = zgongEnabled;
zgongSliderSection.classList.toggle('hidden', !zgongEnabled);

const savedZgongMin = parseInt(localStorage.getItem('medi_zgong_minuten'));
if (!isNaN(savedZgongMin) && savedZgongMin >= 1) zgongMinutes = savedZgongMin;
updateZgongSliderRange(); // setzt Max, klemmt Wert falls nötig
zgongSliderEl.value = zgongMinutes;
updateZgongSliderProgress();
zgongValueLabel.textContent = 'nach ' + zgongMinutes + ' Minuten';

if (isIOS()) {
  const hint = document.getElementById('ios-mute-hint');
  if (hint) hint.style.display = 'block';
  document.body.classList.add('ios');
}

requestWakeLock();

const versionEl = document.getElementById('app-version');
if (versionEl) versionEl.textContent = APP_VERSION;

// Gespeicherten Klang laden (Standard: Klangschale Morgenstern)
// Nur fetch – kein AudioContext nötig, Dekodierung erst beim ersten Abspielen
async function autoLoadKlang(file, label) {
  try {
    const response = await fetch(encodeURI(file));
    if (!response.ok) throw new Error('Datei nicht gefunden');
    rawAudioBuffer = await response.arrayBuffer();
    customAudioBuffer = null;
    currentName.textContent = 'Aktuell: ' + label;
    klangBtns.forEach(btn => btn.classList.toggle('selected', btn.dataset.file === file));
  } catch (e) {
    console.error('Auto-Laden fehlgeschlagen:', e);
  }
}

const savedFile  = localStorage.getItem('medi_klang_file')  || 'Sounds/Klangschale Morgenstern.mp3';
const savedLabel = localStorage.getItem('medi_klang_label') || 'Klangschale Morgenstern';
autoLoadKlang(savedFile, savedLabel);

// Audio-Warm-up: beim ersten Antippen der Seite AudioContext erstellen
// und Buffer dekodieren – so gibt es beim ersten Gong-Tap keine Verzögerung
function warmUpAudio() {
  document.removeEventListener('pointerdown', warmUpAudio);
  if (!rawAudioBuffer) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!customAudioBuffer) {
    ctx.decodeAudioData(rawAudioBuffer.slice(0))
      .then(buf => { customAudioBuffer = buf; })
      .catch(() => {});
  }
}
document.addEventListener('pointerdown', warmUpAudio);

// Update-Check
async function checkForUpdate() {
  const btn    = document.getElementById('update-btn');
  const status = document.getElementById('update-status');
  btn.disabled = true;
  btn.textContent = '⏳ Prüfe...';
  try {
    const baseUrl = (window.Capacitor && window.Capacitor.isNativePlatform())
      ? 'https://boris1900.github.io/Meditation-App/'
      : '';
    const res  = await fetch(baseUrl + 'app.js?t=' + Date.now(), { cache: 'no-store' });
    const text = await res.text();
    const match = text.match(/const APP_VERSION\s*=\s*'([^']+)'/);
    const latest = match ? match[1] : null;
    if (!latest) throw new Error('Version nicht lesbar');
    if (latest === APP_VERSION) {
      status.textContent = '✅ Du hast die aktuelle Version.';
    } else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      const apkUrl = `https://github.com/Boris1900/Meditation-App/releases/download/${latest}/Augenblick-${latest}.apk`;
      status.innerHTML = `🆕 Update verfügbar! <button onclick="window.open('${apkUrl}','_system')" style="margin-left:6px;padding:4px 10px;border-radius:8px;border:none;background:#b47832;color:#fff;font-size:11px;font-weight:600;cursor:pointer;">APK laden</button>`;
    } else {
      status.innerHTML = '🆕 Update verfügbar! <button onclick="applyUpdate()" style="margin-left:6px;padding:4px 10px;border-radius:8px;border:none;background:#b47832;color:#fff;font-size:11px;font-weight:600;cursor:pointer;">Jetzt laden</button>';
    }
  } catch (e) {
    status.textContent = '⚠️ Prüfung fehlgeschlagen.';
  }
  btn.textContent = '🔄 Auf Update prüfen';
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
      fetch('app.js',    { cache: 'reload' }),
      fetch('style.css', { cache: 'reload' }),
    ]);
  } catch (e) {}
  window.location.href = window.location.pathname + '?v=' + Date.now();
}

// Cache-Buster-Parameter nach Update-Reload wieder entfernen
if (window.location.search) {
  history.replaceState(null, '', window.location.pathname);
}
