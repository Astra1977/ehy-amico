import { registerRoad } from "./road-original.js";
export const ROAD_OBJECTIVES = [1, 2, 3, 4, 5].map(
  (n) => "Supera il checkpoint " + n + " nella stessa corsa",
);
export const ROAD_HINTS = [
  "Ehy Amico! Il veicolo accelera da solo: tieni premuto a sinistra o a destra per sterzare.",
  "Resta sulla strada! Fuori pista perdi velocità e gli urti tolgono secondi.",
  "I checkpoint regalano tempo e tesori. Moto, auto e camion hanno caratteristiche diverse: provali!",
];
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const clean = (text) =>
  String(text)
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
// Decorazioni vettoriali locali al posto dei glifi di sistema del sorgente.
function sceneryCanvas() {
  const canvas = document.createElement("canvas"),
    g = canvas.getContext("2d");
  g.fillText = (kind) => {
    g.clearRect(0, 0, 128, 128);
    g.lineCap = "round";
    if (kind === "🌵") {
      g.strokeStyle = "#39865c";
      g.lineWidth = 15;
      g.beginPath();
      g.moveTo(66, 113);
      g.lineTo(66, 30);
      g.moveTo(65, 75);
      g.lineTo(34, 75);
      g.lineTo(34, 51);
      g.moveTo(68, 61);
      g.lineTo(94, 61);
      g.lineTo(94, 40);
      g.stroke();
      g.strokeStyle = "#8bb76c";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(63, 109);
      g.lineTo(63, 34);
      g.stroke();
    } else {
      g.strokeStyle = "#926035";
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(61, 118);
      g.quadraticCurveTo(74, 78, 62, 45);
      g.stroke();
      if (kind === "🌳") {
        for (const [x, y, r] of [
          [39, 47, 25],
          [83, 44, 27],
          [61, 25, 25],
        ]) {
          g.fillStyle = y === 25 ? "#62a451" : "#34794b";
          g.beginPath();
          g.arc(x, y, r, 0, Math.PI * 2);
          g.fill();
        }
      } else {
        for (let i = 0; i < 7; i++) {
          const a = (i * Math.PI * 2) / 7;
          g.fillStyle = i % 2 ? "#4d9b55" : "#2b704d";
          g.beginPath();
          g.moveTo(63, 42);
          g.quadraticCurveTo(
            63 + Math.cos(a) * 42,
            42 + Math.sin(a) * 14,
            63 + Math.cos(a) * 57,
            54 + Math.sin(a) * 35,
          );
          g.quadraticCurveTo(
            63 + Math.cos(a) * 25,
            50 + Math.sin(a) * 10,
            63,
            42,
          );
          g.fill();
        }
      }
    }
  };
  return canvas;
}
export function road(ctx) {
  const stage = node("div", undefined, "road-stage");
  ctx.play.append(stage);
  let pending = null,
    clock = performance.now(),
    tasks = [],
    game,
    definition,
    points = 0,
    detail = "Scegli il veicolo",
    ended = false;
  const pointers = new Set();
  let cv, observer;
  const refresh = () =>
    ctx.info("Punti " + points + " · Record " + ctx.score() + " · " + detail);
  const Sound = {
    on: ctx.soundEnabled,
    ac: null,
    unlock() {
      if (!this.on) return;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio) {
          this.ac ??= new Audio();
          this.ac.resume().catch(() => {});
        }
      } catch {}
    },
    tone(f, d = 0.12, type = "sine", v = 0.1) {
      if (!this.on || !this.ac || ctx.paused) return;
      try {
        const o = this.ac.createOscillator(),
          gain = this.ac.createGain(),
          t = this.ac.currentTime;
        o.frequency.value = f;
        o.type = type;
        gain.gain.setValueAtTime(v, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(gain);
        gain.connect(this.ac.destination);
        o.start(t);
        o.stop(t + d + 0.02);
      } catch {}
    },
    bad() {
      this.tone(140, 0.2, "sawtooth", 0.06);
    },
    win() {
      this.tone(1047, 0.22, "triangle", 0.1);
    },
  };
  const U = {
    rand: (a, b) => a + Math.random() * (b - a),
    pick: (items) => items[Math.floor(Math.random() * items.length)],
    ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    vibrate() {},
  };
  function overlay(title, message) {
    const panel = node("div", undefined, "road-overlay");
    panel.append(node("h2", title), node("p", message));
    stage.append(panel);
    return panel;
  }
  const release = () => {
    for (const key of ["ArrowLeft", "ArrowRight"])
      window.dispatchEvent(new KeyboardEvent("keyup", { key }));
    if (cv)
      for (const id of pointers)
        cv.c.dispatchEvent(
          new PointerEvent("pointercancel", { pointerId: id }),
        );
    pointers.clear();
  };
  const api = {
    canvas() {
      const canvas = node("canvas", undefined, "road-canvas");
      canvas.setAttribute(
        "aria-label",
        "Strada pseudo-3D: tieni premuta la metà sinistra o destra per sterzare",
      );
      stage.append(canvas);
      cv = { c: canvas, g: canvas.getContext("2d"), W: 0, H: 0 };
      const fit = () => {
        const rect = stage.getBoundingClientRect(),
          dpr = Math.min(2, devicePixelRatio || 1);
        if (!rect.width || !rect.height) return;
        const old = document.createElement("canvas");
        old.width = canvas.width;
        old.height = canvas.height;
        old.getContext("2d").drawImage(canvas, 0, 0);
        cv.W = rect.width;
        cv.H = rect.height;
        canvas.width = Math.round(cv.W * dpr);
        canvas.height = Math.round(cv.H * dpr);
        cv.g.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (old.width && old.height)
          cv.g.drawImage(old, 0, 0, old.width, old.height, 0, 0, cv.W, cv.H);
        release();
      };
      cv.pos = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      cv.dispose = () => observer?.disconnect();
      observer = new ResizeObserver(fit);
      observer.observe(stage);
      fit();
      ctx.listen(canvas, "pointerdown", (e) => pointers.add(e.pointerId));
      for (const event of ["pointerup", "pointercancel"])
        ctx.listen(canvas, event, (e) => pointers.delete(e.pointerId));
      ctx.listen(canvas, "lostpointercapture", e => {
        const held=pointers.has(e.pointerId);
        pointers.delete(e.pointerId);
        if(held) canvas.dispatchEvent(new PointerEvent("pointercancel",{pointerId:e.pointerId}));
      });
      return cv;
    },
    info(text) {
      detail = clean(text);
      const level = Number(text.match(/Livello (\d+)/)?.[1] || 1);
      for (let n = 1; n <= Math.min(5, level - 1); n++) ctx.complete(n);
      refresh();
    },
    add(n) {
      if (ended) return;
      points = Math.max(0, points + n);
      ctx.best("", points);
      refresh();
    },
    begin() {
      stage.dataset.running = "true";
    },
    popup(text, x, y) {
      const p = node("div", clean(text), "road-popup");
      p.style.left = x + "px";
      p.style.top = y + "px";
      stage.append(p);
      tasks.push({ at: clock + 1100, fn: () => p.remove() });
    },
    intro(options, start) {
      const intro = overlay(
        "Out Run",
        "Scegli il veicolo, poi tieni premuto un lato del campo o usa le frecce. Supera i checkpoint prima che scada il tempo.",
      );
      for (const choice of options.buttons) {
        const b = node("button", clean(choice.label));
        b.type = "button";
        b.dataset.vehicle = choice.value;
        b.onclick = () => {
          intro.remove();
          Sound.unlock();
          start(choice.value);
        };
        intro.append(b);
      }
    },
    end(result) {
      if (ended) return;
      ended = true;
      stage.dataset.running = "false";
      ctx.play.dataset.state = "over";
      const template = document.createElement("template");
      template.innerHTML = result.msg.replace(/<br\s*\/?>/gi, " · ");
      detail = clean(template.content.textContent);
      overlay(
        clean(result.title),
        detail + " · " + points + " punti. Premi Riprova per ripartire.",
      );
      refresh();
      game.stop();
      release();
    },
  };
  registerRoad(
    {
      register(value) {
        definition = value;
      },
    },
    U,
    Sound,
    (fn, ms) => tasks.push({ at: clock + ms, fn }),
    (fn) => {
      pending = fn;
      return 1;
    },
    () => (pending = null),
    { createElement: () => sceneryCanvas() },
  );
  game = definition.start(api);
  const controls = node("div", undefined, "game-controls road-controls");
  ctx.play.append(controls);
  for (const [label, side] of [
    ["Sterza a sinistra", 0.15],
    ["Sterza a destra", 0.85],
  ]) {
    const b = node("button", label);
    b.type = "button";
    controls.append(b);
    const send = (type, id) => {
      const r = cv.c.getBoundingClientRect();
      cv.c.dispatchEvent(
        new PointerEvent(type, {
          pointerId: id,
          clientX: r.left + r.width * side,
          clientY: r.top + r.height * 0.75,
        }),
      );
    };
    ctx.listen(b, "pointerdown", (e) => {
      if (ctx.paused || ended) return;
      e.preventDefault();
      pointers.add(e.pointerId);
      send("pointerdown", e.pointerId);
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      ctx.listen(b, event, (e) => {
        send("pointercancel", e.pointerId);
        pointers.delete(e.pointerId);
      });
    ctx.listen(b, "keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!ctx.paused)
          window.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: side < 0.5 ? "ArrowLeft" : "ArrowRight",
            }),
          );
      }
    });
    ctx.listen(b, "keyup", (e) => {
      if (e.key === " " || e.key === "Enter") release();
    });
  }
  ctx.play.append(
    node(
      "p",
      "Implementazione originale di Andrea · adattata per EHY AMICO!",
      "road-credit",
    ),
  );
  ctx.listen(window, "keydown", (e) => {
    if (
      ["ArrowLeft", "ArrowRight"].includes(e.key) &&
      !["SELECT", "INPUT", "TEXTAREA"].includes(e.target.tagName)
    )
      e.preventDefault();
  });
  ctx.listen(ctx.play, "game:pausechange", () => {
    release();
    if (Sound.ac) {
      if (ctx.paused) Sound.ac.suspend().catch(() => {});
      else Sound.ac.resume().catch(() => {});
    }
  });
  ctx.frames((dt) => {
    clock += dt * 1000;
    const ready = tasks.filter((t) => t.at <= clock);
    tasks = tasks.filter((t) => t.at > clock);
    for (const task of ready) task.fn();
    const fn = pending;
    pending = null;
    if (fn) fn(clock);
  });
  ctx.onCleanup(() => {
    release();
    game.stop();
    pending = null;
    tasks = [];
    Sound.ac?.close().catch(() => {});
  });
  refresh();
}
