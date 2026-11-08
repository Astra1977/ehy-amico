import { node, button } from "./education-dom.js";
import { AtlasEngine, DriveEngine, FootballEngine } from "./atlas-engine.js";
import { MISSIONS, CITIES, city, project, SOUVENIRS } from "./atlas-data.js";
import { STATES } from "./atlas-states.js";
export { MISSIONS };
const NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text) n.textContent = text;
  return n;
}
export function atlasSouvenirs(data) {
  return [
    ...new Set(
      Object.values(data.adventures?.atlas || {}).flatMap(
        (s) => s.souvenirs || [],
      ),
    ),
  ].filter((id) => SOUVENIRS[id]);
}
export function atlas(ctx) {
  const previous = ctx.readAdventure();
  const e = new AtlasEngine(
    ctx.stage,
    ctx.restart
      ? {
          mode: previous?.mode || "explorer",
          souvenirs: previous?.souvenirs || [],
          records: previous?.records || { explorer: 0, veteran: 0 },
        }
      : previous,
  );
  const root = node("section", undefined, "atlas-game");
  ctx.play.append(root);
  let renderController = new AbortController();
  const on = (target, event, fn) =>
    target.addEventListener(event, fn, { signal: renderController.signal });
  let view = "map",
    drive = null,
    football = null,
    canvas = null,
    steer = 0,
    stamp = 0,
    placing = false,
    tuning = 50,
    zoom = 1,
    pan = { x: 0, y: 0 },
    camper = null,
    stagePanel,
    caption,
    marker = { x: 400, y: 250 },
    picked = -1;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const persist = () => {
    const s = e.export();
    s.drive = drive?.export() || null;
    s.football = football ? JSON.parse(JSON.stringify(football)) : null;
    s.view = view;
    ctx.saveAdventure(s);
  };
  const say = () => {
    if (caption) caption.textContent = e.message;
    ctx.info(
      `${MISSIONS[ctx.stage - 1]} · ${city(e.location).name} · ${e.veteran ? "Veterano NFL" : "Esploratore"} · Record ${e.s.records[e.s.mode] || 0}`,
    );
  };
  const act = (fn) => () => {
    if (ctx.paused) return;
    fn();
    persist();
    paint();
  };
  function btn(parent, label, fn, cls) {
    const b = button(parent, label, act(fn), cls);
    b.dataset.focus = label;
    return b;
  }
  function check() {
    if (!e.finish()) return false;
    view = "map";
    drive = null;
    football = null;
    ctx.complete(ctx.stage);
    ctx.best("", e.s.records[e.s.mode]);
    ctx.play.dataset.state = "won";
    persist();
    paint();
    return true;
  }
  function shell() {
    root.replaceChildren();
    const top = node("header", undefined, "atlas-heading");
    top.append(
      node("p", "AVVENTURA 09 · ATLANTE SEGRETO", "eyebrow"),
      node("h2", MISSIONS[ctx.stage - 1]),
      node("p", "ROAD TO LOS ANGELES", "atlas-kicker"),
    );
    root.append(top);
    const modes = node("div", undefined, "atlas-modes");
    for (const [id, label] of [
      ["explorer", "Esploratore"],
      ["veteran", "Veterano NFL"],
    ]) {
      const b = btn(modes, label, () => {
        if (e.travel || view !== "map") return;
        e.setMode(id);
      });
      b.setAttribute("aria-pressed", String(e.s.mode === id));
      b.disabled = !!e.travel || view !== "map" || e.s.routeIndex > 0;
    }
    root.append(modes);
    caption = node("p", e.message, "atlas-radio");
    caption.setAttribute("role", "status");
    root.append(caption);
    stagePanel = node("div", undefined, "atlas-stage");
    root.append(stagePanel);
    say();
  }
  function paint() {
    const focus = root.contains(document.activeElement)
      ? document.activeElement.dataset.focus
      : null;
    renderController.abort();
    renderController = new AbortController();
    shell();
    if (e.s.won) {
      celebrate();
      return;
    }
    if (view === "drive") drawDriveUI();
    else if (view === "football") drawFootballUI();
    else drawMap();
    if (focus)
      [...root.querySelectorAll("[data-focus]")]
        .find((n) => n.dataset.focus === focus && !n.disabled)
        ?.focus({ preventScroll: true });
  }
  function celebrate() {
    stagePanel.className += " atlas-finale";
    if (ctx.stage === 5) {
      const art = node("img", undefined, "atlas-stadium");
      art.src = "./assets/atlas-stadium.svg";
      art.alt = "Stadio originale illuminato in blu e oro a Inglewood";
      stagePanel.append(art, node("div", undefined, "atlas-crowd"));
    }
    stagePanel.append(
      node("div", "⚡", "atlas-bolt"),
      node(
        "h3",
        ctx.stage === 5 ? "DALL’ATLANTICO AL PACIFICO!" : "Tappa conquistata!",
      ),
      node(
        "p",
        ctx.stage === 5
          ? "EHY AMICO! Dall’Atlantico al Pacifico! Hai attraversato l’America, trovato la strada e segnato il touchdown più importante: quello dell’avventura!"
          : "Il tuo tesoro è al sicuro. Scegli la prossima missione nel selettore in alto.",
      ),
      node(
        "p",
        ctx.stage === 5
          ? "SoFi Stadium · Inglewood, California · Frammento della Bussola del Tempo ritrovato!"
          : "Souvenir e progressi salvati nel diario.",
      ),
    );
    souvenirs(stagePanel);
  }
  function souvenirs(parent) {
    const detail = node("details");
    detail.append(
      node("summary", "Passaporto e souvenir · " + e.s.souvenirs.length),
    );
    for (const id of e.s.souvenirs) {
      detail.append(
        node("p", "Timbro · " + city(id).state),
        node("p", SOUVENIRS[id]),
      );
    }
    parent.append(detail);
  }
  function drawMap() {
    const board = node("div", undefined, "atlas-map-wrap");
    stagePanel.append(board);
    const map = svg("svg", {
      viewBox: "0 0 960 560",
      class: "atlas-map",
      "aria-label":
        "Mappa interattiva degli Stati Uniti: seleziona Stati e città",
      role: "group",
    });
    const group = svg("g");
    map.append(group);
    board.append(map);
    const updateView = () => {
      map.setAttribute(
        "viewBox",
        `${pan.x} ${pan.y} ${960 / zoom} ${560 / zoom}`,
      );
    };
    updateView();
    group.append(
      svg("rect", {
        x: -1000,
        y: -1000,
        width: 3000,
        height: 3000,
        fill: "#bce9ef",
      }),
    );
    for (const s of STATES) {
      const p = svg("path", {
        d: s.path,
        fill: e.s.neighbors.includes(s.name) ? "#f8cb55" : "#c9dea3",
        stroke: "#648975",
        "stroke-width": 0.7,
        tabindex: 0,
        role: "button",
        "aria-label": s.name,
        "data-state": s.name,
      });
      p.append(svg("title", {}, s.name));
      const choose = () => {
        if (ctx.paused || e.travel) return;
        e.state(s.name);
        persist();
        paint();
      };
      on(p, "click", (ev) => {
        if (placing || ev.detail !== 0) return;
        ev.stopPropagation();
        choose();
      });
      on(p, "keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          choose();
        }
      });
      group.append(p);
    }
    for (const [text, x, y] of [
      ["PACIFICO", 40, 340],
      ["ATLANTICO", 805, 350],
      ["CANADA", 410, 20],
      ["MESSICO", 350, 490],
      ["Alaska · riquadro", 35, 535],
      ["Hawaii · riquadro", 170, 535],
    ])
      group.append(svg("text", { x, y, class: "atlas-sea" }, text));
    // Illustrated, deliberately simplified road network, no claim of real distances.
    const itinerary = e.route.map((id) => project(city(id)));
    group.append(
      svg("polyline", {
        points: itinerary.map((p) => `${p.x},${p.y}`).join(" "),
        fill: "none",
        stroke: "#fff8df",
        "stroke-width": 8,
        "stroke-linejoin": "round",
      }),
    );
    group.append(
      svg("polyline", {
        points: itinerary.map((p) => `${p.x},${p.y}`).join(" "),
        fill: "none",
        stroke: "#d48d3f",
        "stroke-width": 3,
        "stroke-dasharray": "5 4",
      }),
    );
    for (const c of CITIES) {
      const p = project(c);
      const g = svg("g", {
        tabindex: 0,
        role: "button",
        "aria-label": "Viaggia a " + c.name,
        "data-city": c.id,
        class: "atlas-city",
      });
      g.append(
        svg("circle", {
          cx: p.x,
          cy: p.y,
          r: c.id === "inglewood" ? 2.2 : 5,
          fill: c.id === e.target ? "#f9bc35" : "#125c72",
          stroke: "white",
          "stroke-width": 1,
        }),
      );
      g.append(
        svg(
          "text",
          {
            x: p.x + 8,
            y: p.y + (c.id === "inglewood" ? 16 : -7),
            "font-size": 11,
            fill: "#123c51",
            "font-weight": 800,
          },
          c.name,
        ),
      );
      const go = () => {
        if (ctx.paused || placing) return;
        e.depart(c.id);
        persist();
        say();
      };
      on(g, "click", (ev) => {
        if (placing || ev.detail !== 0) return;
        ev.stopPropagation();
        go();
      });
      on(g, "keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          go();
        }
      });
      group.append(g);
    }
    camper = svg("g", { "aria-label": "Camper: posizione corrente" });
    camper.append(
      svg("rect", {
        x: -13,
        y: -15,
        width: 27,
        height: 16,
        rx: 4,
        fill: "#fff7dd",
        stroke: "#125c72",
        "stroke-width": 2,
      }),
      svg("rect", { x: 3, y: -12, width: 8, height: 7, fill: "#4bbed1" }),
      svg("path", { d: "M-10,-3H12", stroke: "#f2ad27", "stroke-width": 3 }),
      svg("circle", { cx: -7, cy: 3, r: 4, fill: "#203547" }),
      svg("circle", { cx: 8, cy: 3, r: 4, fill: "#203547" }),
    );
    group.append(camper);
    moveCamper();
    const cross = svg("g", {
      transform: `translate(${marker.x} ${marker.y})`,
      display: placing ? "block" : "none",
      "aria-hidden": true,
    });
    cross.append(
      svg("circle", {
        r: 10,
        fill: "none",
        stroke: "#ec6d40",
        "stroke-width": 2,
      }),
      svg("path", {
        d: "M-16 0H16M0 -16V16",
        stroke: "#ec6d40",
        "stroke-width": 2,
      }),
    );
    group.append(cross);
    let pointers = new Map(),
      start = null,
      moved = false;
    const local = (ev) => {
      const pt = map.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      return pt.matrixTransform(map.getScreenCTM().inverse());
    };
    on(map, "pointerdown", (ev) => {
      if (ctx.paused) return;
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      map.setPointerCapture(ev.pointerId);
      if (pointers.size === 1) {
        start = { x: ev.clientX, y: ev.clientY, pan: { ...pan } };
        moved = false;
      }
    });
    on(map, "pointermove", (ev) => {
      if (!pointers.has(ev.pointerId) || ctx.paused) return;
      const old = pointers.get(ev.pointerId);
      if (pointers.size === 2) {
        const other = [...pointers.entries()].find(
          ([id]) => id !== ev.pointerId,
        )[1];
        const before = Math.hypot(old.x - other.x, old.y - other.y);
        const after = Math.hypot(ev.clientX - other.x, ev.clientY - other.y);
        zoom = Math.max(1, Math.min(20, (zoom * after) / (before || 1)));
        moved = true;
        updateView();
      } else if (start && !placing) {
        const dx = ev.clientX - start.x,
          dy = ev.clientY - start.y;
        if (Math.hypot(dx, dy) > 6) {
          moved = true;
          pan = {
            x: start.pan.x - ((dx / map.clientWidth) * 960) / zoom,
            y: start.pan.y - ((dy / map.clientHeight) * 560) / zoom,
          };
          updateView();
        }
      }
      pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    });
    on(map, "pointerup", (ev) => {
      pointers.delete(ev.pointerId);
      if (ctx.paused) return;
      if (placing && !moved) {
        marker = local(ev);
        if (e.place(e.radioTarget, marker)) placing = false;
        persist();
        paint();
      } else if (!moved) {
        const target = document
          .elementFromPoint(ev.clientX, ev.clientY)
          ?.closest("[data-city],[data-state]");
        if (target) {
          if (target.dataset.city) e.depart(target.dataset.city);
          else e.state(target.dataset.state);
          persist();
          paint();
        }
      }
      start = null;
    });
    for (const type of ["pointercancel", "lostpointercapture"])
      on(map, type, (ev) => {
        pointers.delete(ev.pointerId);
        start = null;
      });
    const tools = node("div", undefined, "atlas-tools");
    stagePanel.append(tools);
    btn(tools, "Zoom +", () => {
      zoom = Math.min(20, zoom * 1.6);
    });
    btn(tools, "Zoom −", () => {
      zoom = Math.max(1, zoom / 1.6);
    });
    btn(tools, "Centra mappa", () => {
      zoom = 1;
      pan = { x: 0, y: 0 };
    });
    for (const [label, dx, dy] of [
      ["Sposta ovest", -80, 0],
      ["Sposta est", 80, 0],
      ["Sposta nord", 0, -60],
      ["Sposta sud", 0, 60],
    ])
      btn(tools, label, () => {
        pan.x += dx / zoom;
        pan.y += dy / zoom;
      });
    stagePanel.append(
      node(
        "p",
        "Strade semplificate · nessuna distanza reale · trascina per spostare, pizzica per ingrandire. Alaska e Hawaii in riquadri.",
        "atlas-caption",
      ),
    );
    const task = node("section", undefined, "atlas-task");
    stagePanel.append(task);
    const stateLabel = node("label", "Esplora uno Stato "),
      stateSelect = node("select");
    stateSelect.setAttribute("aria-label", "Stato sulla mappa");
    stateSelect.append(node("option", "Scegli uno Stato"));
    for (const s of [...STATES].sort((a, b) => a.name.localeCompare(b.name))) {
      const o = node("option", s.name);
      o.value = s.name;
      stateSelect.append(o);
    }
    stateLabel.append(stateSelect);
    task.append(stateLabel);
    on(stateSelect, "change", () => {
      if (ctx.paused) return;
      e.state(stateSelect.value);
      persist();
      paint();
    });
    task.append(
      node(
        "h3",
        e.target
          ? "Prossima tappa: " + city(e.target).name
          : "Checkpoint: " + city(e.location).name,
      ),
    );
    if (ctx.stage === 1 && e.s.routeIndex === 0) {
      task.append(
        node(
          "p",
          "Carica il navigatore: da New York visita Philadelphia e Washington nell’ordine geografico, da nord-est a sud-ovest.",
        ),
        node(
          "p",
          "Itinerario: New York → " +
            e.s.plan.map((id) => city(id).name).join(" → "),
        ),
      );
      for (const id of ["dc", "philly"])
        btn(task, "Pianifica " + city(id).name, () => e.plan(id));
      btn(task, "Svuota itinerario", () => e.plan("clear"));
    }
    if (ctx.stage === 1 && !e.prepared) {
      task.append(
        node(
          "p",
          "Prepara il camper: tocca New Jersey, Pennsylvania e Connecticut, confinanti con New York. Poi ruota la bussola verso OVEST.",
        ),
      );
      const small = node("div", undefined, "atlas-tools");
      task.append(small);
      for (const n of ["New Jersey", "Pennsylvania", "Connecticut"])
        btn(small, (e.s.neighbors.includes(n) ? "✓ " : "") + n, () =>
          e.state(n),
        );
    }
    if (ctx.stage === 1 || ctx.stage === 3) {
      task.append(
        node(
          "p",
          "Bussola: " + ["NORD ↑", "EST →", "SUD ↓", "OVEST ←"][e.s.compass],
        ),
      );
      btn(task, "Ruota la bussola", () => e.orient(1));
    }
    if (ctx.stage === 3 && e.arrived) {
      task.append(
        node(
          "p",
          "È luglio: ad Albuquerque sono le 12. A Flagstaff, Arizona, porta l’orologio indietro di un’ora. L’Arizona (salvo la Nazione Navajo) non usa l’ora legale.",
        ),
      );
      const label = node("label", "Orologio di Flagstaff "),
        input = node("input");
      input.type = "number";
      input.min = 0;
      input.max = 23;
      input.value = e.s.clock;
      input.setAttribute("aria-label", "Ora a Flagstaff");
      label.append(input);
      task.append(label);
      on(input, "change", () => {
        if (ctx.paused) return;
        e.s.clock = Number(input.value);
        persist();
        paint();
      });
    }
    if (ctx.stage === 2) radioTask(task);
    const stops = node("div", undefined, "atlas-destinations");
    task.append(stops);
    for (const c of CITIES) {
      const b = btn(
        stops,
        "Viaggia a " + c.name,
        () => e.depart(c.id),
        "secondary",
      );
      b.disabled = !!e.travel;
      b.dataset.destination = c.id;
    }
    if (e.readyForDrive)
      btn(task, e.s.driveWon ? "Guida completata" : "Accendi il camper", () => {
        drive = new DriveEngine(e.veteran);
        view = "drive";
      });
    if (e.readyForFootball)
      btn(task, "Entra nel campo", () => {
        football = new FootballEngine(e.veteran, ctx.stage === 5);
        view = "football";
      });
    if (ctx.stage === 3 && !e.readyForDrive && e.arrived)
      task.append(
        node("p", "Prima della guida: bussola a ovest e orologio sulle 11."),
      );
    if (ctx.stage === 5) {
      task.append(
        node(
          "p",
          "Segui il Mojave verso Las Vegas, poi Los Angeles e infine Inglewood, a sud-ovest del centro di Los Angeles.",
        ),
      );
      if (e.location === "la")
        btn(task, "Ingrandisci Los Angeles e Inglewood", () => {
          zoom = 20;
          pan = { x: 125, y: 263 };
        });
    }
    souvenirs(stagePanel);
    checkWithoutPaint();
  }
  function checkWithoutPaint() {
    if (!e.s.won && e.finish()) {
      ctx.complete(ctx.stage);
      ctx.best("", 1000);
      ctx.play.dataset.state = "won";
      persist();
      queueMicrotask(paint);
    }
  }
  function moveCamper() {
    if (!camper) return;
    let p = project(city(e.location));
    if (e.travel) {
      const a = project(city(e.travel.from)),
        b = project(city(e.travel.to)),
        t = reduced ? 1 : e.travel.t;
      p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    camper.setAttribute("transform", `translate(${p.x} ${p.y - 6})`);
  }
  function radioTask(task) {
    const id = e.radioTarget;
    if (!id) {
      task.append(node("p", "Tutti e sei i segnali recuperati!"));
      return;
    }
    const c = city(id);
    task.append(
      node("h4", "Radio · " + c.name),
      node("p", `${c.team} · Stadio: ${c.stadium}. ${c.fact}`),
    );
    if (e.location !== id) {
      task.append(
        node("p", "Raggiungi " + c.name + " per recuperare il segnale."),
      );
      return;
    }
    if (!e.s.placed.includes(id)) {
      task.append(
        node(
          "p",
          `Posiziona ${c.name} sulla mappa. ${e.veteran ? "Osserva coste e confini." : "Indizio: " + c.state + "."}`,
        ),
      );
      btn(
        task,
        placing ? "Segnaposto attivo: tocca la mappa" : "Prendi il segnaposto",
        () => {
          placing = true;
        },
      );
      if (placing) {
        const controls = node("div", undefined, "atlas-tools");
        task.append(controls);
        for (const [text, x, y] of [
          ["Segnaposto ovest", -10, 0],
          ["Segnaposto est", 10, 0],
          ["Segnaposto nord", 0, -10],
          ["Segnaposto sud", 0, 10],
        ])
          btn(controls, text, () => {
            marker.x += x;
            marker.y += y;
          });
        btn(controls, "Posa il segnaposto", () => {
          if (e.place(id, marker)) placing = false;
        });
      }
      return;
    }
    if (!e.s.associated.includes(id)) {
      task.append(node("p", "Tocca lo Stato di " + c.name + " sulla mappa."));
      return;
    }
    task.append(
      node(
        "p",
        `Porta il segnale sulla conference: ${id === "ny" ? "usa la scheda Giants (NFC); i Jets sono AFC." : c.team + " è nella " + c.conference + "."} Le due conference riuniscono 16 squadre ciascuna; le loro vincitrici si affrontano nel Super Bowl.`,
      ),
    );
    const label = node("label", "Sintonia · faro 70 (scala di gioco) "),
      input = node("input");
    input.type = "range";
    input.min = 0;
    input.max = 100;
    input.value = tuning;
    input.setAttribute("aria-label", "Sintonia radio");
    label.append(input);
    task.append(label);
    on(input, "input", () => {
      tuning = Number(input.value);
    });
    const token = node("div", c.team, "atlas-token");
    token.draggable = true;
    token.setAttribute("aria-label", "Scheda squadra da trascinare");
    task.append(token);
    on(token, "dragstart", (ev) =>
      ev.dataTransfer.setData("text/plain", "team"),
    );
    for (const conf of ["AFC", "NFC"]) {
      const b = btn(task, "Collega a " + conf, () => e.signal(conf, tuning));
      on(b, "dragover", (ev) => ev.preventDefault());
      on(b, "drop", (ev) => {
        ev.preventDefault();
        if (ctx.paused) return;
        e.signal(conf, tuning);
        persist();
        paint();
      });
    }
  }
  function makeCanvas(label) {
    canvas = node("canvas", undefined, "atlas-canvas");
    canvas.width = 800;
    canvas.height = 560;
    canvas.setAttribute("aria-label", label);
    stagePanel.append(canvas);
  }
  function drawDriveUI() {
    stagePanel.append(
      node(
        "h3",
        ctx.stage === 3
          ? "Il Deserto delle 1000 Miglia"
          : "Il primo tratto di strada",
      ),
      node(
        "p",
        "Frecce ← → o tieni premuti i comandi. Raccogli almeno 3 taniche e raggiungi 1000 unità di gioco. I coni tolgono carburante. Nessun timer: puoi riprovare. Il titolo è narrativo, non una distanza reale.",
      ),
    );
    makeCanvas("Guida del camper: ostacoli e carburante su tre corsie");
    const controls = node("div", undefined, "atlas-tools atlas-live-controls");
    stagePanel.append(controls);
    for (const [label, dir] of [
      ["Sterza a sinistra", -1],
      ["Sterza a destra", 1],
    ]) {
      const b = button(controls, label, () => {});
      on(b, "pointerdown", (ev) => {
        if (ctx.paused) return;
        ev.preventDefault();
        b.setPointerCapture(ev.pointerId);
        steer = dir;
      });
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"])
        on(b, t, () => (steer = 0));
      on(b, "keydown", (ev) => {
        if ([" ", "Enter"].includes(ev.key) && !ctx.paused) {
          ev.preventDefault();
          steer = dir;
        }
      });
      on(b, "keyup", () => (steer = 0));
    }
    btn(controls, "Ricomincia guida", () => {
      steer = 0;
      drive = new DriveEngine(e.veteran);
    });
    renderDrive();
  }
  function renderDrive() {
    if (!canvas || !drive) return;
    const g = canvas.getContext("2d");
    g.fillStyle = ctx.stage === 3 ? "#f6c481" : "#a9d59c";
    g.fillRect(0, 0, 800, 560);
    g.fillStyle = "#d98c57";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(i * 180 - 90, 200);
      g.lineTo(i * 180, 80);
      g.lineTo(i * 180 + 100, 200);
      g.fill();
    }
    g.fillStyle = "#ffe4a0";
    g.beginPath();
    g.arc(650, 85, 32, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 4; i++) {
      const y = 220 + ((drive.distance * 2 + i * 90) % 330),
        left = i % 2 === 0,
        x = left ? 55 : 745;
      if (ctx.stage === 3) {
        g.strokeStyle = "#508365";
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(x, y + 20);
        g.lineTo(x, y - 25);
        g.moveTo(x, y);
        g.lineTo(x - 16, y);
        g.lineTo(x - 16, y - 14);
        g.moveTo(x, y - 8);
        g.lineTo(x + 16, y - 8);
        g.lineTo(x + 16, y - 20);
        g.stroke();
      } else {
        g.fillStyle = "#6e7953";
        g.fillRect(x - 4, y, 8, 30);
        g.fillStyle = "#48875f";
        g.beginPath();
        g.arc(x, y - 4, 22, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = "#fff3cb";
    g.fillRect(35, 115, 160, 46);
    g.fillStyle = "#15516c";
    g.font = "bold 17px sans-serif";
    g.fillText(ctx.stage === 3 ? "ROUTE 66 · WEST" : "CAMPER · WEST", 43, 144);
    g.fillStyle = "#587781";
    g.beginPath();
    g.moveTo(310, 100);
    g.lineTo(490, 100);
    g.lineTo(700, 560);
    g.lineTo(100, 560);
    g.fill();
    g.strokeStyle = "#fff3ca";
    g.lineWidth = 6;
    g.setLineDash([28, 24]);
    for (const x of [300, 500]) {
      g.beginPath();
      g.moveTo(400 + (x - 400) * 0.35, 130);
      g.lineTo(x, 560);
      g.stroke();
    }
    g.setLineDash([]);
    for (const item of drive.items) {
      const y = 100 + item.y * 460,
        x = 140 + item.x * 520;
      g.fillStyle = item.fuel ? "#83e29e" : "#ee774d";
      g.fillRect(x - 14, y - 20, 28, 30);
      g.fillStyle = "#143e52";
      g.font = "bold 20px sans-serif";
      g.fillText(item.fuel ? "+" : "▲", x - 8, y + 3);
    }
    const x = 140 + drive.x * 520;
    g.fillStyle = "#fff5d6";
    g.fillRect(x - 28, 440, 56, 65);
    g.fillStyle = "#41b4cf";
    g.fillRect(x - 23, 447, 46, 20);
    g.fillStyle = "#f6bf36";
    g.fillRect(x - 28, 476, 56, 9);
    g.fillStyle = "#253a49";
    g.fillRect(x - 35, 478, 9, 25);
    g.fillRect(x + 26, 478, 9, 25);
    g.fillStyle = "#143e52";
    g.font = "bold 22px sans-serif";
    g.fillText(
      `${Math.floor(drive.distance)} / 1000 · Taniche ${drive.pickups}/3 · Carburante ${Math.max(0, Math.round(drive.fuel))}`,
      20,
      38,
    );
    if (drive.failed) {
      g.fillStyle = "#fff5dd";
      g.fillRect(80, 210, 640, 120);
      g.fillStyle = "#143e52";
      g.fillText(
        "Serbatoio vuoto. Riprova e cerca le taniche verdi.",
        100,
        270,
      );
    }
  }
  function drawFootballUI() {
    if (ctx.stage === 5) {
      const art = node("img", undefined, "atlas-stadium");
      art.src = "./assets/atlas-stadium.svg";
      art.alt = "La notte del gran finale a Inglewood";
      stagePanel.append(art);
    }
    stagePanel.append(
      node(
        "h3",
        ctx.stage === 5
          ? "La notte blu e oro · Inglewood"
          : "Laboratorio del quarterback",
      ),
      node(
        "p",
        e.veteran
          ? "Tre difensori leggono il passaggio. Allarga i ricevitori e anticipa la difesa."
          : "Un difensore presidia il centro. Allarga un ricevitore e passa presto sulla fascia.",
      ),
      node(
        "p",
        "Tocca un giocatore, poi un punto del campo per spostarlo prima dell’azione. Puoi anche usare i cursori. Le traiettorie si cambiano prima del via.",
      ),
    );
    makeCanvas(
      "Campo football interattivo: quarterback, ricevitori e difensori",
    );
    const live = node("div", undefined, "atlas-tools atlas-live-controls");
    stagePanel.append(live);
    const setup = node("details");
    setup.open = football.phase === "setup";
    setup.append(node("summary", "Formazione e traiettorie"));
    const controls = node("div", undefined, "atlas-tools");
    setup.append(controls);
    stagePanel.append(setup);
    for (const [i, label] of [
      [-1, "Quarterback"],
      [0, "Ricevitore 1"],
      [1, "Ricevitore 2"],
    ]) {
      btn(controls, "Posiziona " + label, () => (picked = i));
      const l = node("label", label + " · posizione laterale "),
        input = node("input");
      input.type = "range";
      input.min = 10;
      input.max = 90;
      input.value = i === -1 ? football.qb.x : football.receivers[i].x;
      input.setAttribute("aria-label", "Posizione " + label);
      input.disabled = football.phase !== "setup";
      l.append(input);
      controls.append(l);
      on(input, "input", () => {
        if (ctx.paused) return;
        football.position(i, Number(input.value));
        persist();
        renderFootball();
      });
    }
    for (let i = 0; i < 2; i++) {
      const b = btn(
        controls,
        `Traiettoria ${i + 1}: ${football.receivers[i].route === "straight" ? "verticale" : "incrocio"}`,
        () => football.route(i),
      );
      b.disabled = football.phase !== "setup";
    }
    const start = btn(live, "Avvia azione", () => football.start());
    start.disabled = football.phase !== "setup";
    for (let i = 0; i < 2; i++)
      btn(live, "Passa al ricevitore " + (i + 1), () => football.pass(i));
    btn(live, "Nuova azione", () => football.reset());
    on(canvas, "pointerdown", (ev) => {
      if (ctx.paused || football.phase !== "setup") return;
      const r = canvas.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 100,
        y = ((ev.clientY - r.top) / r.height) * 100;
      const players = [football.qb, ...football.receivers];
      const index = players.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 8);
      if (index >= 0) picked = index - 1;
      else football.position(picked, x);
      persist();
      renderFootball();
    });
    renderFootball();
  }
  function renderFootball() {
    if (!canvas || !football) return;
    const g = canvas.getContext("2d");
    g.fillStyle = "#20866c";
    g.fillRect(0, 0, 800, 560);
    for (let i = 1; i < 10; i++) {
      g.fillStyle = i % 2 ? "#268e72" : "#20866c";
      g.fillRect(30, i * 50, 740, 50);
      g.strokeStyle = "#bfe8ce";
      g.beginPath();
      g.moveTo(30, i * 50);
      g.lineTo(770, i * 50);
      g.stroke();
    }
    g.fillStyle = "#156589";
    g.fillRect(30, 20, 740, 48);
    g.fillStyle = "#ffe183";
    g.font = "bold 26px sans-serif";
    g.fillText("LOS ANGELES · ROAD TO GLORY", 125, 54);
    const path = (p, i) => {
      g.strokeStyle = i ? "#ffe183" : "#c1f6ff";
      g.lineWidth = 3;
      g.setLineDash([9, 8]);
      g.beginPath();
      g.moveTo(p.x * 8, p.y * 5.6);
      g.lineTo(p.route === "cross" ? (i ? 30 : 70) * 8 : p.x * 8, 40);
      g.stroke();
      g.setLineDash([]);
    };
    if (football.phase === "setup") football.receivers.forEach(path);
    for (const [p, color, label] of [
      [football.qb, "#ffd364", "QB"],
      ...football.receivers.map((p, i) => [p, "#aeeaff", String(i + 1)]),
      ...football.defenders.map((p) => [p, "#f38c68", "D"]),
    ]) {
      g.fillStyle = color;
      g.beginPath();
      g.arc(p.x * 8, p.y * 5.6, 17, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#163c50";
      g.font = "bold 14px sans-serif";
      g.fillText(label, p.x * 8 - 9, p.y * 5.6 + 5);
    }
    if (football.ball) {
      g.fillStyle = "#713e25";
      g.beginPath();
      g.ellipse(football.ball.x * 8, football.ball.y * 5.6, 10, 6, -0.6, 0, 7);
      g.fill();
    }
    g.fillStyle = "#fff5d9";
    g.fillRect(12, 515, 776, 36);
    g.fillStyle = "#153b4f";
    g.font = "bold 17px sans-serif";
    g.fillText(football.message, 22, 540);
  }
  const contextualHint = () =>
    e.message +
    " " +
    (e.target
      ? "Segui la rotta verso " + city(e.target).name + "."
      : "Completa l’attività al checkpoint.") +
    (view === "football"
      ? " Porta il ricevitore 1 sulla fascia destra, usa la verticale e passa presto."
      : view === "drive"
        ? " Le taniche verdi alternano le tre corsie: avvicinati prima che raggiungano il camper."
        : "");
  ctx.getHints = () => [
    "Ehy Amico! " +
      (view === "drive"
        ? "Le taniche verdi riforniscono il camper. I coni consumano carburante."
        : view === "football"
          ? "Prova a liberare una fascia e osserva i difensori."
          : e.target
            ? "Consulta la mappa: la prossima tappa è " +
              city(e.target).name +
              "."
            : "Siamo al checkpoint: completa la sfida locale."),
    contextualHint(),
    view === "football"
      ? "Prima del via porta il ricevitore 1 a destra con il cursore, scegli verticale, avvia e passa al ricevitore 1. Puoi riprovare ogni azione."
      : view === "drive"
        ? "Le taniche arrivano in sequenza sulle corsie sinistra, destra e centro. Tieni premuto un comando per sterzare e rilascialo per mantenere la corsia."
        : ctx.stage === 1
          ? "Tocca New Jersey, Pennsylvania e Connecticut. Pianifica Philadelphia, poi Washington; ruota la bussola tre volte da nord a ovest."
          : ctx.stage === 2 && e.radioTarget
            ? "Segnaposto vicino a " +
              city(e.radioTarget).name +
              ", Stato: " +
              city(e.radioTarget).state +
              ". Sintonia 70. Conference: " +
              (e.radioTarget === "ny"
                ? "NFC per la scheda Giants"
                : city(e.radioTarget).conference) +
              "."
            : ctx.stage === 3
              ? "Segui le tappe, orienta la bussola a ovest e imposta le 11 a Flagstaff: in luglio è un’ora prima di Albuquerque."
              : "Raggiungi Inglewood dopo Los Angeles: SoFi Stadium è in un comune distinto, a sud-ovest. Entra nel campo per il touchdown finale.",
  ];
  ctx.listen(window, "keydown", (ev) => {
    if (
      ctx.paused ||
      view !== "drive" ||
      !["ArrowLeft", "ArrowRight"].includes(ev.key) ||
      ["INPUT", "SELECT"].includes(ev.target.tagName)
    )
      return;
    ev.preventDefault();
    steer = ev.key === "ArrowLeft" ? -1 : 1;
  });
  ctx.listen(window, "keyup", (ev) => {
    if (["ArrowLeft", "ArrowRight"].includes(ev.key)) steer = 0;
  });
  ctx.listen(ctx.play, "game:pausechange", () => {
    steer = 0;
    persist();
  });
  ctx.onCleanup(() => {
    renderController.abort();
    persist();
  });
  if (
    !ctx.restart &&
    previous?.view === "drive" &&
    previous.drive &&
    !e.s.won
  ) {
    drive = new DriveEngine(e.veteran, previous.drive);
    view = "drive";
  }
  if (
    !ctx.restart &&
    previous?.view === "football" &&
    previous.football &&
    !e.s.won
  ) {
    football = new FootballEngine(e.veteran, ctx.stage === 5);
    Object.assign(football, previous.football);
    view = "football";
  }
  paint();
  ctx.frames((dt) => {
    stamp += dt;
    if (view === "map") {
      if (e.tick(dt)) {
        persist();
        paint();
      } else moveCamper();
    }
    if (view === "drive") {
      drive.step(dt, steer);
      renderDrive();
      if (drive.done) {
        e.s.driveWon = true;
        e.s.records[e.s.mode] = Math.max(
          e.s.records[e.s.mode],
          Math.round(1200 - drive.hits * 20),
        );
        check();
      }
    }
    if (view === "football") {
      football.step(dt);
      renderFootball();
      if (football.phase === "won") {
        e.s.footballWon = true;
        e.s.records[e.s.mode] = Math.max(
          e.s.records[e.s.mode],
          1000 + football.yards,
        );
        check();
      }
    }
    if (stamp > 1) {
      stamp = 0;
      persist();
    }
  });
}
