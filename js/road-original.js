// Implementazione originale di Andrea, ChildGames. Adattatore e provenienza in docs/FASE-2B.md.
export function registerRoad(App,U,Sound,setTimeout,requestAnimationFrame,cancelAnimationFrame,sceneryDocument){
const document=sceneryDocument||globalThis.document;
'use strict';
/*
 * Corsa su Strada: gara in stile OutRun (strada pseudo-3D con curve e salite).
 * Si sceglie moto, auto o camion. Si accelera da soli: tenendo premuto a sinistra o a destra si sterza.
 * Ogni checkpoint regala secondi in più; sorpassi e distanza danno punti.
 */
App.register({
  id: 'strada',
  title: 'Corsa su Strada',
  desc: 'Scegli moto, auto o camion e corri verso il tramonto! Sorpassa tutti e arriva ai checkpoint prima che finisca il tempo.',
  color: '#ff7b00',
  duration: null,
  art: () => '<span class="emo">🏎️</span><span class="emo">🌴</span>',
  stars: p => (p >= 2500 ? 3 : p >= 1200 ? 2 : p >= 400 ? 1 : 0),

  start(ctx) {
    const cv = ctx.canvas();
    const g = cv.g;
    const { rand, pick } = U;
    const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

    // Caratteristiche dei veicoli (w = larghezza rispetto a mezza carreggiata)
    const VEH = {
      moto:   { name: 'Moto', icon: '🏍️', top: 1.15, accel: 0.45, steer: 2.7, w: 0.2, crash: 0.25, color: '#e63946' },
      auto:   { name: 'Auto', icon: '🏎️', top: 1.0, accel: 0.33, steer: 2.2, w: 0.32, crash: 0.45, color: '#ff2d55' },
      camion: { name: 'Camion', icon: '🚛', top: 0.86, accel: 0.2, steer: 1.7, w: 0.44, crash: 0.85, color: '#2b7bff', push: true },
    };
    let V = VEH.auto, kind = 'auto';

    const SEG = 200, ROAD_W = 2000, CAM_H = 1000, DRAW = 150, RUMBLE = 3;
    const camDepth = 1 / Math.tan(50 * Math.PI / 180);
    const playerZ = CAM_H * camDepth;
    const MAX = SEG * 60;                 // velocità massima "base" (unità al secondo)
    const START_TIME = 35;
    // il bonus dei checkpoint cala: 20, 18, 16 ... fino a 8 secondi
    const checkBonus = () => Math.max(8, 20 - checkpoints * 2);

    /* ---------- costruzione del percorso ---------- */
    const segs = [];
    const lastY = () => (segs.length ? segs[segs.length - 1].p2.world.y : 0);
    const easeIn = (a, b, p) => a + (b - a) * p * p;
    const easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
    function addSeg(curve, y) {
      const n = segs.length;
      segs.push({
        index: n, curve, sprites: [], dark: Math.floor(n / RUMBLE) % 2 === 1,
        p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} },
        p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} },
      });
    }
    function addRoad(enter, hold, leave, curve, hill) {
      const y0 = lastY(), y1 = y0 + hill * SEG, tot = enter + hold + leave;
      for (let i = 0; i < enter; i++) addSeg(easeIn(0, curve, i / enter), easeInOut(y0, y1, i / tot));
      for (let i = 0; i < hold; i++) addSeg(curve, easeInOut(y0, y1, (enter + i) / tot));
      for (let i = 0; i < leave; i++) addSeg(easeInOut(curve, 0, i / leave), easeInOut(y0, y1, (enter + hold + i) / tot));
    }
    addRoad(30, 30, 30, 0, 0);
    while (segs.length < 2300) {
      const len = U.ri(20, 50);
      const curve = Math.random() < 0.3 ? 0 : pick([-1, 1]) * pick([2, 3, 4, 5]);
      const hill = Math.random() < 0.45 ? 0 : pick([-1, 1]) * pick([10, 20, 30]);
      addRoad(len, len, len, curve, hill);
    }
    addRoad(60, 60, 60, 0, -lastY() / SEG);   // torna in piano: il giro si chiude senza scalini
    const N = segs.length, L = N * SEG;

    // alberi e cactus ai lati
    for (let i = 12; i < N; i += U.ri(3, 7)) {
      const side = Math.random() < 0.5 ? -1 : 1;
      segs[i].sprites.push({ e: pick(['🌴', '🌴', '🌴', '🌳', '🌵']), off: side * rand(1.35, 2.1) });
    }
    // tre checkpoint per giro (l'ultimo appena prima della partenza)
    const CHECKS = [Math.floor(N / 3), Math.floor(N * 2 / 3), N - 10];
    CHECKS.forEach(i => { segs[i].check = true; });

    const findSeg = z => segs[Math.floor(((z % L) + L) % L / SEG) % N];

    /* ---------- traffico ---------- */
    const COLORS = ['#ffd23f', '#06d6a0', '#118ab2', '#ef476f', '#8338ec', '#ffffff', '#ff9f1c', '#3a86ff'];
    const LANES = [-0.66, 0, 0.66];
    const MAX_CARS = 170;
    const cars = [];
    function addCar(z) {
      const k = pick(['car', 'car', 'car', 'van', 'bus']);
      const off = pick(LANES);
      cars.push({
        z: ((z % L) + L) % L,
        off, target: off,
        speed: MAX * rand(0.22, 0.5),
        kind: k, w: k === 'bus' ? 0.42 : k === 'van' ? 0.34 : 0.3,
        color: pick(COLORS), prev: null,
      });
    }
    for (let i = 0; i < 55; i++) addCar(rand(SEG * 40, L - SEG * 10));
    // a ogni checkpoint arriva altro traffico davanti al giocatore
    function moreTraffic(n) {
      for (let i = 0; i < n && cars.length < MAX_CARS; i++) addCar(position + playerZ + SEG * rand(60, 400));
    }

    /* ---------- stato della corsa ---------- */
    let position = 0, playerX = 0, speed = 0, steer = 0, lean = 0;
    let timeLeft = START_TIME, distance = 0, distAcc = 0, overtakes = 0, checkpoints = 0, pushes = 0;
    let running = false, stopped = false, countdown = 0, raf = 0, last = 0, crashT = 0, shake = 0, skyX = 0, t = 0;
    let prevIdx = findSeg(playerZ).index;

    /* ---------- comandi: tieni premuto a sinistra / a destra ---------- */
    const pointers = new Map();
    const keys = { l: false, r: false };
    function readSteer() {
      let s = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      for (const x of pointers.values()) s += x < cv.W / 2 ? -1 : 1;
      steer = Math.max(-1, Math.min(1, s));
    }
    const pd = ev => { try { cv.c.setPointerCapture(ev.pointerId); } catch (e) { /* niente */ } pointers.set(ev.pointerId, cv.pos(ev).x); readSteer(); };
    const pm = ev => { if (pointers.has(ev.pointerId)) { pointers.set(ev.pointerId, cv.pos(ev).x); readSteer(); } };
    const pu = ev => { pointers.delete(ev.pointerId); readSteer(); };
    cv.c.addEventListener('pointerdown', pd);
    cv.c.addEventListener('pointermove', pm);
    cv.c.addEventListener('pointerup', pu);
    cv.c.addEventListener('pointercancel', pu);
    const kd = e => { if (e.key === 'ArrowLeft') keys.l = true; if (e.key === 'ArrowRight') keys.r = true; readSteer(); };
    const ku = e => { if (e.key === 'ArrowLeft') keys.l = false; if (e.key === 'ArrowRight') keys.r = false; readSteer(); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const level = () => 1 + checkpoints;
    function info() { ctx.info(`${V.icon} Livello ${level()} · 🔀 ${overtakes}`); }

    /* ---------- logica ---------- */
    function update(dt) {
      const max = MAX * V.top;
      const pseg = findSeg(position + playerZ);
      const sp = speed / max;

      // sterzo e forza centrifuga in curva
      const dx = dt * V.steer * Math.min(1, sp + 0.25);
      playerX += steer * dx;
      // le curve spingono sempre di più a ogni livello
      playerX -= dx * sp * pseg.curve * (0.22 + 0.02 * Math.min(6, checkpoints));
      lean += (steer * 0.12 - lean) * Math.min(1, dt * 8);

      // accelerazione automatica, fuori strada si rallenta
      speed += max * V.accel * dt;
      const off = Math.abs(playerX) > 1;
      if (off && speed > max * 0.35) speed -= max * 1.3 * dt;
      playerX = Math.max(-2.2, Math.min(2.2, playerX));
      speed = Math.max(0, Math.min(max, speed));

      crashT = Math.max(0, crashT - dt);
      shake = Math.max(0, shake - dt);

      // traffico: movimento, sorpassi, scontri
      for (const c of cars) {
        c.z = (c.z + c.speed * dt) % L;
        const rel = (((c.z - (position + playerZ)) % L) + L) % L;
        // cambi di corsia improvvisi, sempre più frequenti (solo per le auto davanti, ben visibili)
        if (rel > SEG * 15 && rel < SEG * DRAW && Math.random() < dt * Math.min(0.3, 0.04 * level())) {
          c.target = pick(LANES.filter(l => Math.abs(l - c.target) > 0.1));
        }
        if (c.off !== c.target) {
          const step = 0.7 * dt;
          c.off = Math.abs(c.target - c.off) <= step ? c.target : c.off + Math.sign(c.target - c.off) * step;
        }
        if (c.prev != null && c.prev < SEG * 8 && rel > L - SEG * 8) {
          overtakes++;
          ctx.add(20);
          ctx.popup('Sorpasso! +20', cv.W / 2, cv.H * 0.55, 'gold');
          Sound.tone(990, 0.08, 'triangle', 0.08);
          info();
        }
        c.prev = rel;
        const near = rel < SEG * 1.3 || rel > L - SEG * 0.4;
        if (near && crashT <= 0 && speed > c.speed && Math.abs(playerX - c.off) < (V.w + c.w) / 2) {
          if (V.push) {
            c.off += (c.off >= playerX ? 1 : -1) * 0.7;
            c.target = c.off;
            speed *= V.crash;
            timeLeft -= 2;
            pushes++;
            ctx.add(10);
            ctx.popup('Spinta! +10 · -2s', cv.W / 2, cv.H * 0.6, 'combo');
            Sound.tone(150, 0.2, 'square', 0.08);
          } else {
            speed *= V.crash;
            timeLeft -= 3;
            ctx.popup('Bump! 💥 -3s', cv.W / 2, cv.H * 0.6, 'bad');
            Sound.bad(); U.vibrate(120);
          }
          shake = 0.35;
          crashT = 0.8;
        }
      }

      position = (position + speed * dt) % L;
      distance += speed * dt;
      distAcc += speed * dt / (SEG * 10);
      if (distAcc >= 1) { const n = Math.floor(distAcc); ctx.add(n); distAcc -= n; }
      skyX += pseg.curve * sp * dt * 40;

      // checkpoint
      const idx = findSeg(position + playerZ).index;
      if (idx !== prevIdx) {
        for (const ci of CHECKS) {
          const crossed = idx > prevIdx ? (ci > prevIdx && ci <= idx) : (ci > prevIdx || ci <= idx);
          if (crossed) {
            const bonus = checkBonus();
            checkpoints++;
            timeLeft += bonus;
            ctx.add(100);
            moreTraffic(14);
            ctx.popup(`CHECKPOINT! +${bonus}s`, cv.W / 2, cv.H * 0.3, 'gold');
            setTimeout(() => { if (running) ctx.popup(`Livello ${level()}: più traffico! 🚗`, cv.W / 2, cv.H * 0.38, 'combo'); }, 900);
            Sound.win();
            info();
          }
        }
        prevIdx = idx;
      }

      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        running = false;
        ctx.end({
          title: 'Tempo scaduto! 🏁',
          msg: `${V.icon} ${V.name} · Distanza: <b>${(distance / MAX * 240 / 3600).toFixed(1)} km</b><br>Livello raggiunto: <b>${level()}</b> · Sorpassi: <b>${overtakes}</b>${pushes ? ` · Spinte: <b>${pushes}</b>` : ''}`,
        });
      }
    }

    /* ---------- disegno ---------- */
    const sprites = {};
    function sprite(e) {
      if (!sprites[e]) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const sg = c.getContext('2d');
        sg.font = `110px ${EMOJI_FONT}`;
        sg.textAlign = 'center'; sg.textBaseline = 'middle';
        sg.fillText(e, 64, 70);
        sprites[e] = c;
      }
      return sprites[e];
    }

    function project(p, cx, cy, cz) {
      const W = cv.W, H = cv.H;
      p.camera.x = -cx;
      p.camera.y = p.world.y - cy;
      p.camera.z = p.world.z - cz;
      p.screen.scale = camDepth / p.camera.z;
      p.screen.x = Math.round(W / 2 + p.screen.scale * p.camera.x * W / 2);
      p.screen.y = Math.round(H * 0.45 - p.screen.scale * p.camera.y * H / 2);
      p.screen.w = Math.round(p.screen.scale * ROAD_W * W / 2);
    }

    function poly(x1, y1, x2, y2, x3, y3, x4, y4, col) {
      g.fillStyle = col;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath(); g.fill();
    }

    function rr(x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
      g.closePath(); g.fill();
    }

    function drawSky() {
      const W = cv.W, H = cv.H, hy = H * 0.45;
      const sky = g.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, '#2a1458'); sky.addColorStop(0.55, '#c2185b'); sky.addColorStop(1, '#ff9f1c');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, hy + 2);
      // terra lontana sotto l'orizzonte (si vede quando la strada scende)
      g.fillStyle = '#4f9a33';
      g.fillRect(0, hy, W, H - hy);
      // sole a strisce
      const r = Math.min(W, H) * 0.22, sx = W / 2, sy = hy - r * 0.35;
      g.save();
      g.beginPath(); g.rect(0, 0, W, hy); g.clip();
      g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.clip();
      const sun = g.createLinearGradient(0, sy - r, 0, sy + r);
      sun.addColorStop(0, '#fff3a3'); sun.addColorStop(1, '#ff5e78');
      g.fillStyle = sun; g.fillRect(sx - r, sy - r, r * 2, r * 2);
      g.fillStyle = '#c2185b';
      for (let i = 0; i < 6; i++) g.fillRect(sx - r, sy + i * r * 0.16, r * 2, r * 0.03 + i * 1.2);
      g.restore();
      // montagne (si spostano con le curve)
      for (const [col, amp, sp] of [['#5b2a86', 0.12, 0.3], ['#3a1a5e', 0.07, 0.6]]) {
        g.fillStyle = col;
        g.beginPath(); g.moveTo(0, hy + 2);
        const off = skyX * sp;
        for (let x = 0; x <= W + 10; x += 10) {
          const k = (x + off) * 0.012;
          g.lineTo(x, hy - H * amp * (0.55 + 0.45 * Math.sin(k) * Math.sin(k * 0.37 + 1.3)));
        }
        g.lineTo(W, hy + 2); g.closePath(); g.fill();
      }
    }

    function drawSeg(s) {
      const W = cv.W, b = s.p2.screen;
      // il bordo inferiore scende di 1px per coprire le righine tra un tratto e l'altro
      const a = { x: s.p1.screen.x, y: s.p1.screen.y + 1, w: s.p1.screen.w };
      g.fillStyle = s.dark ? '#5aa83a' : '#68b844';
      g.fillRect(0, b.y, W, s.p1.screen.y - b.y);
      const r1 = a.w / 6, r2 = b.w / 6;
      const rc = s.dark ? '#ffffff' : '#e63946';
      poly(a.x - a.w - r1, a.y, a.x - a.w, a.y, b.x - b.w, b.y, b.x - b.w - r2, b.y, rc);
      poly(a.x + a.w + r1, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x + b.w + r2, b.y, rc);
      poly(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y, s.dark ? '#5d5d66' : '#64646d');
      if (!s.dark) {
        const l1 = a.w / 40, l2 = b.w / 40;
        for (const k of [-1 / 3, 1 / 3]) {
          const x1 = a.x + a.w * 2 * k, x2 = b.x + b.w * 2 * k;
          poly(x1 - l1, a.y, x1 + l1, a.y, x2 + l2, b.y, x2 - l2, b.y, '#f1f1f1');
        }
      }
      if (s.check) {
        const pw = Math.max(2, a.w * 0.04), top = a.y - a.w * 0.9;
        g.fillStyle = '#ddd';
        g.fillRect(a.x - a.w * 1.1 - pw / 2, top, pw, a.y - top);
        g.fillRect(a.x + a.w * 1.1 - pw / 2, top, pw, a.y - top);
        const bh = a.w * 0.22;
        for (let i = 0; i < 12; i++) {
          g.fillStyle = i % 2 ? '#111' : '#fff';
          g.fillRect(a.x - a.w * 1.1 + (a.w * 2.2 / 12) * i, top, a.w * 2.2 / 12 + 1, bh);
        }
        if (bh > 10) {
          g.font = `800 ${Math.round(bh * 0.7)}px 'Baloo 2', sans-serif`;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineWidth = Math.max(2, bh * 0.12); g.strokeStyle = '#111';
          g.strokeText('CHECKPOINT', a.x, top + bh / 2);
          g.fillStyle = '#ffd23f';
          g.fillText('CHECKPOINT', a.x, top + bh / 2);
        }
      }
    }

    // Veicoli visti da dietro (x = centro, yb = base, w = larghezza in pixel)
    function drawRear(k, x, yb, w, color, tilt = 0, braking = false) {
      g.save();
      g.translate(x, yb);
      g.rotate(tilt);
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.beginPath(); g.ellipse(0, 0, w * 0.55, w * 0.07, 0, 0, Math.PI * 2); g.fill();
      const light = braking ? '#ff5a5a' : '#c1121f';
      if (k === 'moto') {
        g.fillStyle = '#111'; rr(-w * 0.12, -w * 0.55, w * 0.24, w * 0.55, w * 0.1);
        g.fillStyle = color; rr(-w * 0.34, -w * 0.9, w * 0.68, w * 0.42, w * 0.14);
        g.fillStyle = light; rr(-w * 0.14, -w * 0.62, w * 0.28, w * 0.08, w * 0.03);
        g.fillStyle = '#2b2b40'; rr(-w * 0.3, -w * 1.5, w * 0.6, w * 0.68, w * 0.22);
        g.fillStyle = '#2b2b40'; rr(-w * 0.46, -w * 1.32, w * 0.2, w * 0.36, w * 0.08); rr(w * 0.26, -w * 1.32, w * 0.2, w * 0.36, w * 0.08);
        g.fillStyle = color; g.beginPath(); g.arc(0, -w * 1.66, w * 0.24, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.fillRect(-w * 0.24, -w * 1.7, w * 0.48, w * 0.05);
      } else if (k === 'camion' || k === 'bus') {
        const h = w * 0.95;
        g.fillStyle = '#111'; g.fillRect(-w * 0.46, -h * 0.14, w * 0.2, h * 0.14); g.fillRect(w * 0.26, -h * 0.14, w * 0.2, h * 0.14);
        g.fillStyle = color; rr(-w / 2, -h, w, h * 0.88, w * 0.05);
        g.fillStyle = 'rgba(0,0,0,.18)';
        if (k === 'camion') {
          g.fillRect(-w * 0.01, -h * 0.95, w * 0.02, h * 0.8);
          for (const s of [-1, 1]) g.fillRect(s * w * 0.25 - w * 0.01, -h * 0.95, w * 0.02, h * 0.8);
          g.fillStyle = '#333'; g.fillRect(-w * 0.5, -h * 0.16, w, h * 0.06);
        } else {
          g.fillStyle = '#1d2b44'; rr(-w * 0.42, -h * 0.92, w * 0.84, h * 0.3, w * 0.04);
        }
        g.fillStyle = light; g.fillRect(-w * 0.47, -h * 0.3, w * 0.12, w * 0.07); g.fillRect(w * 0.35, -h * 0.3, w * 0.12, w * 0.07);
      } else {
        const h = k === 'van' ? w * 0.72 : w * 0.48;
        g.fillStyle = '#111'; g.fillRect(-w * 0.48, -h * 0.28, w * 0.18, h * 0.28); g.fillRect(w * 0.3, -h * 0.28, w * 0.18, h * 0.28);
        g.fillStyle = color; rr(-w / 2, -h, w, h * 0.8, h * 0.16);
        g.beginPath();
        g.moveTo(-w * 0.4, -h * 0.98); g.lineTo(-w * 0.3, -h * 1.42); g.lineTo(w * 0.3, -h * 1.42); g.lineTo(w * 0.4, -h * 0.98); g.closePath();
        g.fill();
        g.fillStyle = '#1d2b44';
        g.beginPath();
        g.moveTo(-w * 0.34, -h * 1.0); g.lineTo(-w * 0.27, -h * 1.34); g.lineTo(w * 0.27, -h * 1.34); g.lineTo(w * 0.34, -h * 1.0); g.closePath();
        g.fill();
        g.fillStyle = light; rr(-w * 0.46, -h * 0.74, w * 0.2, h * 0.16, h * 0.05); rr(w * 0.26, -h * 0.74, w * 0.2, h * 0.16, h * 0.05);
        g.fillStyle = '#fff'; g.fillRect(-w * 0.1, -h * 0.52, w * 0.2, h * 0.14);
      }
      g.restore();
    }

    function render() {
      const W = cv.W, H = cv.H;
      g.save();
      if (shake > 0) g.translate(rand(-6, 6), rand(-4, 4));
      drawSky();

      const base = findSeg(position);
      const bp = (position % SEG) / SEG;
      const pseg = findSeg(position + playerZ);
      const pp = ((position + playerZ) % SEG) / SEG;
      const playerY = pseg.p1.world.y + (pseg.p2.world.y - pseg.p1.world.y) * pp;

      let maxy = H, x = 0, dx = -(base.curve * bp);
      for (let n = 0; n < DRAW; n++) {
        const s = segs[(base.index + n) % N];
        const camZ = position - (s.index < base.index ? L : 0);
        project(s.p1, playerX * ROAD_W - x, playerY + CAM_H, camZ);
        project(s.p2, playerX * ROAD_W - x - dx, playerY + CAM_H, camZ);
        x += dx; dx += s.curve;
        s.clip = maxy;
        if (s.p1.camera.z <= camDepth || s.p2.screen.y >= s.p1.screen.y || s.p2.screen.y >= maxy) continue;
        drawSeg(s);
        maxy = s.p2.screen.y;
      }

      // macchine nel tratto visibile, raggruppate per segmento
      const bySeg = new Map();
      for (const c of cars) {
        const i = Math.floor(c.z / SEG) % N;
        if (!bySeg.has(i)) bySeg.set(i, []);
        bySeg.get(i).push(c);
      }

      for (let n = DRAW - 1; n > 0; n--) {
        const s = segs[(base.index + n) % N];
        if (s.p1.camera.z <= camDepth) continue;
        const sc = s.p1.screen.scale;
        g.save();
        g.beginPath(); g.rect(0, 0, W, s.clip); g.clip();
        for (const sp of s.sprites) {
          const size = sc * ROAD_W * W / 2 * 0.9;
          if (size < 2) continue;
          const sx = s.p1.screen.x + sc * sp.off * ROAD_W * W / 2;
          g.drawImage(sprite(sp.e), sx - size / 2, s.p1.screen.y - size * 0.95, size, size);
        }
        const list = bySeg.get(s.index);
        if (list) {
          for (const c of list) {
            const k = (c.z % SEG) / SEG;
            const scale = sc + (s.p2.screen.scale - sc) * k;
            const cx = s.p1.screen.x + (s.p2.screen.x - s.p1.screen.x) * k + scale * c.off * ROAD_W * W / 2;
            const cy = s.p1.screen.y + (s.p2.screen.y - s.p1.screen.y) * k;
            const w = scale * c.w * ROAD_W * W / 2;
            if (w > 1.5) drawRear(c.kind, cx, cy, w, c.color);
          }
        }
        g.restore();
      }

      // il nostro veicolo
      const pw = V.w * ROAD_W * W / (2 * CAM_H);
      const bounce = Math.abs(playerX) > 1 && speed > 0 ? Math.sin(t * 40) * 3 : Math.sin(t * 12) * (speed > 0 ? 1 : 0);
      const blink = crashT > 0 && Math.floor(crashT * 12) % 2 === 0;
      if (!blink) drawRear(kind, W / 2, H * 0.95 + bounce, pw, V.color, lean, steer === 0 && speed < MAX * V.top * 0.4);
      g.restore();

      // tempo e velocità
      g.textAlign = 'center'; g.textBaseline = 'top';
      g.font = `800 ${Math.round(Math.min(W, H) * 0.1)}px 'Baloo 2', sans-serif`;
      g.lineWidth = 6; g.strokeStyle = '#2a1458';
      const tl = Math.ceil(timeLeft);
      g.strokeText(tl, W / 2, 8);
      g.fillStyle = timeLeft <= 10 ? '#ff4d6d' : '#ffd23f';
      g.fillText(tl, W / 2, 8);
      g.font = `800 ${Math.round(Math.min(W, H) * 0.05)}px 'Baloo 2', sans-serif`;
      g.textAlign = 'right';
      const kmh = Math.round(speed / MAX * 240);
      g.lineWidth = 4;
      g.strokeText(`${kmh} km/h`, W - 12, 12);
      g.fillStyle = '#fff';
      g.fillText(`${kmh} km/h`, W - 12, 12);

      // frecce di guida
      const ar = Math.min(W, H) * 0.09;
      for (const [sx, d] of [[ar + 12, -1], [W - ar - 12, 1]]) {
        const on = steer === d;
        g.fillStyle = on ? 'rgba(255,210,63,.55)' : 'rgba(255,255,255,.22)';
        g.beginPath(); g.arc(sx, H - ar - 14, ar, 0, Math.PI * 2); g.fill();
        g.fillStyle = on ? '#2a1458' : 'rgba(255,255,255,.85)';
        g.beginPath();
        g.moveTo(sx + d * ar * 0.45, H - ar - 14);
        g.lineTo(sx - d * ar * 0.3, H - ar - 14 - ar * 0.45);
        g.lineTo(sx - d * ar * 0.3, H - ar - 14 + ar * 0.45);
        g.closePath(); g.fill();
      }

      if (countdown > 0) {
        const n = Math.ceil(countdown);
        g.font = `800 ${Math.round(Math.min(W, H) * 0.35)}px 'Baloo 2', sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 10; g.strokeStyle = '#2a1458';
        g.strokeText(n, W / 2, H * 0.4);
        g.fillStyle = '#fff';
        g.fillText(n, W / 2, H * 0.4);
      }
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (countdown > 0) {
        const before = Math.ceil(countdown);
        countdown -= dt;
        if (Math.ceil(countdown) !== before) Sound.tone(countdown > 0 ? 520 : 1040, 0.18, 'square', 0.08);
        if (countdown <= 0) { countdown = 0; running = true; ctx.begin(); ctx.popup('VIA! 🏁', cv.W / 2, cv.H * 0.4, 'gold'); }
      }
      if (running) update(dt);
      if (stopped) return;
      render();
      raf = requestAnimationFrame(loop);
    }

    last = performance.now();
    raf = requestAnimationFrame(loop);

    ctx.intro({
      title: 'Corsa su Strada',
      art: '<span class="emo">🏍️</span><span class="emo">🏎️</span><span class="emo">🚛</span>',
      text: 'Il veicolo accelera da solo: <b>tieni premuto a sinistra o a destra</b> per sterzare. Sorpassa le macchine (<b>+20</b>) e arriva ai <b>CHECKPOINT</b> per avere più tempo. Ma attenzione: ogni urto toglie secondi, e a ogni livello arrivano più macchine che cambiano corsia! Scegli con cosa correre:',
      buttons: [
        { label: '🏍️ Moto · velocissima e agile', value: 'moto' },
        { label: '🏎️ Auto · la più equilibrata', value: 'auto' },
        { label: '🚛 Camion · lento ma spinge via tutti', value: 'camion' },
      ],
    }, v => {
      kind = v; V = VEH[v];
      info();
      countdown = 3;
      Sound.tone(520, 0.18, 'square', 0.08);
    });

    return {
      stop() {
        running = false;
        stopped = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        cv.dispose();
      },
    };
  },
});
}
