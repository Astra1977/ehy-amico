import {
  RoachEngine,
  RunnerEngine,
  ROACH_GOALS,
  RUNNER_DURATIONS,
  TETRIS_GOALS,
} from "./arcade-engines.js";
import { TetrisEngine, SHAPES, BLOCK_COLORS } from "./tetris-engine.js";
export const OBJECTIVES = {
  roach: ROACH_GOALS.map(
    (n, i) =>
      `${n} catture in 35 secondi, massimo ${4 - i} errori${i === 4 ? " e un boss sconfitto" : ""}`,
  ),
  runner: RUNNER_DURATIONS.map((n) => `Supera ${n} secondi senza collisioni`),
  tetris: TETRIS_GOALS.map((n) => `Elimina ${n} righe nella stessa partita`),
};
export const GAME_HINTS = {
  roach: [
    "Ehy Amico! Tocca le cucaracha, ma lascia tranquille le coccinelle: sono amiche del giardino!",
    "Il boss ha cinque punti energia: colpiscilo cinque volte. Non scompare dopo il primo colpo!",
    "Le combo aumentano i punti. Per il tesoro contano catture, errori e il timer completo.",
  ],
  runner: [
    "Ehy Amico! Tocca il campo o premi Salta. Con la tastiera usa Spazio o Freccia su.",
    "Gli ostacoli hanno altezze diverse: osserva la distanza e salta poco prima di raggiungerli.",
    "Il sentiero accelera! Se inciampi, il tuo record e i tesori conquistati restano nello zaino.",
  ],
  tetris: [
    "Ehy Amico! Completa una riga senza buchi: sparirà e farà scendere i blocchi sopra.",
    "Freccia su ruota, destra e sinistra spostano. Spazio fa cadere subito il pezzo.",
    "Un tesoro ogni dieci righe nella stessa partita. Dopo cinquanta puoi continuare per il record!",
  ],
};
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
function button(parent, text, fn) {
  const b = node("button", text);
  b.type = "button";
  b.onclick = fn;
  parent.append(b);
  return b;
}
function finish(ctx, engine) {
  ctx.play.dataset.state = engine.state;
  ctx.best("", engine.points);
  if (engine.state === "won") ctx.complete(ctx.stage);
  ctx.info(
    (engine.state === "won" ? "Obiettivo completato!" : "Ops, riprova!") +
      " · Punti " +
      engine.points +
      " · Record " +
      ctx.score(),
  );
}
export function roach(ctx) {
  const engine = new RoachEngine(ctx.stage, ctx.difficulty),
    field = node("div", undefined, "roach-field");
  field.setAttribute("aria-label", "Campo delle cucaracha");
  ctx.play.append(field);
  const targets = new Map();
  let done = false;
  function render() {
    for (const [id, b] of targets)
      if (!engine.targets.some((t) => t.id === id)) {
        b.remove();
        targets.delete(id);
      }
    for (const t of engine.targets) {
      let b = targets.get(t.id);
      if (!b) {
        b = button(field, "", () => {
          if (ctx.paused) return;
          engine.hit(t.id);
          ctx.best("", engine.points);
          render();
        });
        b.className = "roach-target " + t.type;
        b.style.left = t.x + "%";
        b.style.top = t.y + "%";
        b.dataset.target = t.type;
        const img = node("img");
        img.src =
          "./assets/" +
          (t.type === "decoy"
            ? "ladybug"
            : t.type === "boss"
              ? "roach-boss"
              : "roach") +
          ".svg";
        img.alt = "";
        if (t.penalty === 30) img.className = "golden-ladybug";
        b.append(img);
        b.append(node("span"));
        targets.set(t.id, b);
      }
      b.setAttribute(
        "aria-label",
        t.type === "decoy"
          ? t.penalty === 30
            ? "Coccinella dorata amica: non colpire"
            : "Coccinella amica: non colpire"
          : t.type === "boss"
            ? "Boss: " + t.hp + " colpi rimasti"
            : "Cucaracha",
      );
      b.lastChild.textContent = t.type === "boss" ? t.hp + " colpi" : "";
    }
    if (!done)
      ctx.info(
        "Tempo " +
          Math.ceil(35 - engine.time) +
          " s · Punti " +
          engine.points +
          " · Catture " +
          engine.captures +
          "/" +
          ROACH_GOALS[ctx.stage - 1] +
          " · Errori " +
          engine.errors +
          "/" +
          (5 - ctx.stage) +
          " · Combo " +
          engine.combo,
      );
  }
  ctx.frames((dt) => {
    if (done) return;
    engine.tick(dt);
    render();
    if (engine.state !== "playing") {
      done = true;
      finish(ctx, engine);
    }
  });
  render();
}
export function runner(ctx) {
  const engine = new RunnerEngine(ctx.stage, ctx.difficulty),
    canvas = node("canvas", undefined, "runner-canvas");
  engine.width = Math.max(480, Math.min(1000, ctx.play.clientWidth));
  canvas.width = engine.width;
  canvas.height = 340;
  canvas.setAttribute("aria-label", "Percorso a ostacoli: tocca per saltare");
  ctx.play.append(canvas);
  const controls = node("div", undefined, "game-controls");
  ctx.play.append(controls);
  const jump = () => {
    if (!ctx.paused) engine.jump();
  };
  button(controls, "Salta", jump);
  ctx.listen(canvas, "pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  ctx.listen(window, "keydown", (e) => {
    if (
      ["Space", "ArrowUp"].includes(e.code) &&
      !["BUTTON", "SELECT", "INPUT", "TEXTAREA"].includes(e.target.tagName) &&
      !document.querySelector("dialog[open]")
    ) {
      e.preventDefault();
      if (!e.repeat) jump();
    }
  });
  let done = false;
  const paint = canvas.getContext("2d");
  const hero = new Image();
  hero.src = "./assets/runner-cat.svg";
  const obstacle = new Image();
  obstacle.src = "./assets/obstacle.svg";
  ctx.frames((dt) => {
    if (!done) {
      engine.tick(dt);
      ctx.best("", engine.points);
      if (engine.state !== "playing") {
        done = true;
        finish(ctx, engine);
      } else
        ctx.info(
          "Punti " +
            engine.points +
            " · Tempo " +
            engine.time.toFixed(1) +
            "/" +
            RUNNER_DURATIONS[ctx.stage - 1] +
            " s · Velocità " +
            Math.round(engine.speed),
        );
    }
    const g = paint;
    g.fillStyle = "#cae1b3";
    g.fillRect(0, 0, engine.width, 340);
    g.fillStyle = "#58846a";
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.arc(i * 155 - ((engine.time * 25) % 155), 265, 95, Math.PI, 0);
      g.fill();
    }
    g.fillStyle = "#796138";
    g.fillRect(0, 265, engine.width, 75);
    g.fillStyle = "#d0ab66";
    for (let i = 0; i < 20; i++)
      g.fillRect(i * 60 - ((engine.time * engine.speed) % 60), 280, 30, 5);
    const x = engine.width * 0.12;
    if (hero.complete && hero.naturalWidth)
      g.drawImage(hero, x, 265 - 72 - engine.lift, 86, 72);
    for (const o of engine.obstacles)
      if (obstacle.complete && obstacle.naturalWidth)
        g.drawImage(obstacle, o.x - o.size / 2, 265 - o.size, o.size, o.size);
    if (done) {
      g.fillStyle = "#103b36dd";
      g.fillRect(engine.width * 0.05, 90, engine.width * 0.9, 120);
      g.fillStyle = "#fff5d4";
      g.font = "bold " + Math.min(30, engine.width / 25) + "px system-ui";
      g.textAlign = "center";
      g.fillText(
        engine.state === "won"
          ? "Sentiero superato!"
          : "Un piccolo inciampo. Riprova!",
        engine.width / 2,
        155,
      );
    }
  });
}
export function tetris(ctx) {
  const engine = new TetrisEngine(),
    root = node("div", undefined, "tetris-layout");
  ctx.play.append(root);
  const canvas = node("canvas", undefined, "tetris-board");
  canvas.width = 300;
  canvas.height = 600;
  canvas.setAttribute(
    "aria-label",
    "Griglia Tetris: dieci colonne e venti righe",
  );
  root.append(canvas);
  const sidebar = node("div", undefined, "tetris-sidebar");
  root.append(sidebar);
  sidebar.append(node("p", "Prossimo pezzo"));
  const preview = node("canvas");
  preview.width = 120;
  preview.height = 120;
  preview.setAttribute("aria-label", "Prossimo tetramino");
  sidebar.append(preview);
  const detail = node("p");
  sidebar.append(detail);
  const progress = node("progress");
  progress.max = 50;
  progress.setAttribute("aria-label", "Righe verso il frammento");
  sidebar.append(progress);
  let elapsed = 0,
    repeat = null,
    repeatTime = 0,
    continueButton;
  function update() {
    ctx.play.dataset.state = engine.state;
    ctx.best("", engine.score);
    progress.value = engine.lines;
    detail.textContent = "Righe " + engine.lines + " · Livello " + engine.level;
    ctx.info(
      "Punti " +
        engine.score +
        " · Record " +
        ctx.score() +
        " · " +
        (engine.state === "over"
          ? "Fine partita: riprova"
          : engine.state === "won"
            ? "Bussola ricomposta!"
            : "Completa le righe"),
    );
    for (let n = 1; n <= Math.min(5, Math.floor(engine.lines / 10)); n++)
      ctx.complete(n);
    ctx.play.dataset.state = engine.state;
    if (engine.state === "won" && !continueButton)
      continueButton = button(sidebar, "Continua per il record", () => {
        engine.state = "playing";
        continueButton.remove();
        elapsed = 0;
        update();
      });
  }
  const act = (action) => {
    if (ctx.paused || engine.state !== "playing") return;
    ({
      left: () => engine.move(-1),
      right: () => engine.move(1),
      rotate: () => engine.rotate(),
      soft: () => engine.down(true),
      drop: () => engine.hardDrop(),
    })[action]();
    update();
    draw();
  };
  const controls = node("div", undefined, "game-controls tetris-controls");
  ctx.play.append(controls);
  for (const [action, label] of [
    ["left", "Sinistra"],
    ["rotate", "Ruota"],
    ["right", "Destra"],
    ["soft", "Scendi"],
    ["drop", "Giù subito"],
  ]) {
    const b = button(controls, label, (e) => {
      if (e.detail === 0) act(action);
    });
    ctx.listen(b, "pointerdown", (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      act(action);
      if (["left", "right", "soft"].includes(action)) {
        repeat = action;
        repeatTime = -0.24;
      }
    });
    const stop = () => {
      repeat = null;
    };
    ctx.listen(b, "pointerup", stop);
    ctx.listen(b, "pointercancel", () => {
      stop();
    });
    ctx.listen(b, "lostpointercapture", stop);
  }
  ctx.listen(window, "keydown", (e) => {
    if (
      ["BUTTON", "SELECT", "INPUT", "TEXTAREA"].includes(e.target.tagName) ||
      document.querySelector("dialog[open]")
    )
      return;
    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "rotate",
      ArrowDown: "soft",
      " ": "drop",
    };
    if (e.key.toLowerCase() === "p") {
      e.preventDefault();
      ctx.setPaused(!ctx.paused);
    }
    if (map[e.key]) {
      e.preventDefault();
      if (!e.repeat || !["rotate", "drop"].includes(map[e.key]))
        act(map[e.key]);
    }
  });
  ctx.listen(ctx.play, "game:pausechange", () => {
    repeat = null;
    elapsed = 0;
  });
  function block(g, x, y, size, color) {
    g.fillStyle = color;
    g.fillRect(x + 1, y + 1, size - 2, size - 2);
    g.fillStyle = "#ffffff66";
    g.fillRect(x + 3, y + 3, size - 6, 3);
  }
  function draw() {
    const g = canvas.getContext("2d");
    g.fillStyle = "#102f36";
    g.fillRect(0, 0, 300, 600);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 10; x++) {
        g.strokeStyle = "#ffffff12";
        g.strokeRect(x * 30, y * 30, 30, 30);
        if (engine.board[y][x])
          block(g, x * 30, y * 30, 30, BLOCK_COLORS[engine.board[y][x] - 1]);
      }
    engine.piece.matrix.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v)
          block(
            g,
            (engine.piece.x + x) * 30,
            (engine.piece.y + y) * 30,
            30,
            BLOCK_COLORS[engine.piece.kind],
          );
      }),
    );
    if (engine.state !== "playing") {
      g.fillStyle = "#103b36e8";
      g.fillRect(0, 240, 300, 100);
      g.fillStyle = "white";
      g.font = "bold 22px system-ui";
      g.textAlign = "center";
      g.fillText(
        engine.state === "won" ? "Percorso completato!" : "Fine partita",
        150,
        295,
      );
    }
    const p = preview.getContext("2d");
    p.clearRect(0, 0, 120, 120);
    SHAPES[engine.next].forEach((r, y) =>
      r.forEach((v, x) => {
        if (v)
          block(p, x * 25 + 10, y * 25 + 10, 25, BLOCK_COLORS[engine.next]);
      }),
    );
  }
  ctx.frames((dt) => {
    if (engine.state === "playing") {
      elapsed += dt * 1000;
      if (elapsed >= engine.interval * (1 - ctx.difficulty * 0.12)) {
        elapsed = 0;
        engine.down();
        update();
      }
      if (repeat) {
        repeatTime += dt;
        if (repeatTime > 0.12) {
          repeatTime = 0;
          act(repeat);
        }
      }
    }
    draw();
  });
  update();
  draw();
}
export const PLAYABLE = { roach, runner, tetris };
