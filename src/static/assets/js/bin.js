// The playable mini bin in the hero: a pocket version of Fruit Drop.
// Verlet circles in world units (bin is 100 wide), same fruit ladder,
// radii and scores as the game. No blessings — that's what the app is for.

const W = 100;
const H = 124;
const LINE = 21;
const DROP_Y = 11;
const COOLDOWN = 0.32;
const GRAVITY = 235;
const SUBSTEPS = 8;
const OVER_GRACE = 1.0;
const OVER_LIMIT = 1.3;

const FRUITS = [
  { name: 'Cherry', file: 'cherry', r: 3.8, pts: 0, color: '#e23b4e' },
  { name: 'Strawberry', file: 'strawberry', r: 5.7, pts: 1, color: '#ff4d6d' },
  { name: 'Grapes', file: 'grapes', r: 7.7, pts: 3, color: '#9b5de5' },
  { name: 'Lemon', file: 'lemon', r: 10.4, pts: 6, color: '#ffd23f' },
  { name: 'Tangerine', file: 'tangerine', r: 13.2, pts: 10, color: '#ff9f1c' },
  { name: 'Apple', file: 'red_apple', r: 17.8, pts: 15, color: '#e63946' },
  { name: 'Pear', file: 'pear', r: 21.6, pts: 21, color: '#a7c957' },
  { name: 'Mango', file: 'mango', r: 26.6, pts: 28, color: '#ffb703' },
  { name: 'Pineapple', file: 'pineapple', r: 32.4, pts: 36, color: '#f4d35e' },
  { name: 'Melon', file: 'melon', r: 37.5, pts: 45, color: '#b5e48c' },
  { name: 'Watermelon', file: 'watermelon', r: 42.5, pts: 66, color: '#ef476f' },
];
const MAX_TIER = FRUITS.length - 1;
const DROP_WEIGHTS = [30, 26, 20, 14, 10];

const well = document.querySelector('[data-bin]');
if (well) init(well);

