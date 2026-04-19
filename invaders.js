// ===== Jon defends Claire Invasion =====
// A Space Invaders tribute where Jon (green ship) must protect Claire (pink heart base)
// from waves of alien invaders. Works with keyboard on desktop and touch on mobile.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const scoreEl = document.getElementById('score');
  const waveEl = document.getElementById('wave');
  const livesEl = document.getElementById('lives');
  const claireHpEl = document.getElementById('claire-hp');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('start-btn');
  const soundBtn = document.getElementById('sound-toggle');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnFire = document.getElementById('btn-fire');

  // ----- Game constants -----
  const JON_WIDTH = 44;
  const JON_HEIGHT = 28;
  const JON_SPEED = 360;
  const BULLET_SPEED = 540;
  const ALIEN_BULLET_SPEED = 220;
  const FIRE_COOLDOWN = 0.32;
  const CLAIRE_MAX_HP = 100;
  const CLAIRE_HEIGHT = 48;

  const ROWS = 4;
  const COLS = 9;
  const ALIEN_W = 36;
  const ALIEN_H = 26;
  const ALIEN_GAP_X = 18;
  const ALIEN_GAP_Y = 16;
  const ALIEN_START_Y = 70;

  // ----- Game state -----
  const state = {
    running: false,
    paused: false,
    jon: { x: W / 2 - JON_WIDTH / 2, y: H - 60, w: JON_WIDTH, h: JON_HEIGHT },
    bullets: [],
    alienBullets: [],
    aliens: [],
    alienDir: 1,
    alienSpeed: 40,
    alienStepDown: 18,
    alienShootCooldown: 1.2,
    alienShootTimer: 1.2,
    particles: [],
    score: 0,
    wave: 1,
    lives: 3,
    claireHp: CLAIRE_MAX_HP,
    fireTimer: 0,
    invulnTimer: 0,
    stars: [],
    flash: 0,
    shakeT: 0,
  };

  // ----- Input (keyboard + touch) -----
  const keys = new Set();
  // Touch-driven flags: left/right/fire
  const touch = { left: false, right: false, fire: false };

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Space'].includes(e.key)) {
      e.preventDefault();
    }
    keys.add(e.key.toLowerCase());
    if (e.key === ' ') keys.add(' ');
    if (e.key.toLowerCase() === 'p' && state.running) togglePause();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === ' ') keys.delete(' ');
  });

  // Generic pointer-hold helper for touch buttons
  function bindHold(btn, flagName) {
    if (!btn) return;
    const press = (e) => {
      e.preventDefault();
      touch[flagName] = true;
      btn.classList.add('pressed');
      ensureAudio();
    };
    const release = (e) => {
      if (e) e.preventDefault();
      touch[flagName] = false;
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindHold(btnLeft, 'left');
  bindHold(btnRight, 'right');
  bindHold(btnFire, 'fire');

  // Tap-to-move: tapping on the canvas moves Jon toward the tap x
  let tapTargetX = null;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    tapTargetX = ((e.clientX - rect.left) / rect.width) * W;
    // Tap on canvas also fires a shot (handled in update via cooldown).
    touch.fire = true;
    ensureAudio();
  });
  canvas.addEventListener('pointerup', () => { touch.fire = false; tapTargetX = null; });
  canvas.addEventListener('pointercancel', () => { touch.fire = false; tapTargetX = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    if (tapTargetX === null) return;
    const rect = canvas.getBoundingClientRect();
    tapTargetX = ((e.clientX - rect.left) / rect.width) * W;
  });

  startBtn.addEventListener('click', startGame);

  // ----- Audio (Web Audio API procedural SFX) -----
  const audio = {
    ctx: null,
    muted: localStorage.getItem('jdc-muted') === '1',
    master: null,
  };

  function ensureAudio() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = audio.muted ? 0 : 0.25;
    audio.master.connect(audio.ctx.destination);
  }

  function setMuted(m) {
    audio.muted = m;
    localStorage.setItem('jdc-muted', m ? '1' : '0');
    if (audio.master) audio.master.gain.value = m ? 0 : 0.25;
    if (soundBtn) soundBtn.innerHTML = m ? '&#128263;' : '&#128266;';
  }
  if (soundBtn) {
    soundBtn.innerHTML = audio.muted ? '&#128263;' : '&#128266;';
    soundBtn.addEventListener('click', () => {
      ensureAudio();
      setMuted(!audio.muted);
    });
  }

  function tone({ freq = 440, type = 'square', dur = 0.12, gain = 0.4, sweep = 0, delay = 0, attack = 0.005, release = 0.08 }) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime + delay;
    const osc = audio.ctx.createOscillator();
    const g = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(g).connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  }

  function noiseBurst({ dur = 0.15, gain = 0.3, filterFreq = 1800, filterQ = 0.7, delay = 0 }) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime + delay;
    const bufferSize = Math.floor(audio.ctx.sampleRate * dur);
    const buffer = audio.ctx.createBuffer(1, bufferSize, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(audio.master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  const sfx = {
    shoot: () => tone({ freq: 900, type: 'square', dur: 0.08, gain: 0.18, sweep: -600, release: 0.02 }),
    alienHit: () => {
      tone({ freq: 220, type: 'sawtooth', dur: 0.12, gain: 0.22, sweep: -160 });
      noiseBurst({ dur: 0.18, gain: 0.12, filterFreq: 800 });
    },
    alienFire: () => tone({ freq: 320, type: 'square', dur: 0.09, gain: 0.12, sweep: -180 }),
    jonHit: () => {
      noiseBurst({ dur: 0.35, gain: 0.25, filterFreq: 600, filterQ: 0.4 });
      tone({ freq: 140, type: 'sawtooth', dur: 0.35, gain: 0.2, sweep: -80 });
    },
    claireHit: () => {
      tone({ freq: 80, type: 'sine', dur: 0.22, gain: 0.3, sweep: -30 });
      tone({ freq: 420, type: 'square', dur: 0.12, gain: 0.08, delay: 0.02, sweep: -200 });
    },
    waveClear: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ freq: f, type: 'triangle', dur: 0.12, gain: 0.2, delay: i * 0.08 });
      });
    },
    gameOver: () => {
      [523.25, 415.3, 311.13, 196].forEach((f, i) => {
        tone({ freq: f, type: 'sawtooth', dur: 0.22, gain: 0.22, delay: i * 0.14 });
      });
    },
    levelUp: () => tone({ freq: 660, type: 'triangle', dur: 0.2, gain: 0.15, sweep: 400 }),
  };

  // ----- Starfield -----
  function initStars() {
    state.stars = [];
    for (let i = 0; i < 80; i++) {
      state.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        s: Math.random() * 1.6 + 0.3,
        v: Math.random() * 20 + 10,
      });
    }
  }

  // ----- Setup -----
  function startGame() {
    ensureAudio();
    state.running = true;
    state.paused = false;
    state.score = 0;
    state.wave = 1;
    state.lives = 3;
    state.claireHp = CLAIRE_MAX_HP;
    state.bullets = [];
    state.alienBullets = [];
    state.particles = [];
    state.jon.x = W / 2 - JON_WIDTH / 2;
    state.jon.y = H - 60;
    initStars();
    spawnWave(state.wave);
    hideOverlay();
    updateHUD();
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function togglePause() {
    state.paused = !state.paused;
    if (state.paused) {
      showOverlay(`<h2>Paused</h2><p class="tagline">Catch your breath. Claire is counting on you.</p>
        <button id="resume-btn" class="btn-primary">Resume</button>`);
      document.getElementById('resume-btn').addEventListener('click', () => togglePause());
    } else {
      hideOverlay();
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function spawnWave(wave) {
    state.aliens = [];
    state.alienDir = 1;
    state.alienSpeed = 36 + wave * 8;
    state.alienShootCooldown = Math.max(0.35, 1.3 - wave * 0.12);
    state.alienShootTimer = state.alienShootCooldown;

    const totalW = COLS * ALIEN_W + (COLS - 1) * ALIEN_GAP_X;
    const startX = (W - totalW) / 2;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        state.aliens.push({
          x: startX + c * (ALIEN_W + ALIEN_GAP_X),
          y: ALIEN_START_Y + r * (ALIEN_H + ALIEN_GAP_Y),
          w: ALIEN_W,
          h: ALIEN_H,
          row: r,
          alive: true,
          frame: 0,
        });
      }
    }
  }

  // ----- Main loop -----
  let lastTime = 0;
  function loop(now) {
    if (!state.running) return;
    if (state.paused) return;
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    for (const s of state.stars) {
      s.y += s.v * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    // Jon movement: keyboard, held touch buttons, or tap target
    let dx = 0;
    if (keys.has('arrowleft') || keys.has('a') || touch.left) dx -= 1;
    if (keys.has('arrowright') || keys.has('d') || touch.right) dx += 1;

    if (dx === 0 && tapTargetX !== null) {
      const jonCenter = state.jon.x + state.jon.w / 2;
      const diff = tapTargetX - jonCenter;
      if (Math.abs(diff) > 4) dx = diff > 0 ? 1 : -1;
    }

    state.jon.x += dx * JON_SPEED * dt;
    state.jon.x = Math.max(8, Math.min(W - state.jon.w - 8, state.jon.x));

    // Fire
    state.fireTimer -= dt;
    const firePressed = keys.has(' ') || keys.has('spacebar') || touch.fire;
    if (firePressed && state.fireTimer <= 0) {
      state.bullets.push({
        x: state.jon.x + state.jon.w / 2 - 2,
        y: state.jon.y - 6,
        w: 4, h: 12,
      });
      state.fireTimer = FIRE_COOLDOWN;
      sfx.shoot();
    }

    for (const b of state.bullets) b.y -= BULLET_SPEED * dt;
    state.bullets = state.bullets.filter(b => b.y + b.h > 0);

    for (const b of state.alienBullets) b.y += ALIEN_BULLET_SPEED * dt;
    state.alienBullets = state.alienBullets.filter(b => b.y < H);

    const live = state.aliens.filter(a => a.alive);
    if (live.length === 0) {
      state.wave++;
      state.score += 50;
      sfx.waveClear();
      spawnWave(state.wave);
      updateHUD();
      return;
    }

    let edgeHit = false;
    const speedBoost = 1 + (ROWS * COLS - live.length) / (ROWS * COLS) * 2.4;
    const vx = state.alienSpeed * state.alienDir * speedBoost;
    for (const a of live) {
      a.x += vx * dt;
      if (a.x < 8 || a.x + a.w > W - 8) edgeHit = true;
    }
    if (edgeHit) {
      state.alienDir *= -1;
      for (const a of live) {
        a.y += state.alienStepDown;
        a.frame = a.frame ? 0 : 1;
      }
      sfx.levelUp();
    }

    state.alienShootTimer -= dt;
    if (state.alienShootTimer <= 0 && live.length) {
      const cols = {};
      for (const a of live) {
        const k = Math.round(a.x);
        if (!cols[k] || cols[k].y < a.y) cols[k] = a;
      }
      const shooters = Object.values(cols);
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      state.alienBullets.push({
        x: shooter.x + shooter.w / 2 - 2,
        y: shooter.y + shooter.h,
        w: 4, h: 10,
      });
      sfx.alienFire();
      state.alienShootTimer = state.alienShootCooldown * (0.6 + Math.random() * 0.8);
    }

    for (const b of state.bullets) {
      for (const a of live) {
        if (rectOverlap(b, a)) {
          a.alive = false;
          b.y = -100;
          const points = (ROWS - a.row) * 10 + 10;
          state.score += points;
          spawnExplosion(a.x + a.w / 2, a.y + a.h / 2, '#00e5a0');
          sfx.alienHit();
          updateHUD();
          break;
        }
      }
    }

    state.invulnTimer -= dt;
    if (state.invulnTimer <= 0) {
      for (const b of state.alienBullets) {
        if (rectOverlap(b, state.jon)) {
          b.y = H + 100;
          hitJon();
          break;
        }
      }
    }

    const claireTop = H - 18;
    for (const b of state.alienBullets) {
      if (b.y + b.h >= claireTop) {
        b.y = H + 100;
        damageClaire(6);
      }
    }

    for (const a of live) {
      if (a.y + a.h >= claireTop) {
        a.alive = false;
        damageClaire(25);
        spawnExplosion(a.x + a.w / 2, a.y + a.h / 2, '#ff69b4');
      }
    }

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);

    if (state.shakeT > 0) state.shakeT -= dt;
    if (state.flash > 0) state.flash -= dt * 2;
  }

  function hitJon() {
    spawnExplosion(state.jon.x + state.jon.w / 2, state.jon.y + state.jon.h / 2, '#ffab40');
    state.lives--;
    state.invulnTimer = 1.4;
    state.shakeT = 0.3;
    state.flash = 0.4;
    sfx.jonHit();
    updateHUD();
    if (state.lives <= 0) gameOver(false);
  }

  function damageClaire(amount) {
    state.claireHp = Math.max(0, state.claireHp - amount);
    state.shakeT = Math.max(state.shakeT, 0.2);
    state.flash = Math.max(state.flash, 0.3);
    sfx.claireHit();
    updateHUD();
    if (state.claireHp <= 0) gameOver(false);
  }

  function spawnExplosion(x, y, color) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const v = 80 + Math.random() * 140;
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.4 + Math.random() * 0.4,
        color,
      });
    }
  }

  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ----- Rendering -----
  function render() {
    ctx.save();
    if (state.shakeT > 0) {
      const s = state.shakeT * 12;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    ctx.clearRect(0, 0, W, H);

    for (const s of state.stars) {
      ctx.fillStyle = `rgba(200,220,255,${0.3 + s.s * 0.3})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    drawClaire();

    for (const a of state.aliens) {
      if (a.alive) drawAlien(a);
    }

    ctx.fillStyle = '#00ffb3';
    for (const b of state.bullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(0,255,179,.35)';
      ctx.fillRect(b.x - 1, b.y, b.w + 2, b.h);
      ctx.fillStyle = '#00ffb3';
    }

    ctx.fillStyle = '#ff4d6d';
    for (const b of state.alienBullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    drawJon();

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${Math.min(0.35, state.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function drawJon() {
    const j = state.jon;
    const flicker = state.invulnTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0;
    if (flicker) return;

    ctx.fillStyle = '#00e5a0';
    ctx.beginPath();
    ctx.moveTo(j.x + j.w / 2, j.y);
    ctx.lineTo(j.x + j.w, j.y + j.h);
    ctx.lineTo(j.x, j.y + j.h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00b8d4';
    ctx.fillRect(j.x + 2, j.y + j.h - 6, 6, 4);
    ctx.fillRect(j.x + j.w - 8, j.y + j.h - 6, 6, 4);

    ctx.fillStyle = '#e8edf2';
    ctx.fillRect(j.x + j.w / 2 - 3, j.y + 10, 6, 8);

    ctx.fillStyle = '#0f1923';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JON', j.x + j.w / 2, j.y + j.h - 8);
  }

  function drawClaire() {
    const y = H - CLAIRE_HEIGHT;
    ctx.fillStyle = 'rgba(255,105,180,.15)';
    ctx.fillRect(0, y, W, CLAIRE_HEIGHT);

    const barH = 6;
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(0, y, W, barH);
    const pct = state.claireHp / CLAIRE_MAX_HP;
    ctx.fillStyle = pct > .5 ? '#ff69b4' : pct > .25 ? '#ffab40' : '#ff5252';
    ctx.fillRect(0, y, W * pct, barH);

    ctx.fillStyle = '#ff69b4';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u2665 CLAIRE \u2665', W / 2, H - 20);

    ctx.fillStyle = 'rgba(255,105,180,.45)';
    const blockW = 40;
    const blockH = 10;
    for (let i = 0; i < 8; i++) {
      const bx = 40 + i * 95;
      ctx.fillRect(bx, H - CLAIRE_HEIGHT + 12, blockW, blockH);
    }
  }

  function drawAlien(a) {
    const palette = ['#ff5252', '#ffab40', '#00b8d4', '#9c27b0'];
    ctx.fillStyle = palette[a.row % palette.length];

    const x = a.x, y = a.y, w = a.w, h = a.h;
    const f = a.frame;

    ctx.fillRect(x + 6, y + 4, w - 12, h - 10);
    ctx.fillRect(x + 10, y, w - 20, 6);
    if (f === 0) {
      ctx.fillRect(x, y + 6, 4, 8);
      ctx.fillRect(x + w - 4, y + 6, 4, 8);
      ctx.fillRect(x + 6, y + h - 4, 4, 4);
      ctx.fillRect(x + w - 10, y + h - 4, 4, 4);
    } else {
      ctx.fillRect(x + 2, y + 10, 4, 8);
      ctx.fillRect(x + w - 6, y + 10, 4, 8);
      ctx.fillRect(x + 10, y + h - 4, 4, 4);
      ctx.fillRect(x + w - 14, y + h - 4, 4, 4);
    }
    ctx.fillStyle = '#0f1923';
    ctx.fillRect(x + 12, y + 8, 4, 4);
    ctx.fillRect(x + w - 16, y + 8, 4, 4);
  }

  // ----- HUD -----
  function updateHUD() {
    scoreEl.textContent = state.score;
    waveEl.textContent = state.wave;
    livesEl.textContent = state.lives;
    claireHpEl.textContent = `${Math.round(state.claireHp)}%`;
  }

  // ----- Overlay -----
  function showOverlay(innerHTML) {
    overlay.innerHTML = `<div class="panel">${innerHTML}</div>`;
    overlay.classList.add('active');
  }
  function hideOverlay() {
    overlay.classList.remove('active');
  }

  function gameOver(won) {
    state.running = false;
    sfx.gameOver();
    const title = won
      ? `<h2 class="result-title win">Claire is safe!</h2>`
      : `<h2 class="result-title lose">Claire has fallen...</h2>`;
    const msg = won
      ? `<p class="tagline">Jon held the line. The invasion is over.</p>`
      : `<p class="tagline">The aliens broke through. Jon will rise again.</p>`;
    showOverlay(`
      ${title}
      ${msg}
      <div class="result-stats">
        <div><span class="lbl">Score</span><span class="val">${state.score}</span></div>
        <div><span class="lbl">Wave</span><span class="val">${state.wave}</span></div>
        <div><span class="lbl">Claire</span><span class="val">${Math.round(state.claireHp)}%</span></div>
      </div>
      <button id="again-btn" class="btn-primary">Play Again</button>
    `);
    document.getElementById('again-btn').addEventListener('click', startGame);
  }

  initStars();
  spawnWave(1);
  render();
})();
