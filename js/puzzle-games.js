import { MazeEngine, MemoryEngine, MEMORY_PAIRS } from "./puzzle-engines.js";
export const PUZZLE_OBJECTIVES = {
  maze: [1, 2, 3, 4, 5].map(
    (n) => "Raggiungi l’uscita del Tempio · percorso " + n + "/5",
  ),
  memory: MEMORY_PAIRS.map(
    (n) => "Ricostruisci tutte le " + n + " coppie dei ricordi",
  ),
};
export const PUZZLE_HINTS = {
  maze: [
    "Ehy Amico! Segui i corridoi del Tempio del Tempo fino alla bussola luminosa.",
    "Le pareti sono solide: frecce, pulsanti e scorrimenti muovono sempre di una casella.",
    "Se trovi un vicolo cieco, torna sui tuoi passi. Ogni tempio ha una strada fino all’uscita!",
  ],
  memory: [
    "Ehy Amico! Scopri due carte: le coppie uguali custodiscono lo stesso ricordo.",
    "Osserva dove sono gli oggetti. Le coppie sbagliate si ricoprono dopo un momento.",
    "Un ricordo alla volta: le coppie trovate restano visibili. Puoi prenderti tutto il tempo che serve!",
  ],
};
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
function finish(ctx, e, text) {
  ctx.play.dataset.state = "won";
  ctx.best("", e.points);
  ctx.complete(ctx.stage);
  ctx.info(text + " · Punti " + e.points + " · Record " + ctx.score());
}
export function maze(ctx) {
  const engine = new MazeEngine(ctx.stage, ctx.difficulty),
    root = node("div", undefined, "temple-game"),
    grid = node("div", undefined, "temple-grid");
  grid.setAttribute("role", "img");
  grid.style.setProperty("--size", engine.size);
  root.append(grid);
  ctx.play.append(root);
  const cells = [];
  for (let y = 0; y < engine.size; y++)
    for (let x = 0; x < engine.size; x++) {
      const cell = node("div", undefined, "temple-cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.dataset.tile =
        engine.map[y][x] === "#"
          ? "wall"
          : engine.map[y][x] === "E"
            ? "exit"
            : "path";
      cell.setAttribute("aria-hidden", "true");
      grid.append(cell);
      cells.push(cell);
    }
  let lastCell;
  const update = () => {
    if (lastCell) lastCell.classList.remove("explorer");
    lastCell = cells[engine.y * engine.size + engine.x];
    lastCell.classList.add("explorer");
    grid.setAttribute(
      "aria-label",
      "Tempio: Esploratore in colonna " +
        (engine.x + 1) +
        ", riga " +
        (engine.y + 1) +
        ". Uscita in colonna " +
        (engine.size - 1) +
        ", riga " +
        (engine.size - 1),
    );
    ctx.info(
      "Passi " +
        engine.moves +
        " · Pareti incontrate " +
        engine.blocked +
        " · Tempo " +
        Math.floor(engine.time) +
        " s · Record " +
        ctx.score(),
    );
  };
  const move = (dx, dy) => {
    if (ctx.paused || engine.state !== "playing") return;
    engine.move(dx, dy);
    update();
    if (engine.state === "won")
      finish(ctx, engine, "Uscita trovata in " + engine.moves + " passi!");
  };
  const controls = node("div", undefined, "temple-controls");
  controls.setAttribute("aria-label", "Comandi del Tempio");
  root.append(controls);
  let held = null,
    elapsed = 0;
  for (const [label, dx, dy] of [
    ["Su", 0, -1],
    ["Sinistra", -1, 0],
    ["Giù", 0, 1],
    ["Destra", 1, 0],
  ]) {
    const b = node("button", label);
    b.type = "button";
    b.dataset.direction = label;
    controls.append(b);
    b.onclick = (e) => {
      if (e.detail === 0) move(dx, dy);
    };
    ctx.listen(b, "pointerdown", (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      move(dx, dy);
      held = [dx, dy];
      elapsed = -0.2;
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      ctx.listen(b, event, () => (held = null));
  }
  ctx.listen(ctx.play, "game:pausechange", () => (held = null));
  ctx.listen(window, "keydown", (e) => {
    if (
      ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName) ||
      document.querySelector("dialog[open]")
    )
      return;
    const d = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }[e.key];
    if (d) {
      e.preventDefault();
      move(...d);
    }
  });
  let from;
  ctx.listen(grid, "pointerdown", (e) => {
    from = { id: e.pointerId, x: e.clientX, y: e.clientY };
    grid.setPointerCapture(e.pointerId);
  });
  ctx.listen(grid, "pointerup", (e) => {
    if (!from || from.id !== e.pointerId) return;
    const dx = e.clientX - from.x,
      dy = e.clientY - from.y;
    from = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
    move(
      ...(Math.abs(dx) > Math.abs(dy)
        ? [Math.sign(dx), 0]
        : [0, Math.sign(dy)]),
    );
  });
  ctx.listen(grid, "pointercancel", () => (from = null));
  ctx.listen(ctx.play, "game:pausechange", () => (from = null));
  let second = -1;
  ctx.frames((dt) => {
    engine.tick(dt);
    if (held) {
      elapsed += dt;
      if (elapsed >= 0.13) {
        elapsed = 0;
        move(...held);
      }
    }
    if (engine.state === "playing" && Math.floor(engine.time) !== second) {
      second = Math.floor(engine.time);
      update();
    }
  });
  update();
}
export function memory(ctx) {
  const engine = new MemoryEngine(ctx.stage, ctx.difficulty),
    grid = node("div", undefined, "memory-grid");
  grid.setAttribute("aria-label", "Carte dei ricordi perduti");
  ctx.play.append(grid);
  const cards = [];
  const names = [
    "Lente",
    "Sentiero",
    "Cristalli",
    "Tempio",
    "Ricordi",
    "Costa",
    "Fossili",
    "Portale",
    "Atlante",
    "Grotta",
    "Laboratorio",
    "Laguna",
  ];
  function render() {
    engine.cards.forEach((c, i) => {
      const b = cards[i];
      b.disabled = c.matched || engine.wait > 0;
      b.classList.toggle("revealed", c.face);
      b.classList.toggle("matched", c.matched);
      b.setAttribute("aria-pressed", String(c.face));
      b.setAttribute(
        "aria-label",
        "Carta " +
          (i + 1) +
          (c.face
            ? ": " + names[c.symbol] + (c.matched ? ", coppia ritrovata" : "")
            : " coperta"),
      );
      b.firstChild.hidden = !c.face;
      b.lastChild.hidden = c.face;
    });
    ctx.info(
      "Coppie " +
        engine.matched +
        "/" +
        engine.pairs +
        " · Mosse " +
        engine.moves +
        " · Tempo " +
        Math.floor(engine.time) +
        " s · Record " +
        ctx.score(),
    );
  }
  engine.cards.forEach((c, i) => {
    const b = node("button", undefined, "memory-card");
    b.type = "button";
    b.dataset.card = i;
    const art = node("span", undefined, "memory-art");
    art.style.setProperty("--col", c.symbol % 4);
    art.style.setProperty("--row", Math.floor(c.symbol / 4));
    art.setAttribute("aria-hidden", "true");
    const back = node("span", undefined, "memory-back");
    back.setAttribute("aria-hidden", "true");
    b.append(art, back);
    b.onclick = () => {
      if (ctx.paused) return;
      if (engine.flip(i)) {
        render();
        if (engine.state === "won")
          finish(
            ctx,
            engine,
            "Tutti i ricordi ritrovati in " + engine.moves + " mosse!",
          );
      }
    };
    grid.append(b);
    cards.push(b);
  });
  let second = -1;
  ctx.frames((dt) => {
    const waiting = engine.wait > 0;
    engine.tick(dt);
    if (
      engine.state === "playing" &&
      ((waiting && engine.wait === 0) || Math.floor(engine.time) !== second)
    ) {
      second = Math.floor(engine.time);
      render();
    }
  });
  render();
}