function init(well) {
  const canvas = well.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.querySelector('[data-bin-score]');
  const bestEl = document.querySelector('[data-bin-best]');
  const nextEl = document.querySelector('[data-bin-next]');
  const toastEl = well.querySelector('[data-bin-toast]');
  const resetEl = document.querySelector('[data-bin-reset]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = new URL('../fruits/', import.meta.url);

  const sprites = FRUITS.map((f) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = new URL(`${f.file}.png`, base).href;
    const s = { img, src: null };
    img.addEventListener('load', () => (s.src = squareBBox(img)));
    return s;
  });

  let bodies = [];
  let particles = [];
  let floaters = [];
  let score = 0;
  let best = 0;
  let aimX = W / 2;
  let held = 0;
  let next = 1;
  let cooldown = 0;
  let demo = !reduceMotion;
  let demoTimer = 0.6;
  let over = false;
  let overTimer = 0;
  let scale = 1;
  let dpr = 1;
  let running = false;
  let visible = true;
  let last = 0;
  let nextId = 1;

  held = pickTier();
  next = pickTier();
  updateHud();

  function pickTier() {
    const total = DROP_WEIGHTS.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < DROP_WEIGHTS.length; i++) {
      roll -= DROP_WEIGHTS[i];
      if (roll < 0) return i;
    }
    return 0;
  }

  // dx/dy: initial displacement per substep (Verlet velocity).
  function makeBody(tier, x, y, dx = 0, dy = 0, grow = false) {
    const r = FRUITS[tier].r;
    return {
      id: nextId++,
      tier,
      x,
      y,
      px: x - dx,
      py: y - dy,
      r: grow ? r * 0.7 : r,
      tr: r,
      angle: Math.random() * 0.6 - 0.3,
      age: 0,
      overT: 0,
      pop: grow ? 1 : 0,
      dead: false,
    };
  }

  function drop() {
    if (over || cooldown > 0) return;
    const r = FRUITS[held].r;
    const x = clamp(aimX, r + 0.5, W - r - 0.5);
    bodies.push(makeBody(held, x, DROP_Y, 0, 30 / (60 * SUBSTEPS)));
    held = next;
    next = pickTier();
    cooldown = COOLDOWN;
    updateHud();
  }

  function takeOver() {
    if (!demo) return;
    demo = false;
    well.classList.add('is-player');
  }

  // ---- input ----

  function toWorldX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  }

  well.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || e.buttons) aimX = toWorldX(e.clientX);
  });
  well.addEventListener('pointerdown', (e) => {
    takeOver();
    aimX = toWorldX(e.clientX);
    well.setPointerCapture?.(e.pointerId);
  });
  well.addEventListener('pointerup', (e) => {
    aimX = toWorldX(e.clientX);
    drop();
  });
  well.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      takeOver();
      aimX = clamp(aimX + (e.key === 'ArrowLeft' ? -4 : 4), 0, W);
      e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
      takeOver();
      drop();
      e.preventDefault();
    }
  });
  resetEl?.addEventListener('click', () => {
    reset();
    well.focus({ preventScroll: true });
  });

  // ---- simulation ----

  function step(dt) {
    cooldown = Math.max(0, cooldown - dt);

    if (demo && !over) {
      demoTimer -= dt;
      if (demoTimer <= 0) {
        aimX = demoAim();
        drop();
        demoTimer = 0.55 + Math.random() * 0.5;
      }
    }

    const h = dt / SUBSTEPS;
    const merges = [];
    for (let s = 0; s < SUBSTEPS; s++) {
      for (const b of bodies) {
        const vx = (b.x - b.px) * 0.998;
        const vy = (b.y - b.py) * 0.998;
        b.px = b.x;
        b.py = b.y;
        b.x += vx;
        b.y += vy + GRAVITY * h * h;
      }
      for (let it = 0; it < 2; it++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const rr = a.r + b.r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr) continue;
            if (a.tier === b.tier && !a.dead && !b.dead) {
              a.dead = b.dead = true;
              merges.push([a, b]);
              continue;
            }
            const d = Math.sqrt(d2) || 0.001;
            const push = (rr - d) * 0.5;
            const nx = dx / d;
            const ny = dy / d;
            const ma = a.r * a.r;
            const mb = b.r * b.r;
            const ka = (push * 2 * mb) / (ma + mb);
            const kb = (push * 2 * ma) / (ma + mb);
            a.x -= nx * ka;
            a.y -= ny * ka;
            b.x += nx * kb;
            b.y += ny * kb;
          }
        }
        for (const b of bodies) {
          if (b.x < b.r) {
            b.x = b.r;
          } else if (b.x > W - b.r) {
            b.x = W - b.r;
          }
          if (b.y > H - b.r) {
            b.y = H - b.r;
            b.px = b.x - (b.x - b.px) * 0.85;
          }
        }
      }
      if (merges.length) {
        resolveMerges(merges);
        merges.length = 0;
      }
    }

    for (const b of bodies) {
      b.age += dt;
      b.r += (b.tr - b.r) * Math.min(1, dt * 14);
      b.pop = Math.max(0, b.pop - dt * 4);
      b.angle += ((b.x - b.px) * SUBSTEPS) / b.r;
      if (b.age > OVER_GRACE && b.y - b.r < LINE) b.overT += dt;
      else b.overT = 0;
      if (!over && b.overT > OVER_LIMIT) gameOver();
    }

    for (const p of particles) {
      p.vy += 160 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const f of floaters) {
      f.y -= 16 * dt;
      f.life -= dt;
    }
    floaters = floaters.filter((f) => f.life > 0);

    if (over) {
      overTimer -= dt;
      if (overTimer < 1.1 && bodies.length) {
        // Pop fruit one by one from the top.
        const top = bodies.reduce((m, b) => (b.y < m.y ? b : m), bodies[0]);
        burst(top.x, top.y, FRUITS[top.tier].color, 6);
        bodies = bodies.filter((b) => b !== top);
      }
      if (overTimer <= 0) {
        over = false;
        score = 0;
        bodies = [];
        demoTimer = 0.8;
        updateHud();
      }
    }
  }

  function resolveMerges(pairs) {
    const born = [];
    for (const [a, b] of pairs) {
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      const dx = (a.x - a.px + b.x - b.px) / 2;
      const dy = (a.y - a.py + b.y - b.py) / 2;
      burst(x, y, FRUITS[a.tier].color, 10 + a.tier * 2);
      if (a.tier === MAX_TIER) {
        addScore(200, x, y);
        toast('WATERMELON!');
        continue;
      }
      const t = a.tier + 1;
      addScore(FRUITS[t].pts, x, y);
      born.push(makeBody(t, x, y, dx, dy, true));
      if (t >= 7) toast(`${FRUITS[t].name.toUpperCase()}!`);
    }
    bodies = bodies.filter((b) => !b.dead).concat(born);
  }

  function addScore(pts, x, y) {
    if (pts <= 0) return;
    score += pts;
    if (score > best) best = score;
    floaters.push({ x, y, text: `+${pts}`, life: 0.9 });
    updateHud();
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 20 + Math.random() * 50;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        r: 0.6 + Math.random() * 1.2,
        color,
        life: 0.5 + Math.random() * 0.4,
      });
    }
  }

  function gameOver() {
    over = true;
    overTimer = 2.4;
    toast('BIN FULL!');
  }

  function reset() {
    bodies = [];
    particles = [];
    floaters = [];
    score = 0;
    over = false;
    held = pickTier();
    next = pickTier();
    updateHud();
  }

  // The demo aims at the highest same-tier fruit, like a lazy player would.
  function demoAim() {
    const same = bodies.filter((b) => b.tier === held && b.age > 0.5);
    if (same.length && Math.random() < 0.8) {
      const target = same.reduce((m, b) => (b.y < m.y ? b : m), same[0]);
      return target.x + (Math.random() - 0.5) * 3;
    }
    return 12 + Math.random() * (W - 24);
  }

  function updateHud() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (bestEl) bestEl.textContent = String(best);
    if (nextEl) {
      nextEl.src = sprites[next].img.src;
      nextEl.alt = FRUITS[next].name;
    }
  }

  function toast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.remove('is-on');
    void toastEl.offsetWidth;
    toastEl.classList.add('is-on');
  }

  // ---- rendering ----

  function resize() {
    const rect = well.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    scale = (rect.width * dpr) / W;
    draw();
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Lose line.
    const danger = bodies.some((b) => b.overT > 0.2);
    ctx.save();
    ctx.setLineDash([2.2, 1.8]);
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = danger ? 'rgba(255,107,107,0.95)' : 'rgba(255,107,107,0.4)';
    ctx.beginPath();
    ctx.moveTo(3, LINE);
    ctx.lineTo(W - 3, LINE);
    ctx.stroke();
    ctx.restore();

    // Aim guide + held fruit.
    if (!over) {
      const r = FRUITS[held].r;
      const x = clamp(aimX, r + 0.5, W - r - 0.5);
      ctx.save();
      ctx.setLineDash([1.2, 2]);
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(255,246,233,0.22)';
      ctx.beginPath();
      ctx.moveTo(x, DROP_Y + r);
      ctx.lineTo(x, H);
      ctx.stroke();
      ctx.restore();
      drawFruit(held, x, DROP_Y, r, 0, cooldown > 0 ? 0.45 : 1);
    }

    for (const b of bodies) {
      drawFruit(b.tier, b.x, b.y, b.r * (1 + 0.2 * b.pop), b.angle, 1);
    }

    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.font = '700 5px Fredoka, system-ui, sans-serif';
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2.5);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawFruit(tier, x, y, r, angle, alpha) {
    const s = sprites[tier];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.18, r * 0.82, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(angle);
    if (s.src) {
      const { sx, sy, side } = s.src;
      ctx.drawImage(s.img, sx, sy, side, side, -r, -r, r * 2, r * 2);
    } else {
      ctx.fillStyle = FRUITS[tier].color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- loop ----

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.033, (t - last) / 1000 || 0);
    last = t;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) {
      last = performance.now();
      requestAnimationFrame(frame);
    }
  }

  const syncRunning = () => setRunning(visible && !document.hidden);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    syncRunning();
  }).observe(well);
  document.addEventListener('visibilitychange', syncRunning);
  new ResizeObserver(resize).observe(well);
  resize();
}

// The sprites carry transparent padding; crop to a centered square around
// the opaque pixels so the art fills its collision circle, as the game does.
function squareBBox(img) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 <= x0) return { sx: 0, sy: 0, side: w };
    const side = Math.max(x1 - x0, y1 - y0) + 1;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    return {
      sx: clamp(cx - side / 2, 0, w - side),
      sy: clamp(cy - side / 2, 0, h - side),
      side,
    };
  } catch {
    return { sx: 0, sy: 0, side: w };
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
