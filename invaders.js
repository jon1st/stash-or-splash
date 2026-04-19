// ===== Jon defends Claire Invasion =====
// A Space Invaders tribute where Jon (green ship) must protect Claire (pink heart base)
// from waves of alien invaders.

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

  // ----- Game constants -----
  const JON_WIDTH = 44;
  const JON_HEIGHT = 28;
  const JON_SPEED = 360;           // px/sec
  const BULLET_SPEED = 540;
  const ALIEN_BULLET_SPEED = 220;
  const FIRE_COOLDOWN = 0.32;      // seconds
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
    bullets: [],       // Jon's shots
    alienBullets: [],
    aliens: [],
    alienDir: 1,       // 1 right, -1 left
    alienSpeed: 40,    // horizontal px/sec (increases with wave)
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

  // ----- Input -----
  const keys = new Set();
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

  startBtn.addEventListener('click', startGame);

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
      document.getElementById('resume-btn').addEventListener('click', () => {
        togglePause();
      });
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
    // Stars
    for (const s of state.stars) {
      s.y += s.v * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    // Jon movement
    let dx = 0;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    state.jon.x += dx * JON_SPEED * dt;
    state.jon.x = Math.max(8, Math.min(W - state.jon.w - 8, state.jon.x));

    // Fire
    state.fireTimer -= dt;
    if ((keys.has(' ') || keys.has('spacebar')) && state.fireTimer <= 0) {
      state.bullets.push({
        x: state.jon.x + state.jon.w / 2 - 2,
        y: state.jon.y - 6,
        w: 4, h: 12,
      });
      state.fireTimer = FIRE_COOLDOWN;
    }

    // Jon's bullets
    for (const b of state.bullets) b.y -= BULLET_SPEED * dt;
    state.bullets = state.bullets.filter(b => b.y + b.h > 0);

    // Alien bullets
    for (const b of state.alienBullets) b.y += ALIEN_BULLET_SPEED * dt;
    state.alienBullets = state.alienBullets.filter(b => b.y < H);

    // Aliens movement
    const live = state.aliens.filter(a => a.alive);
    if (live.length === 0) {
      state.wave++;
      state.score += 50;
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
    }

    // Alien shooting
    state.alienShootTimer -= dt;
    if (state.alienShootTimer <= 0 && live.length) {
      // Find the lowest alien in a random column
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
      state.alienShootTimer = state.alienShootCooldown * (0.6 + Math.random() * 0.8);
    }

    // Collisions: Jon's bullets vs aliens
    for (const b of state.bullets) {
      for (const a of live) {
        if (rectOverlap(b, a)) {
          a.alive = false;
          b.y = -100;
          const points = (ROWS - a.row) * 10 + 10;
          state.score += points;
          spawnExplosion(a.x + a.w / 2, a.y + a.h / 2, '#00e5a0');
          updateHUD();
          break;
        }
      }
    }

    // Alien bullets vs Jon
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

    // Alien bullets vs Claire (bottom line)
    const claireTop = H - 18;
    for (const b of state.alienBullets) {
      if (b.y + b.h >= claireTop) {
        b.y = H + 100;
        damageClaire(6);
      }
    }

    // Aliens reaching Claire's line = catastrophic hit
    for (const a of live) {
      if (a.y + a.h >= claireTop) {
        a.alive = false;
        damageClaire(25);
        spawnExplosion(a.x + a.w / 2, a.y + a.h / 2, '#ff69b4');
      }
    }

    // Particles
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);

    // Screen shake & flash decay
    if (state.shakeT > 0) state.shakeT -= dt;
    if (state.flash > 0) state.flash -= dt * 2;
  }

  function hitJon() {
    spawnExplosion(state.jon.x + state.jon.w / 2, state.jon.y + state.jon.h / 2, '#ffab40');
    state.lives--;
    state.invulnTimer = 1.4;
    state.shakeT = 0.3;
    state.flash = 0.4;
    updateHUD();
    if (state.lives <= 0) gameOver(false);
  }

  function damageClaire(amount) {
    state.claireHp = Math.max(0, state.claireHp - amount);
    state.shakeT = Math.max(state.shakeT, 0.2);
    state.flash = Math.max(state.flash, 0.3);
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

    // Stars
    for (const s of state.stars) {
      ctx.fillStyle = `rgba(200,220,255,${0.3 + s.s * 0.3})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    // Claire base
    drawClaire();

    // Aliens
    for (const a of state.aliens) {
      if (a.alive) drawAlien(a);
    }

    // Jon's bullets
    ctx.fillStyle = '#00ffb3';
    for (const b of state.bullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(0,255,179,.35)';
      ctx.fillRect(b.x - 1, b.y, b.w + 2, b.h);
      ctx.fillStyle = '#00ffb3';
    }

    // Alien bullets
    ctx.fillStyle = '#ff4d6d';
    for (const b of state.alienBullets) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Jon
    drawJon();

    // Particles
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // Flash
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

    // ship body (green triangle with cockpit)
    ctx.fillStyle = '#00e5a0';
    ctx.beginPath();
    ctx.moveTo(j.x + j.w / 2, j.y);
    ctx.lineTo(j.x + j.w, j.y + j.h);
    ctx.lineTo(j.x, j.y + j.h);
    ctx.closePath();
    ctx.fill();

    // wing lights
    ctx.fillStyle = '#00b8d4';
    ctx.fillRect(j.x + 2, j.y + j.h - 6, 6, 4);
    ctx.fillRect(j.x + j.w - 8, j.y + j.h - 6, 6, 4);

    // cockpit
    ctx.fillStyle = '#e8edf2';
    ctx.fillRect(j.x + j.w / 2 - 3, j.y + 10, 6, 8);

    // "JON" label
    ctx.fillStyle = '#0f1923';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JON', j.x + j.w / 2, j.y + j.h - 8);
  }

  function drawClaire() {
    // Bar along bottom with a heart in the middle
    const y = H - CLAIRE_HEIGHT;
    ctx.fillStyle = 'rgba(255,105,180,.15)';
    ctx.fillRect(0, y, W, CLAIRE_HEIGHT);

    // HP bar (behind)
    const barH = 6;
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(0, y, W, barH);
    const pct = state.claireHp / CLAIRE_MAX_HP;
    ctx.fillStyle = pct > .5 ? '#ff69b4' : pct > .25 ? '#ffab40' : '#ff5252';
    ctx.fillRect(0, y, W * pct, barH);

    // "CLAIRE" label with heart
    ctx.fillStyle = '#ff69b4';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u2665 CLAIRE \u2665', W / 2, H - 20);

    // Base blocks (visual defense line)
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

    // Body
    ctx.fillRect(x + 6, y + 4, w - 12, h - 10);
    // Head dome
    ctx.fillRect(x + 10, y, w - 20, 6);
    // Arms / legs alternating
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
    // Eyes
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

  // Initial render (aliens visible behind overlay preview)
  initStars();
  spawnWave(1);
  render();
})();
